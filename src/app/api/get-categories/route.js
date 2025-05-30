import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
export const runtime = 'nodejs';

export async function GET(req) {
  try {
    // Ottieni il parametro language dalla query string, se presente
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || 'it'; // Default a italiano se non specificato
    
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
      
      // 3. Ottieni le traduzioni delle categorie per la lingua richiesta
      const translationsResult = await client.query(`
        SELECT
          category_name,
          translated_name
        FROM category_translations
        WHERE language_code = $1
      `, [language]);
      
      // Log per debug - mostra tutte le traduzioni disponibili
      console.log('Traduzioni disponibili nel database:');
      translationsResult.rows.forEach(row => {
        console.log(`- "${row.category_name}" => "${row.translated_name}"`);
      });
      
      // Crea una mappa delle traduzioni per un accesso più veloce
      const translationsMap = {};
      translationsResult.rows.forEach(row => {
        // Normalizza la chiave per evitare problemi di formattazione
        const normalizedKey = row.category_name.trim().toLowerCase();
        translationsMap[normalizedKey] = row.translated_name;
        // Mantieni anche la versione originale per compatibilità
        translationsMap[row.category_name] = row.translated_name;
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
        
        // Prova diverse varianti per trovare una traduzione
        let translation = null;
        
        // 1. Prova con la categoria normalizzata
        if (translationsMap[normalizedCategory]) {
          translation = translationsMap[normalizedCategory];
        }
        // 2. Prova con la categoria originale
        else if (translationsMap[cat.category]) {
          translation = translationsMap[cat.category];
        }
        // 3. Prova con la categoria senza spazi iniziali/finali
        else if (translationsMap[cat.category.trim()]) {
          translation = translationsMap[cat.category.trim()];
        }
        
        // Assegna la traduzione trovata o usa il nome originale
        cat.translated_name = translation || cat.category;
        
        // Aggiungi log per debug
        console.log(`Categoria: "${cat.category}", Normalizzata: "${normalizedCategory}", Traduzione: "${cat.translated_name}", Trovata: ${!!translation}`);
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
