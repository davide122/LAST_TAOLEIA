import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';

// Inizializza la connessione al database
const sql = neon(process.env.DATABASE_URL);

// Inizializza il client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Lingue supportate per la traduzione
const supportedLanguages = ['it', 'en', 'fr', 'es', 'de'];

/**
 * Endpoint per tradurre un'attività in diverse lingue
 * 
 * Richiede:
 * - activity_id: ID dell'attività da tradurre
 * - target_languages: Array di codici lingua (opzionale, default: tutte le lingue supportate)
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const activity_id = body.activity_id;
    const target_languages = body.target_languages || supportedLanguages;
    
    // Verifica che l'ID dell'attività sia fornito
    if (!activity_id) {
      return NextResponse.json(
        { success: false, message: 'ID attività mancante' },
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
    
    // Recupera i dati dell'attività dal database
    const activity = await sql`
      SELECT name, description, menu, prices, audio_guide_text
      FROM activities
      WHERE id = ${activity_id}
    `;
    
    if (activity.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Attività non trovata' },
        { status: 404 }
      );
    }
    
    const activityData = activity[0];
    
    // Risultati delle traduzioni
    const translations = {};
    
    // Traduci in ciascuna lingua richiesta
    for (const lang of languages) {
      // Salta la traduzione se la lingua è italiana (assumiamo che i dati originali siano in italiano)
      if (lang === 'it') {
        translations[lang] = {
          name: activityData.name,
          description: activityData.description,
          menu: activityData.menu,
          prices: activityData.prices,
          audio_guide_text: activityData.audio_guide_text
        };
        continue;
      }
      
      // Prepara il testo da tradurre in formato JSON
      const contentToTranslate = JSON.stringify({
        name: activityData.name || '',
        description: activityData.description || '',
        menu: activityData.menu || '',
        prices: activityData.prices || '',
        audio_guide_text: activityData.audio_guide_text || ''
      });
      
      // Chiama l'API di OpenAI per la traduzione
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // o un altro modello disponibile
        messages: [
          {
            role: "system",
            content: `Sei un traduttore professionale. Traduci il seguente JSON dall'italiano alla lingua ${lang}. IMPORTANTE: Restituisci SOLO il JSON tradotto, senza delimitatori di codice o altri caratteri. Mantieni la struttura JSON e traduci solo i valori. Non tradurre i nomi dei campi. Il risultato deve essere un oggetto JSON valido che può essere analizzato direttamente con JSON.parse().`
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
        // Converti la risposta in oggetto JSON
        const translatedData = JSON.parse(translatedContent);
        translations[lang] = translatedData;
        
        // Salva la traduzione nel database
        await sql`
          INSERT INTO activity_translations (
            activity_id, language_code, name, description, menu, prices, audio_guide_text
          ) VALUES (
            ${activity_id}, ${lang}, 
            ${translatedData.name}, ${translatedData.description}, 
            ${translatedData.menu}, ${translatedData.prices}, 
            ${translatedData.audio_guide_text}
          )
          ON CONFLICT (activity_id, language_code) 
          DO UPDATE SET 
            name = ${translatedData.name},
            description = ${translatedData.description},
            menu = ${translatedData.menu},
            prices = ${translatedData.prices},
            audio_guide_text = ${translatedData.audio_guide_text},
            updated_at = CURRENT_TIMESTAMP
        `;
      } catch (error) {
        console.error(`Errore nel parsing della traduzione per la lingua ${lang}:`, error);
        translations[lang] = { error: 'Errore nella traduzione' };
      }
    }
    
    return NextResponse.json({
      success: true,
      activity_id,
      translations
    });
    
  } catch (error) {
    console.error('Errore nella traduzione dell\'attività:', error);
    return NextResponse.json(
      { success: false, message: 'Errore durante la traduzione', error: error.message },
      { status: 500 }
    );
  }
}