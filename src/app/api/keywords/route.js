import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
export const runtime = 'nodejs';

// GET: Recupera tutte le parole chiave
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Raggruppa per categoria e aggrega in un array tutte le parole chiave distinte
      const { rows } = await client.query(`
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

      return NextResponse.json({ success: true, keywords: rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Errore recupero keywords:', err);
    return NextResponse.json(
      { success: false, error: 'Errore durante il recupero delle parole chiave' },
      { status: 500 }
    );
  }
}

// POST: Aggiungi nuove parole chiave
export async function POST(request) {
  try {
    const { keywords, category } = await request.json();
    
    if (!keywords || !keywords.length || !category) {
      return NextResponse.json(
        { success: false, error: 'Parole chiave e categoria sono obbligatorie' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Prepara i valori per l'inserimento multiplo
      const values = keywords.map(keyword => `('${keyword.trim().replace(/'/g, "''")}', '${category.replace(/'/g, "''")}')`);
      
      // Inserisci tutte le parole chiave in un'unica query
      await client.query(`
        INSERT INTO keywords (keyword, category)
        VALUES ${values.join(', ')}
        ON CONFLICT DO NOTHING
      `);

      return NextResponse.json({ success: true, message: 'Parole chiave aggiunte con successo' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Errore aggiunta keywords:', err);
    return NextResponse.json(
      { success: false, error: 'Errore durante l\'aggiunta delle parole chiave' },
      { status: 500 }
    );
  }
}

// DELETE: Elimina una parola chiave
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const category = searchParams.get('category');

    if (!keyword || !category) {
      return NextResponse.json(
        { success: false, error: 'Parola chiave e categoria sono obbligatorie' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        'DELETE FROM keywords WHERE keyword = $1 AND category = $2',
        [keyword, category]
      );

      return NextResponse.json({ success: true, message: 'Parola chiave eliminata con successo' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Errore eliminazione keyword:', err);
    return NextResponse.json(
      { success: false, error: 'Errore durante l\'eliminazione della parola chiave' },
      { status: 500 }
    );
  }
}