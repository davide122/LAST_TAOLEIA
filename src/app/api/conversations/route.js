import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// POST - Inizia una nuova conversazione
export async function POST(request) {
  try {
    const { threadId, language, userAgent, ipAddress, sessionId, deviceInfo } = await request.json();

    // Inserisci la nuova conversazione
    const result = await sql`
      INSERT INTO conversations (
        thread_id, language, user_agent, ip_address, session_id, device_info, status, start_time
      ) VALUES (
        ${threadId}, ${language}, ${userAgent}, ${ipAddress}, ${sessionId}, ${deviceInfo}, 'active', NOW()
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      conversationId: result[0].id
    });
  } catch (error) {
    console.error('Errore durante la creazione della conversazione:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante la creazione della conversazione'
    }, { status: 500 });
  }
}

// GET - Recupera le conversazioni
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Recupera le conversazioni con i conteggi
    const conversations = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT e.id) as error_count
      FROM conversations c
      LEFT JOIN conversation_messages m ON c.id = m.conversation_id
      LEFT JOIN conversation_errors e ON c.id = e.conversation_id
      WHERE 
        (${language}::text IS NULL OR c.language = ${language})
        AND (${status}::text IS NULL OR c.status = ${status})
        AND (${startDate}::timestamp IS NULL OR c.start_time >= ${startDate}::timestamp)
        AND (${endDate}::timestamp IS NULL OR c.start_time <= ${endDate}::timestamp)
      GROUP BY c.id
      ORDER BY c.start_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Recupera il conteggio totale
    const totalResult = await sql`
      SELECT COUNT(*) as total
      FROM conversations c
      WHERE 
        (${language}::text IS NULL OR c.language = ${language})
        AND (${status}::text IS NULL OR c.status = ${status})
        AND (${startDate}::timestamp IS NULL OR c.start_time >= ${startDate}::timestamp)
        AND (${endDate}::timestamp IS NULL OR c.start_time <= ${endDate}::timestamp)
    `;

    return NextResponse.json({
      success: true,
      conversations,
      total: parseInt(totalResult[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Errore durante il recupero delle conversazioni:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante il recupero delle conversazioni'
    }, { status: 500 });
  }
} 