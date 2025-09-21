import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// POST - Aggiungi un nuovo messaggio
export async function POST(request) {
  try {
    const { conversationId, role, content, metadata } = await request.json();

    console.log('💬 Salvando messaggio:', { conversationId, role, contentLength: content?.length || 0, hasContent: !!content });

    // Validazione parametri richiesti
    if (!conversationId) {
      console.warn('⚠️ conversationId mancante');
      return NextResponse.json({
        success: false,
        message: 'conversationId è richiesto'
      }, { status: 400 });
    }

    if (!role) {
      console.warn('⚠️ role mancante');
      return NextResponse.json({
        success: false,
        message: 'role è richiesto'
      }, { status: 400 });
    }

    // Validazione ruoli supportati
    const validRoles = ['user', 'assistant', 'tool'];
    if (!validRoles.includes(role)) {
      console.warn(`⚠️ role non valido: ${role}`);
      return NextResponse.json({
        success: false,
        message: `role deve essere uno di: ${validRoles.join(', ')}`
      }, { status: 400 });
    }

    // Validazione contenuto (non deve essere vuoto tranne per messaggi di errore o tool)
    if ((!content || !content.trim()) && role !== 'error' && role !== 'tool') {
      console.warn('⚠️ Tentativo di salvare messaggio con content vuoto:', { conversationId, role });
      return NextResponse.json({
        success: false,
        message: 'Il contenuto del messaggio non può essere vuoto'
      }, { status: 400 });
    }

    // Per i messaggi tool, il contenuto può essere vuoto se ci sono metadati
    if (role === 'tool' && (!content || !content.trim()) && (!metadata || !metadata.cardData)) {
      console.warn('⚠️ Messaggio tool senza contenuto né dati scheda:', { conversationId, role });
      return NextResponse.json({
        success: false,
        message: 'I messaggi tool devono avere contenuto o dati scheda nei metadati'
      }, { status: 400 });
    }

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
        ${conversationId}, ${role}, ${content || ''}, ${metadata}, NOW()
      )
      RETURNING id
    `;

    console.log('✅ Messaggio salvato con successo:', { messageId: result[0].id, contentLength: content?.length || 0 });

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

    // Prima verifichiamo che la query base funzioni
    const messages = await sql`
      SELECT * FROM conversation_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

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