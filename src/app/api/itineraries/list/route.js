import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Inizializza la connessione al database
const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const authToken = cookies().get('authToken');
    if (!authToken) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    try {
      jwt.verify(authToken.value, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
    }

    const rows = await sql`
      SELECT
        i.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id::text,
              'title', a.title,
              'dayIndex', a.day_index,
              'startTime', a.start_time,
              'endTime', a.end_time,
              'description', COALESCE(a.description, '')
            )
            ORDER BY a.day_index, a.start_time
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'::json
        ) AS activities
      FROM itineraries i
      LEFT JOIN itinerary_activities a
        ON a.itinerary_id = i.id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `;

    const itineraries = rows.map((row) => {
      const activities = typeof row.activities === 'string' ? JSON.parse(row.activities) : row.activities;
      return { ...row, activities: Array.isArray(activities) ? activities : [] };
    });

    return NextResponse.json({ itineraries }, { status: 200 });
  } catch (error) {
    console.error('Errore durante il recupero degli itinerari:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante il recupero degli itinerari' },
      { status: 500 }
    );
  }
}
