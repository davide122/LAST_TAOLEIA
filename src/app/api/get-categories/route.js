import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      // Raggruppa per category e aggrega in un array tutti i name distinti
      const { rows } = await client.query(`
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

      // rows = [ { category: 'Sport', names: ['Calcio','Tennis',...] }, ... ]
      return NextResponse.json({ categories: rows });
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
