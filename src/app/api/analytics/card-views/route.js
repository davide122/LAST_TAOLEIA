import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      conversationId,
      sessionId,
      cardId,
      cardTitle,
      cardType,
      viewType,
      viewDuration,
      scrollDepth,
      interactionsCount,
      audioPlayed,
      audioDuration,
      clickedElements
    } = data;

    console.log('📋 Salvando visualizzazione scheda:', { cardId, cardTitle, viewType });

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

    if (viewType === 'start') {
      // Inizia tracking visualizzazione
      await sql`
        INSERT INTO activity_card_views (
          conversation_id,
          session_id,
          activity_id,
          activity_name,
          activity_category,
          view_start
        ) VALUES (
          ${conversationId},
          ${sessionAnalyticsId},
          ${cardId},
          ${cardTitle || ''},
          ${cardType || ''},
          CURRENT_TIMESTAMP
        )
      `;
    } else if (viewType === 'end') {
      // Aggiorna con dati finali
      await sql`
        UPDATE activity_card_views 
        SET 
          view_end = CURRENT_TIMESTAMP,
          view_duration = ${viewDuration || null},
          scroll_depth = ${scrollDepth || 0},
          interactions_count = ${interactionsCount || 0},
          audio_played = ${audioPlayed || false},
          audio_duration = ${audioDuration || 0},
          clicked_elements = ${clickedElements ? JSON.stringify(clickedElements) : null}
        WHERE conversation_id = ${conversationId}
        AND activity_id = ${cardId}
        AND view_end IS NULL
        ORDER BY view_start DESC
        LIMIT 1
      `;
    } else {
      // Visualizzazione generica
      await sql`
        INSERT INTO activity_card_views (
          conversation_id,
          session_id,
          activity_id,
          activity_name,
          activity_category,
          view_start,
          view_duration,
          scroll_depth,
          interactions_count,
          audio_played,
          audio_duration
        ) VALUES (
          ${conversationId},
          ${sessionAnalyticsId},
          ${cardId},
          ${cardTitle || ''},
          ${cardType || ''},
          CURRENT_TIMESTAMP,
          ${viewDuration || null},
          ${scrollDepth || 0},
          ${interactionsCount || 0},
          ${audioPlayed || false},
          ${audioDuration || 0}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Visualizzazione scheda salvata'
    });

  } catch (error) {
    console.error('❌ Errore salvando visualizzazione scheda:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel salvataggio visualizzazione scheda',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const timeRange = searchParams.get('timeRange') || '7d';
    const stats = searchParams.get('stats') === 'true';

    if (conversationId) {
      // Recupera visualizzazioni per conversazione specifica
      const cardViews = await sql`
        SELECT 
          activity_id,
          activity_name,
          activity_category,
          COUNT(*) as view_count,
          AVG(view_duration) as avg_duration,
          AVG(scroll_depth) as avg_scroll_depth,
          SUM(interactions_count) as total_interactions,
          COUNT(CASE WHEN audio_played THEN 1 END) as audio_plays
        FROM activity_card_views 
        WHERE conversation_id = ${conversationId}
        GROUP BY activity_id, activity_name, activity_category
        ORDER BY view_count DESC
      `;

      return NextResponse.json({
        success: true,
        cardViews
      });
    }

    if (stats) {
      // Recupera statistiche generali
      const cardStats = await sql`
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT activity_id) as unique_activities,
          AVG(view_duration) as avg_view_duration,
          AVG(scroll_depth) as avg_scroll_depth,
          COUNT(CASE WHEN audio_played THEN 1 END) as total_audio_plays
        FROM activity_card_views
        WHERE view_start >= NOW() - INTERVAL '${timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'}'
      `;

      return NextResponse.json({
        success: true,
        stats: cardStats[0]
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Parametri richiesti: conversationId o stats=true'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Errore recuperando visualizzazioni schede:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel recupero visualizzazioni schede',
      error: error.message
    }, { status: 500 });
  }
}