import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      conversationId,
      sessionId,
      interactionType,
      elementId,
      elementType,
      elementText,
      coordinates,
      scrollPosition,
      timestamp,
      duration,
      metadata
    } = data;

    console.log('🖱️ Salvando interazione:', { interactionType, elementType, elementId });

    // Trova la sessione attiva per questa conversazione
    let sessionAnalyticsId = null;
    if (sessionId) {
      const sessions = await sql`
        SELECT id FROM session_analytics 
        WHERE conversation_id = ${conversationId}
        ORDER BY session_start DESC 
        LIMIT 1
      `;
      sessionAnalyticsId = sessions[0]?.id || null;
    }

    // Salva interazione nel database
    await sql`
      INSERT INTO user_interactions (
        conversation_id,
        session_id,
        interaction_type,
        element_type,
        element_id,
        element_text,
        coordinates,
        scroll_position,
        timestamp,
        duration,
        metadata
      ) VALUES (
        ${conversationId},
        ${sessionAnalyticsId},
        ${interactionType},
        ${elementType || null},
        ${elementId || null},
        ${elementText || null},
        ${coordinates ? JSON.stringify(coordinates) : null},
        ${scrollPosition || null},
        ${timestamp || new Date().toISOString()},
        ${duration || null},
        ${metadata ? JSON.stringify(metadata) : null}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Interazione salvata'
    });

  } catch (error) {
    console.error('❌ Errore salvando interazione:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel salvataggio interazione',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const interactionType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit')) || 100;

    let query = sql`
      SELECT * FROM user_interactions 
      WHERE conversation_id = ${conversationId}
    `;

    if (interactionType) {
      query = sql`
        SELECT * FROM user_interactions 
        WHERE conversation_id = ${conversationId}
        AND interaction_type = ${interactionType}
      `;
    }

    const interactions = await sql`
      ${query}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({
      success: true,
      interactions
    });

  } catch (error) {
    console.error('❌ Errore recuperando interazioni:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel recupero interazioni',
      error: error.message
    }, { status: 500 });
  }
}