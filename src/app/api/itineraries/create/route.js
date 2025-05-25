import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Inizializza la connessione al database
const sql = neon(process.env.DATABASE_URL);

// POST - Crea un nuovo itinerario
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validazione base
    if (!data.title) {
      return NextResponse.json(
        { error: 'Il titolo è obbligatorio' },
        { status: 400 }
      );
    }
    
    // Inserisci il nuovo itinerario nel database
    const result = await sql`
      INSERT INTO itineraries (title, description, days, created_at)
      VALUES (${data.title}, ${data.description || ''}, ${data.days || 1}, NOW())
      RETURNING id, title, description, days, created_at
    `;
    
    const newItinerary = result[0];
    
    // Se ci sono attività, inseriscile nella tabella itinerary_activities
    if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
      for (const activity of data.activities) {
        await sql`
          INSERT INTO itinerary_activities (
            itinerary_id, title, day_index, start_time, end_time, description
          )
          VALUES (
            ${newItinerary.id},
            ${activity.title},
            ${activity.dayIndex},
            ${activity.startTime},
            ${activity.endTime},
            ${activity.description || null}
          )
        `;
      }
    }
    
    // Recupera le attività appena inserite
    const activities = await sql`
      SELECT * FROM itinerary_activities
      WHERE itinerary_id = ${newItinerary.id}
      ORDER BY day_index, start_time
    `;
    
    // Formatta le attività per mantenere la compatibilità con il frontend
    newItinerary.activities = activities.map(activity => ({
      id: activity.id.toString(),
      title: activity.title,
      dayIndex: activity.day_index,
      startTime: activity.start_time,
      endTime: activity.end_time,
      description: activity.description || ''
    }));
    
    return NextResponse.json(newItinerary, { status: 201 });
  } catch (error) {
    console.error('Errore durante la creazione dell\'itinerario:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante la creazione dell\'itinerario' },
      { status: 500 }
    );
  }
}