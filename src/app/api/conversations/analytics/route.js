import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'conversationId è richiesto' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Analytics di sessione
      const sessionQuery = `
        SELECT 
          sa.*,
          c.user_ip,
          c.user_country,
          c.user_city,
          c.user_timezone,
          c.browser_fingerprint,
          c.referrer_url,
          c.utm_source,
          c.utm_medium,
          c.utm_campaign
        FROM session_analytics sa
        LEFT JOIN conversations c ON sa.conversation_id = c.id
        WHERE sa.conversation_id = $1
        ORDER BY sa.session_start DESC
      `;
      
      const sessionResult = await client.query(sessionQuery, [conversationId]);
      
      // Interazioni utente
      const interactionsQuery = `
        SELECT 
          interaction_type,
          element_type,
          COUNT(*) as count,
          AVG(duration) as avg_duration,
          MIN(timestamp) as first_interaction,
          MAX(timestamp) as last_interaction
        FROM user_interactions 
        WHERE conversation_id = $1
        GROUP BY interaction_type, element_type
        ORDER BY count DESC
      `;
      
      const interactionsResult = await client.query(interactionsQuery, [conversationId]);
      
      // Metriche di performance
      const performanceQuery = `
        SELECT 
          metric_name,
          metric_value,
          unit,
          timestamp,
          context
        FROM performance_metrics 
        WHERE conversation_id = $1
        ORDER BY timestamp DESC
      `;
      
      const performanceResult = await client.query(performanceQuery, [conversationId]);
      
      // Statistiche generali
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT ui.id) as total_interactions,
          COUNT(DISTINCT acv.id) as total_card_views,
          AVG(acv.view_duration) as avg_card_view_duration,
          COUNT(DISTINCT ubp.id) as behavior_issues,
          COUNT(DISTINCT ea.id) as total_errors,
          SUM(CASE WHEN ui.interaction_type = 'click' THEN 1 ELSE 0 END) as total_clicks,
          SUM(CASE WHEN ui.interaction_type = 'scroll' THEN 1 ELSE 0 END) as total_scrolls,
          MAX(ui.scroll_position) as max_scroll_depth
        FROM conversations c
        LEFT JOIN user_interactions ui ON c.id = ui.conversation_id
        LEFT JOIN activity_card_views acv ON c.id = acv.conversation_id
        LEFT JOIN user_behavior_patterns ubp ON c.id = ubp.conversation_id
        LEFT JOIN error_analytics ea ON c.id = ea.conversation_id
        WHERE c.id = $1
        GROUP BY c.id
      `;
      
      const statsResult = await client.query(statsQuery, [conversationId]);
      
      // Timeline delle attività
      const timelineQuery = `
        SELECT 
          'interaction' as type,
          interaction_type as action,
          element_type as target,
          timestamp,
          duration,
          metadata
        FROM user_interactions 
        WHERE conversation_id = $1
        
        UNION ALL
        
        SELECT 
          'card_view' as type,
          'view' as action,
          activity_name as target,
          view_start as timestamp,
          view_duration as duration,
          json_build_object(
            'activity_id', activity_id,
            'category', activity_category,
            'audio_played', audio_played,
            'audio_duration', audio_duration
          ) as metadata
        FROM activity_card_views 
        WHERE conversation_id = $1
        
        UNION ALL
        
        SELECT 
          'behavior' as type,
          pattern_type as action,
          detection_method as target,
          start_time as timestamp,
          duration,
          context as metadata
        FROM user_behavior_patterns 
        WHERE conversation_id = $1
        
        ORDER BY timestamp ASC
      `;
      
      const timelineResult = await client.query(timelineQuery, [conversationId]);
      
      return NextResponse.json({
        success: true,
        analytics: {
          session: sessionResult.rows[0] || null,
          interactions: interactionsResult.rows,
          performance: performanceResult.rows,
          stats: statsResult.rows[0] || {},
          timeline: timelineResult.rows
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Errore nel recupero analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Errore interno del server', error: error.message },
      { status: 500 }
    );
  }
}