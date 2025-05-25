import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// POST - Aggiungi un nuovo messaggio
export async function POST(request) {
  try {
    const { conversationId, role, content, metadata } = await request.json();

    // Verifica che la conversazione esista
    const conversation = await sql`
      SELECT id FROM conversations WHERE id = ${conversationId}
    `;

    if (conversation.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Conversazione non trovata'
      }, { status: 404 });
    }

    // Inserisci il messaggio
    const result = await sql`
      INSERT INTO conversation_messages (
        conversation_id, role, content, metadata, timestamp
      ) VALUES (
        ${conversationId}, ${role}, ${content}, ${metadata}, NOW()
      )
      RETURNING id
    `;

    // Se il messaggio è di tipo errore, registra anche nella tabella degli errori
    if (role === 'error') {
      await sql`
        INSERT INTO conversation_errors (
          conversation_id, error_message, error_context, timestamp
        ) VALUES (
          ${conversationId}, ${content}, ${metadata}, NOW()
        )
      `;
    }

    return NextResponse.json({
      success: true,
      messageId: result[0].id
    });
  } catch (error) {
    console.error('Errore durante l\'inserimento del messaggio:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante l\'inserimento del messaggio'
    }, { status: 500 });
  }
}

// GET - Recupera i messaggi di una conversazione
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        message: 'ID conversazione mancante'
      }, { status: 400 });
    }

    // Costruisci la query base
    let query = sql`
      SELECT * FROM conversation_messages
      WHERE conversation_id = ${conversationId}
    `;

    // Aggiungi il filtro per ruolo se specificato
    if (role) {
      query = sql`${query} AND role = ${role}`;
    }

    // Aggiungi ORDER BY, LIMIT e OFFSET
    query = sql`${query}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const messages = await query;

    return NextResponse.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Errore durante il recupero dei messaggi:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante il recupero dei messaggi'
    }, { status: 500 });
  }
} 