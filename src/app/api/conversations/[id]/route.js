import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Verifica che l'ID sia valido
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, message: 'ID conversazione non valido' },
        { status: 400 }
      );
    }

    // Recupera i dettagli della conversazione
    const result = await sql`
      SELECT 
        c.id,
        c.thread_id,
        c.language,
        c.status,
        c.start_time,
        c.end_time,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT e.id) as error_count
      FROM conversations c
      LEFT JOIN conversation_messages m ON m.conversation_id = c.id
      LEFT JOIN conversation_errors e ON e.conversation_id = c.id
      WHERE c.id = ${id}
      GROUP BY c.id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Conversazione non trovata' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: result[0]
    });
  } catch (error) {
    console.error('Errore nel recupero dei dettagli della conversazione:', error);
    return NextResponse.json(
      { success: false, message: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 