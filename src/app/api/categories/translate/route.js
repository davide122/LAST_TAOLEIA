import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';
import pool from '../../../../utils/db';

// Inizializza la connessione al database
const sql = neon(process.env.DATABASE_URL);

// Inizializza il client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Lingue supportate per la traduzione
const supportedLanguages = ['it', 'en', 'fr', 'es', 'de'];

/**
 * Endpoint per tradurre le categorie in diverse lingue
 * 
 * Richiede:
 * - target_languages: Array di codici lingua (opzionale, default: tutte le lingue supportate)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const target_languages = body.target_languages || supportedLanguages;
    
    // Filtra le lingue non supportate
    const languages = target_languages.filter(lang => supportedLanguages.includes(lang));
    
    if (languages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nessuna lingua valida specificata' },
        { status: 400 }
      );
    }
    
    // Recupera tutte le categorie uniche dal database
    const client = await pool.connect();
    try {
      // Ottieni categorie dalle attività
      const activitiesResult = await client.query(`
        SELECT DISTINCT category
        FROM activities
        WHERE category IS NOT NULL
          AND category != ''
        ORDER BY category
      `);
      
      // Ottieni categorie dalle keywords
      const keywordsResult = await client.query(`
        SELECT DISTINCT category
        FROM keywords
        WHERE category IS NOT NULL
          AND category != ''
        ORDER BY category
      `);
      
      // Combina e rimuovi duplicati
      const allCategories = [
        ...activitiesResult.rows.map(row => row.category),
        ...keywordsResult.rows.map(row => row.category)
      ];
      const uniqueCategories = [...new Set(allCategories)];
      
      if (uniqueCategories.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Nessuna categoria trovata' },
          { status: 404 }
        );
      }
      
      // Risultati delle traduzioni
      const translations = {};
      
      // Traduci in ciascuna lingua richiesta
      for (const lang of languages) {
        // Salta la traduzione se la lingua è italiana (assumiamo che i dati originali siano in italiano)
        if (lang === 'it') {
          translations[lang] = uniqueCategories;
          continue;
        }
        
        // Prepara il testo da tradurre in formato JSON
        const contentToTranslate = JSON.stringify(uniqueCategories);
        
        // Chiama l'API di OpenAI per la traduzione
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // o un altro modello disponibile
          messages: [
            {
              role: "system",
              content: `Sei un traduttore professionale. Traduci il seguente array JSON di categorie dall'italiano alla lingua ${lang}. IMPORTANTE: Restituisci SOLO l'array JSON tradotto, senza delimitatori di codice o altri caratteri. Il risultato deve essere un array JSON valido che può essere analizzato direttamente con JSON.parse().`
            },
            {
              role: "user",
              content: contentToTranslate
            }
          ],
          temperature: 0.3,
        });
        
        // Estrai la risposta tradotta
        const translatedContent = response.choices[0].message.content;
        
        try {
          // Converti la risposta in array JSON
          const translatedCategories = JSON.parse(translatedContent);
          translations[lang] = translatedCategories;
          
          // Salva le traduzioni nel database
          for (let i = 0; i < uniqueCategories.length; i++) {
            const originalCategory = uniqueCategories[i];
            const translatedCategory = translatedCategories[i];
            
            // Normalizza la categoria originale rimuovendo spazi iniziali/finali
            const normalizedOriginalCategory = originalCategory.trim();
            
            // Log per debug
            console.log(`Salvando traduzione: "${normalizedOriginalCategory}" => "${translatedCategory}" (${lang})`);
            
            // Salva la traduzione con la categoria normalizzata
            await client.query(`
              INSERT INTO category_translations (
                category_name, language_code, translated_name
              ) VALUES ($1, $2, $3)
              ON CONFLICT (category_name, language_code) 
              DO UPDATE SET 
                translated_name = $3,
                updated_at = CURRENT_TIMESTAMP
            `, [normalizedOriginalCategory, lang, translatedCategory]);
          }
        } catch (error) {
          console.error(`Errore nel parsing della traduzione per la lingua ${lang}:`, error);
          translations[lang] = { error: 'Errore nella traduzione' };
        }
      }
      
      return NextResponse.json({
        success: true,
        translations
      });
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Errore nella traduzione delle categorie:', error);
    return NextResponse.json(
      { success: false, message: 'Errore durante la traduzione', error: error.message },
      { status: 500 }
    );
  }
}