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
      // Visualizzazioni schede dettagliate
      const cardViewsQuery = `
        SELECT 
          acv.*,
          COUNT(*) OVER (PARTITION BY acv.activity_id) as total_views_for_activity,
          AVG(acv.view_duration) OVER (PARTITION BY acv.activity_id) as avg_duration_for_activity,
          ROW_NUMBER() OVER (PARTITION BY acv.activity_id ORDER BY acv.view_start) as view_sequence
        FROM activity_card_views acv
        WHERE acv.conversation_id = $1
        ORDER BY acv.view_start DESC
      `;
      
      const cardViewsResult = await client.query(cardViewsQuery, [conversationId]);
      
      // Statistiche per attività
      const activityStatsQuery = `
        SELECT 
          activity_id,
          activity_name,
          activity_category,
          COUNT(*) as view_count,
          AVG(view_duration) as avg_view_duration,
          MAX(view_duration) as max_view_duration,
          MIN(view_duration) as min_view_duration,
          SUM(CASE WHEN audio_played = true THEN 1 ELSE 0 END) as audio_plays,
          AVG(CASE WHEN audio_played = true THEN audio_duration ELSE NULL END) as avg_audio_duration,
          COUNT(DISTINCT DATE(view_start)) as days_viewed,
          MIN(view_start) as first_view,
          MAX(view_start) as last_view
        FROM activity_card_views 
        WHERE conversation_id = $1
        GROUP BY activity_id, activity_name, activity_category
        ORDER BY view_count DESC, avg_view_duration DESC
      `;
      
      const activityStatsResult = await client.query(activityStatsQuery, [conversationId]);
      
      // Pattern di visualizzazione
      const viewPatternsQuery = `
        SELECT 
          activity_category,
          COUNT(*) as category_views,
          AVG(view_duration) as avg_category_duration,
          SUM(CASE WHEN audio_played = true THEN 1 ELSE 0 END) as category_audio_plays,
          EXTRACT(HOUR FROM view_start) as hour_of_day,
          COUNT(*) as views_in_hour
        FROM activity_card_views 
        WHERE conversation_id = $1
        GROUP BY activity_category, EXTRACT(HOUR FROM view_start)
        ORDER BY category_views DESC, hour_of_day
      `;
      
      const viewPatternsResult = await client.query(viewPatternsQuery, [conversationId]);
      
      // Sequenze di visualizzazione
      const viewSequenceQuery = `
        WITH view_sequences AS (
          SELECT 
            activity_id,
            activity_name,
            view_start,
            LAG(activity_id) OVER (ORDER BY view_start) as previous_activity,
            LAG(activity_name) OVER (ORDER BY view_start) as previous_activity_name,
            LEAD(activity_id) OVER (ORDER BY view_start) as next_activity,
            LEAD(activity_name) OVER (ORDER BY view_start) as next_activity_name
          FROM activity_card_views 
          WHERE conversation_id = $1
        )
        SELECT 
          previous_activity_name as from_activity,
          activity_name as to_activity,
          COUNT(*) as transition_count
        FROM view_sequences 
        WHERE previous_activity IS NOT NULL
        GROUP BY previous_activity_name, activity_name
        ORDER BY transition_count DESC
        LIMIT 20
      `;
      
      const viewSequenceResult = await client.query(viewSequenceQuery, [conversationId]);
      
      // Metriche di engagement
      const engagementQuery = `
        SELECT 
          COUNT(*) as total_card_views,
          COUNT(DISTINCT activity_id) as unique_activities_viewed,
          AVG(view_duration) as avg_view_duration,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY view_duration) as median_view_duration,
          SUM(CASE WHEN view_duration > 30 THEN 1 ELSE 0 END) as long_views_count,
          SUM(CASE WHEN view_duration < 5 THEN 1 ELSE 0 END) as quick_views_count,
          SUM(CASE WHEN audio_played = true THEN 1 ELSE 0 END) as total_audio_plays,
          AVG(CASE WHEN audio_played = true THEN audio_duration ELSE NULL END) as avg_audio_duration,
          MAX(view_start) - MIN(view_start) as total_browsing_time
        FROM activity_card_views 
        WHERE conversation_id = $1
      `;
      
      const engagementResult = await client.query(engagementQuery, [conversationId]);
      
      // Top attività per tempo di visualizzazione
      const topActivitiesQuery = `
        SELECT 
          activity_name,
          activity_category,
          SUM(view_duration) as total_time_spent,
          COUNT(*) as view_count,
          AVG(view_duration) as avg_duration
        FROM activity_card_views 
        WHERE conversation_id = $1
        GROUP BY activity_name, activity_category
        ORDER BY total_time_spent DESC
        LIMIT 10
      `;
      
      const topActivitiesResult = await client.query(topActivitiesQuery, [conversationId]);
      
      return NextResponse.json({
        success: true,
        cardViews: {
          detailed_views: cardViewsResult.rows,
          activity_stats: activityStatsResult.rows,
          view_patterns: viewPatternsResult.rows,
          view_sequences: viewSequenceResult.rows,
          engagement_metrics: engagementResult.rows[0] || {},
          top_activities: topActivitiesResult.rows
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Errore nel recupero visualizzazioni schede:', error);
    return NextResponse.json(
      { success: false, message: 'Errore interno del server', error: error.message },
      { status: 500 }
    );
  }
}