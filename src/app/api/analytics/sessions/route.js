import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      sessionId,
      conversationId,
      startTime,
      endTime,
      duration,
      deviceInfo,
      isActive,
      messageCount,
      errorCount,
      cardViewsCount,
      audioPlaysCount,
      scrollEvents,
      clickEvents
    } = data;

    console.log('📊 Salvando sessione analytics:', { sessionId, conversationId, isActive });

    if (endTime && duration) {
      // Aggiorna sessione esistente con dati finali
      await sql`
        UPDATE session_analytics 
        SET 
          session_end = ${endTime},
          total_duration = ${duration},
          clicks_count = ${clickEvents || 0},
          audio_plays = ${audioPlaysCount || 0},
          updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ${conversationId}
        AND session_start::date = ${startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
      `;
    } else {
      // Crea nuova sessione
      await sql`
        INSERT INTO session_analytics (
          conversation_id,
          session_start,
          user_agent,
          screen_resolution,
          viewport_size,
          device_type,
          connection_type
        ) VALUES (
          ${conversationId},
          ${startTime || new Date().toISOString()},
          ${deviceInfo?.userAgent || ''},
          ${deviceInfo?.screenResolution || ''},
          ${deviceInfo?.viewportSize || ''},
          ${deviceInfo?.deviceType || 'desktop'},
          ${deviceInfo?.connectionType || 'unknown'}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Sessione analytics salvata'
    });

  } catch (error) {
    console.error('❌ Errore salvando sessione analytics:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel salvataggio sessione analytics',
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
      // Recupera sessioni per conversazione specifica
      const sessions = await sql`
        SELECT * FROM session_analytics 
        WHERE conversation_id = ${conversationId}
        ORDER BY session_start DESC
      `;

      return NextResponse.json({
        success: true,
        sessions
      });
    }

    if (stats) {
      // Recupera statistiche generali
      const sessionStats = await sql`
        SELECT 
          COUNT(*) as total_sessions,
          AVG(total_duration) as avg_duration,
          SUM(clicks_count) as total_clicks,
          SUM(audio_plays) as total_audio_plays,
          COUNT(DISTINCT conversation_id) as unique_conversations
        FROM session_analytics
        WHERE session_start >= NOW() - INTERVAL '${timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'}'
      `;

      return NextResponse.json({
        success: true,
        stats: sessionStats[0]
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Parametri richiesti: conversationId o stats=true'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Errore recuperando sessioni analytics:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel recupero sessioni analytics',
      error: error.message
    }, { status: 500 });
  }
}