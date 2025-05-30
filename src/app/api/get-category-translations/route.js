import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
export const runtime = 'nodejs';

/**
 * Endpoint per recuperare le traduzioni delle categorie per una lingua specifica
 * 
 * Parametri query:
 * - language: codice lingua (default: 'it')
 */
export async function GET(req) {
  try {
    // Ottieni il parametro language dalla query string, se presente
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || 'it'; // Default a italiano se non specificato
    
    const client = await pool.connect();
    try {
      // Ottieni le traduzioni delle categorie per la lingua richiesta
      const translationsResult = await client.query(`
        SELECT
          category_name,
          translated_name
        FROM category_translations
        WHERE language_code = $1
      `, [language]);
      
      // Crea un oggetto con le traduzioni per un accesso più veloce
      const translations = {};
      translationsResult.rows.forEach(row => {
        translations[row.category_name] = row.translated_name;
      });

      return NextResponse.json({ 
        success: true,
        translations,
        language // Includi la lingua utilizzata nella risposta
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Errore get-category-translations:', err);
    return NextResponse.json(
      { success: false, error: 'Errore durante il recupero delle traduzioni delle categorie' },
      { status: 500 }
    );
  }
}