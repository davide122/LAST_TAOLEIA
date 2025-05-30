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
 * Endpoint per tradurre le parole chiave di una categoria in diverse lingue
 * 
 * Richiede:
 * - category: Categoria delle parole chiave da tradurre
 * - target_languages: Array di codici lingua (opzionale, default: tutte le lingue supportate)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const category = body.category;
    const target_languages = body.target_languages || supportedLanguages;
    
    // Verifica che la categoria sia fornita
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Categoria mancante' },
        { status: 400 }
      );
    }
    
    // Filtra le lingue non supportate
    const languages = target_languages.filter(lang => supportedLanguages.includes(lang));
    
    if (languages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nessuna lingua valida specificata' },
        { status: 400 }
      );
    }
    
    // Recupera le parole chiave della categoria dal database
    const client = await pool.connect();
    try {
      const keywordsResult = await client.query(
        'SELECT keyword FROM keywords WHERE category = $1',
        [category]
      );
      
      if (keywordsResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Nessuna parola chiave trovata per questa categoria' },
          { status: 404 }
        );
      }
      
      // Estrai le parole chiave
      const keywords = keywordsResult.rows.map(row => row.keyword);
      
      // Risultati delle traduzioni
      const translations = {};
      
      // Traduci in ciascuna lingua richiesta
      for (const lang of languages) {
        // Salta la traduzione se la lingua è italiana (assumiamo che i dati originali siano in italiano)
        if (lang === 'it') {
          translations[lang] = keywords;
          continue;
        }
        
        // Prepara il testo da tradurre in formato JSON
        const contentToTranslate = JSON.stringify(keywords);
        
        // Chiama l'API di OpenAI per la traduzione
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // o un altro modello disponibile
          messages: [
            {
              role: "system",
              content: `Sei un traduttore professionale. Traduci il seguente array JSON di parole chiave dall'italiano alla lingua ${lang}. IMPORTANTE: Restituisci SOLO l'array JSON tradotto, senza delimitatori di codice o altri caratteri. Il risultato deve essere un array JSON valido che può essere analizzato direttamente con JSON.parse().`
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
          const translatedKeywords = JSON.parse(translatedContent);
          translations[lang] = translatedKeywords;
          
          // Salva le traduzioni nel database
          for (let i = 0; i < keywords.length; i++) {
            const originalKeyword = keywords[i];
            const translatedKeyword = translatedKeywords[i];
            
            // Ottieni l'ID della parola chiave originale
            const keywordIdResult = await client.query(
              'SELECT id FROM keywords WHERE keyword = $1 AND category = $2',
              [originalKeyword, category]
            );
            
            if (keywordIdResult.rows.length > 0) {
              const keywordId = keywordIdResult.rows[0].id;
              
              // Salva la traduzione
              await client.query(`
                INSERT INTO keyword_translations (
                  keyword_id, language_code, keyword
                ) VALUES ($1, $2, $3)
                ON CONFLICT (keyword_id, language_code) 
                DO UPDATE SET 
                  keyword = $3,
                  updated_at = CURRENT_TIMESTAMP
              `, [keywordId, lang, translatedKeyword]);
            }
          }
        } catch (error) {
          console.error(`Errore nel parsing della traduzione per la lingua ${lang}:`, error);
          translations[lang] = { error: 'Errore nella traduzione' };
        }
      }
      
      return NextResponse.json({
        success: true,
        category,
        translations
      });
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Errore nella traduzione delle parole chiave:', error);
    return NextResponse.json(
      { success: false, message: 'Errore durante la traduzione', error: error.message },
      { status: 500 }
    );
  }
}