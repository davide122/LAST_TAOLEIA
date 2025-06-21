import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
export const runtime = 'nodejs';

export async function GET(req) {
  try {
    // Ottieni il parametro language dalla query string, se presente
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || 'it'; // Default a italiano se non specificato, ma ora è opzionale
    
    const client = await pool.connect();
    try {
      // 1. Ottieni le categorie dalle attività
      const activitiesResult = await client.query(`
        SELECT
          category,
          array_agg(DISTINCT name ORDER BY name) AS names
        FROM activities
        WHERE category IS NOT NULL
          AND category != ''
          AND name IS NOT NULL
          AND name != ''
        GROUP BY category
        ORDER BY category
      `);
      
      // 2. Ottieni le parole chiave personalizzate
      const keywordsResult = await client.query(`
        SELECT
          category,
          array_agg(DISTINCT keyword ORDER BY keyword) AS keywords
        FROM keywords
        WHERE category IS NOT NULL
          AND category != ''
          AND keyword IS NOT NULL
          AND keyword != ''
        GROUP BY category
        ORDER BY category
      `);
      
      // 3. Ottieni TUTTE le traduzioni delle categorie per tutte le lingue
      const translationsResult = await client.query(`
        SELECT
          category_name,
          translated_name,
          language_code
        FROM category_translations
      `);
      
      // Crea una mappa delle traduzioni organizzata per lingua
      const translationsMap = {};
      translationsResult.rows.forEach(row => {
        // Inizializza l'oggetto per la lingua se non esiste
        if (!translationsMap[row.language_code]) {
          translationsMap[row.language_code] = {};
        }
        
        // Normalizza la chiave per evitare problemi di formattazione
        const normalizedKey = row.category_name.trim().toLowerCase();
        translationsMap[row.language_code][normalizedKey] = row.translated_name;
        // Mantieni anche la versione originale per compatibilità
        translationsMap[row.language_code][row.category_name] = row.translated_name;
      });
      
      // 4. Combina i risultati
      const categories = [...activitiesResult.rows];
      
      // Aggiungi le parole chiave personalizzate alle categorie esistenti o crea nuove categorie
      keywordsResult.rows.forEach(keywordItem => {
        const existingCategory = categories.find(cat => cat.category === keywordItem.category);
        
        if (existingCategory) {
          // Aggiungi le parole chiave alla categoria esistente
          existingCategory.names = [...existingCategory.names, ...keywordItem.keywords];
          // Rimuovi duplicati
          existingCategory.names = [...new Set(existingCategory.names)];
        } else {
          // Crea una nuova categoria con le parole chiave
          categories.push({
            category: keywordItem.category,
            names: keywordItem.keywords
          });
        }
      });

      // Ordina le categorie per nome
      categories.sort((a, b) => a.category.localeCompare(b.category));
      
      // Aggiungi le traduzioni alle categorie
      categories.forEach(cat => {
        // Normalizza la categoria per la ricerca
        const normalizedCategory = cat.category.trim().toLowerCase();
        
        // Inizializza l'oggetto delle traduzioni per questa categoria
        cat.translations = {};
        
        // Aggiungi la categoria originale come traduzione di default per tutte le lingue
        const supportedLanguages = ['it', 'en', 'fr', 'de', 'es'];
        supportedLanguages.forEach(lang => {
          cat.translations[lang] = cat.category;
        });
        
        // Aggiungi tutte le traduzioni disponibili
        Object.keys(translationsMap).forEach(lang => {
          // Prova diverse varianti per trovare una traduzione
          let translation = null;
          
          // 1. Prova con la categoria normalizzata
          if (translationsMap[lang][normalizedCategory]) {
            translation = translationsMap[lang][normalizedCategory];
          }
          // 2. Prova con la categoria originale
          else if (translationsMap[lang][cat.category]) {
            translation = translationsMap[lang][cat.category];
          }
          // 3. Prova con la categoria senza spazi iniziali/finali
          else if (translationsMap[lang][cat.category.trim()]) {
            translation = translationsMap[lang][cat.category.trim()];
          }
          
          // Assegna la traduzione trovata o mantieni il nome originale
          if (translation) {
            cat.translations[lang] = translation;
          }
        });
        
        // Mantieni la compatibilità con il codice esistente usando la lingua richiesta
        cat.translated_name = cat.translations[language] || cat.category;
      });

      // rows = [ { category: 'Sport', translated_name: 'Sports', names: ['Calcio','Tennis',...] }, ... ]
      return NextResponse.json({ 
        categories,
        language // Includi la lingua utilizzata nella risposta
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Errore get-categories:', err);
    return NextResponse.json(
      { error: 'Errore durante il recupero delle categorie' },
      { status: 500 }
    );
  }
}
