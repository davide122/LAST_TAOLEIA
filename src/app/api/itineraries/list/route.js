import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Inizializza la connessione al database
const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    // Recupera tutti gli itinerari dal database
    const itineraries = await sql`
      SELECT * FROM itineraries
      ORDER BY created_at DESC
    `;
    
    // Per ogni itinerario, recupera le relative attività
    for (const itinerary of itineraries) {
      const activities = await sql`
        SELECT * FROM itinerary_activities
        WHERE itinerary_id = ${itinerary.id}
        ORDER BY day_index, start_time
      `;
      
      // Formatta le attività per mantenere la compatibilità con il frontend
      itinerary.activities = activities.map(activity => ({
        id: activity.id.toString(),
        title: activity.title,
        dayIndex: activity.day_index,
        startTime: activity.start_time,
        endTime: activity.end_time,
        description: activity.description || ''
      }));
    }

    return NextResponse.json({ itineraries }, { status: 200 });
  } catch (error) {
    console.error('Errore durante il recupero degli itinerari:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante il recupero degli itinerari' },
      { status: 500 }
    );
  }
}