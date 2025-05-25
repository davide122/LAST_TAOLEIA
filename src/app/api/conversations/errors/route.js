import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// GET - Recupera gli errori di una conversazione
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        message: 'ID conversazione mancante'
      }, { status: 400 });
    }

    // Recupera gli errori della conversazione
    const errors = await sql`
      SELECT * FROM conversation_errors
      WHERE conversation_id = ${conversationId}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Recupera il conteggio totale
    const totalResult = await sql`
      SELECT COUNT(*) as total
      FROM conversation_errors
      WHERE conversation_id = ${conversationId}
    `;
    const total = parseInt(totalResult[0].total);

    return NextResponse.json({
      success: true,
      errors,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Errore durante il recupero degli errori:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante il recupero degli errori'
    }, { status: 500 });
  }
}

// GET - Statistiche degli errori
export async function POST(request) {
  try {
    const { startDate, endDate } = await request.json();

    // Recupera le statistiche degli errori
    const stats = await sql`
      SELECT 
        COUNT(*) as total_errors,
        COUNT(DISTINCT conversation_id) as affected_conversations,
        error_message,
        COUNT(*) as occurrence_count
      FROM conversation_errors
      WHERE timestamp BETWEEN ${startDate} AND ${endDate}
      GROUP BY error_message
      ORDER BY occurrence_count DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Errore durante il recupero delle statistiche:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante il recupero delle statistiche'
    }, { status: 500 });
  }
} 