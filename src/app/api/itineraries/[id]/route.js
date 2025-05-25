import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Inizializza la connessione al database
const sql = neon(process.env.DATABASE_URL);

// GET - Ottieni un itinerario specifico
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Recupera l'itinerario dal database
    const itineraryResult = await sql`
      SELECT * FROM itineraries
      WHERE id = ${id}
    `;
    
    if (itineraryResult.length === 0) {
      return NextResponse.json(
        { error: 'Itinerario non trovato' },
        { status: 404 }
      );
    }
    
    const itinerary = itineraryResult[0];
    
    // Recupera le attività associate all'itinerario
    const activitiesResult = await sql`
      SELECT * FROM itinerary_activities
      WHERE itinerary_id = ${id}
      ORDER BY day_index, start_time
    `;
    
    // Formatta le attività per mantenere la compatibilità con il frontend
    itinerary.activities = activitiesResult.map(activity => ({
      id: activity.id.toString(),
      title: activity.title,
      dayIndex: activity.day_index,
      startTime: activity.start_time,
      endTime: activity.end_time,
      description: activity.description || ''
    }));
    
    return NextResponse.json(itinerary, { status: 200 });
  } catch (error) {
    console.error('Errore durante il recupero dell\'itinerario:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante il recupero dell\'itinerario' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna un itinerario esistente
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Verifica se l'itinerario esiste
    const existingItinerary = await sql`
      SELECT id FROM itineraries WHERE id = ${id}
    `;
    
    if (existingItinerary.length === 0) {
      return NextResponse.json(
        { error: 'Itinerario non trovato' },
        { status: 404 }
      );
    }
    
    const updatedData = await request.json();
    
    // Aggiorna i dati dell'itinerario nel database
    await sql`
      UPDATE itineraries
      SET 
        title = ${updatedData.title},
        description = ${updatedData.description || ''},
        days = ${updatedData.days || 1},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    
    // Se ci sono attività, aggiorna anche quelle
    if (updatedData.activities && Array.isArray(updatedData.activities)) {
      // Prima elimina tutte le attività esistenti per questo itinerario
      await sql`DELETE FROM itinerary_activities WHERE itinerary_id = ${id}`;
      
      // Poi inserisci le nuove attività
      for (const activity of updatedData.activities) {
        await sql`
          INSERT INTO itinerary_activities (
            itinerary_id, title, day_index, start_time, end_time, description
          )
          VALUES (
            ${id},
            ${activity.title},
            ${activity.dayIndex},
            ${activity.startTime},
            ${activity.endTime},
            ${activity.description || null}
          )
        `;
      }
    }
    
    // Recupera l'itinerario aggiornato con le sue attività
    const updatedItinerary = await sql`
      SELECT * FROM itineraries WHERE id = ${id}
    `;
    
    // Recupera le attività aggiornate
    const activities = await sql`
      SELECT * FROM itinerary_activities
      WHERE itinerary_id = ${id}
      ORDER BY day_index, start_time
    `;
    
    // Formatta le attività per mantenere la compatibilità con il frontend
    updatedItinerary[0].activities = activities.map(activity => ({
      id: activity.id.toString(),
      title: activity.title,
      dayIndex: activity.day_index,
      startTime: activity.start_time,
      endTime: activity.end_time,
      description: activity.description || ''
    }));
    
    return NextResponse.json(updatedItinerary[0], { status: 200 });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'itinerario:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante l\'aggiornamento dell\'itinerario' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina un itinerario
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Verifica se l'itinerario esiste
    const existingItinerary = await sql`
      SELECT id FROM itineraries WHERE id = ${id}
    `;
    
    if (existingItinerary.length === 0) {
      return NextResponse.json(
        { error: 'Itinerario non trovato' },
        { status: 404 }
      );
    }
    
    // Elimina prima le attività associate all'itinerario (integrità referenziale)
    await sql`DELETE FROM itinerary_activities WHERE itinerary_id = ${id}`;
    
    // Poi elimina l'itinerario
    await sql`DELETE FROM itineraries WHERE id = ${id}`;
    
    return NextResponse.json({ success: true, message: 'Itinerario eliminato con successo' }, { status: 200 });
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'itinerario:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante l\'eliminazione dell\'itinerario' },
      { status: 500 }
    );
  }
}