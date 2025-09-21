import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      conversationId,
      sessionId,
      behaviorType,
      timestamp,
      context,
      severity,
      metadata,
      detectionMethod = 'automatic',
      duration,
      resolution
    } = data;

    console.log('🧠 Salvando pattern comportamentale:', { behaviorType, severity, conversationId });

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

    // Determina il livello di severità
    let severityLevel = 1;
    if (severity === 'low') severityLevel = 1;
    else if (severity === 'medium') severityLevel = 3;
    else if (severity === 'high') severityLevel = 5;
    else if (typeof severity === 'number') severityLevel = Math.max(1, Math.min(5, severity));

    // Salva pattern comportamentale
    await sql`
      INSERT INTO user_behavior_patterns (
        conversation_id,
        session_id,
        pattern_type,
        detection_method,
        start_time,
        duration,
        severity_level,
        context,
        resolution
      ) VALUES (
        ${conversationId},
        ${sessionAnalyticsId},
        ${behaviorType},
        ${detectionMethod},
        ${timestamp || new Date().toISOString()},
        ${duration || null},
        ${severityLevel},
        ${context ? JSON.stringify(context) : null},
        ${resolution || null}
      )
    `;

    // Se è un comportamento critico, potremmo voler triggerare un alert
    if (severityLevel >= 4) {
      console.log('🚨 Comportamento critico rilevato:', { behaviorType, conversationId, severity: severityLevel });
      // Qui si potrebbe implementare un sistema di notifiche
    }

    return NextResponse.json({
      success: true,
      message: 'Pattern comportamentale salvato',
      severityLevel
    });

  } catch (error) {
    console.error('❌ Errore salvando pattern comportamentale:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel salvataggio pattern comportamentale',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const behaviorType = searchParams.get('type');
    const timeRange = searchParams.get('timeRange') || '7d';
    const stats = searchParams.get('stats') === 'true';
    const minSeverity = parseInt(searchParams.get('minSeverity')) || 1;

    if (conversationId) {
      // Recupera pattern comportamentali per conversazione specifica
      let query = sql`
        SELECT 
          pattern_type,
          detection_method,
          start_time,
          duration,
          severity_level,
          context,
          resolution
        FROM user_behavior_patterns 
        WHERE conversation_id = ${conversationId}
        AND severity_level >= ${minSeverity}
      `;

      if (behaviorType) {
        query = sql`
          SELECT 
            pattern_type,
            detection_method,
            start_time,
            duration,
            severity_level,
            context,
            resolution
          FROM user_behavior_patterns 
          WHERE conversation_id = ${conversationId}
          AND pattern_type = ${behaviorType}
          AND severity_level >= ${minSeverity}
        `;
      }

      const patterns = await sql`
        ${query}
        ORDER BY start_time DESC
        LIMIT 100
      `;

      // Statistiche per la conversazione
      const conversationStats = await sql`
        SELECT 
          pattern_type,
          COUNT(*) as occurrence_count,
          AVG(severity_level) as avg_severity,
          AVG(duration) as avg_duration
        FROM user_behavior_patterns 
        WHERE conversation_id = ${conversationId}
        GROUP BY pattern_type
        ORDER BY occurrence_count DESC
      `;

      return NextResponse.json({
        success: true,
        patterns,
        conversationStats
      });
    }

    if (stats) {
      // Recupera statistiche generali
      const behaviorStats = await sql`
        SELECT 
          COUNT(*) as total_patterns,
          COUNT(DISTINCT conversation_id) as affected_conversations,
          AVG(severity_level) as avg_severity,
          COUNT(CASE WHEN severity_level >= 4 THEN 1 END) as critical_patterns,
          COUNT(CASE WHEN resolution IS NOT NULL THEN 1 END) as resolved_patterns
        FROM user_behavior_patterns
        WHERE start_time >= NOW() - INTERVAL '${timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'}'
      `;

      // Pattern più comuni
      const commonPatterns = await sql`
        SELECT 
          pattern_type,
          COUNT(*) as occurrence_count,
          AVG(severity_level) as avg_severity,
          COUNT(DISTINCT conversation_id) as affected_conversations
        FROM user_behavior_patterns
        WHERE start_time >= NOW() - INTERVAL '${timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'}'
        GROUP BY pattern_type
        ORDER BY occurrence_count DESC
        LIMIT 10
      `;

      // Trend temporale
      const timeInterval = timeRange === '24h' ? 'hour' : timeRange === '7d' ? 'day' : 'day';
      const trendData = await sql`
        SELECT 
          DATE_TRUNC('${timeInterval}', start_time) as time_period,
          COUNT(*) as pattern_count,
          AVG(severity_level) as avg_severity
        FROM user_behavior_patterns
        WHERE start_time >= NOW() - INTERVAL '${timeRange === '24h' ? '1 day' : timeRange === '7d' ? '7 days' : '30 days'}'
        GROUP BY DATE_TRUNC('${timeInterval}', start_time)
        ORDER BY time_period
      `;

      return NextResponse.json({
        success: true,
        stats: behaviorStats[0],
        commonPatterns,
        trendData
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Parametri richiesti: conversationId o stats=true'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Errore recuperando pattern comportamentali:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore nel recupero pattern comportamentali',
      error: error.message
    }, { status: 500 });
  }
}