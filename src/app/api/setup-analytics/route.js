import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST() {
  try {
    console.log('🔧 Inizializzazione tabelle analytics...');

    // Crea tabella session_analytics
    await sql`
      CREATE TABLE IF NOT EXISTS session_analytics (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER,
        session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        session_end TIMESTAMP WITH TIME ZONE,
        total_duration INTEGER,
        active_duration INTEGER,
        idle_time INTEGER,
        page_views INTEGER DEFAULT 0,
        scroll_depth FLOAT DEFAULT 0,
        clicks_count INTEGER DEFAULT 0,
        typing_events INTEGER DEFAULT 0,
        voice_interactions INTEGER DEFAULT 0,
        audio_plays INTEGER DEFAULT 0,
        errors_encountered INTEGER DEFAULT 0,
        user_agent TEXT,
        screen_resolution VARCHAR(20),
        viewport_size VARCHAR(20),
        device_type VARCHAR(20),
        connection_type VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Crea tabella user_interactions
    await sql`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER,
        session_id INTEGER,
        interaction_type VARCHAR(50) NOT NULL,
        element_type VARCHAR(50),
        element_id VARCHAR(100),
        element_class VARCHAR(200),
        element_text TEXT,
        page_url TEXT,
        coordinates JSONB,
        scroll_position INTEGER,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER,
        metadata JSONB
      )
    `;

    // Crea tabella activity_card_views
    await sql`
      CREATE TABLE IF NOT EXISTS activity_card_views (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER,
        session_id INTEGER,
        activity_id INTEGER,
        activity_name VARCHAR(255),
        activity_category VARCHAR(100),
        view_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        view_end TIMESTAMP WITH TIME ZONE,
        view_duration INTEGER,
        scroll_depth FLOAT DEFAULT 0,
        interactions_count INTEGER DEFAULT 0,
        audio_played BOOLEAN DEFAULT FALSE,
        audio_duration INTEGER DEFAULT 0,
        clicked_elements JSONB
      )
    `;

    // Crea tabella conversation_word_analysis
    await sql`
      CREATE TABLE IF NOT EXISTS conversation_word_analysis (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER,
        message_id INTEGER,
        word VARCHAR(100) NOT NULL,
        word_count INTEGER DEFAULT 1,
        word_position INTEGER,
        sentiment_score FLOAT,
        language VARCHAR(5),
        is_keyword BOOLEAN DEFAULT FALSE,
        category VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Crea tabella user_behavior_patterns
    await sql`
      CREATE TABLE IF NOT EXISTS user_behavior_patterns (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER,
        session_id INTEGER,
        pattern_type VARCHAR(50) NOT NULL,
        detection_method VARCHAR(50),
        start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP WITH TIME ZONE,
        duration INTEGER,
        severity_level INTEGER DEFAULT 1,
        context JSONB,
        resolution VARCHAR(100)
      )
    `;

    // Crea tabella messages se non esiste
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Crea indici per ottimizzare le performance
    await sql`CREATE INDEX IF NOT EXISTS idx_session_analytics_conversation_id ON session_analytics(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_interactions_conversation_id ON user_interactions(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_card_views_conversation_id ON activity_card_views(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_word_analysis_conversation_id ON conversation_word_analysis(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_behavior_patterns_conversation_id ON user_behavior_patterns(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`;

    console.log('✅ Tabelle analytics create con successo!');

    return NextResponse.json({
      success: true,
      message: 'Tabelle analytics inizializzate con successo'
    });

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione delle tabelle:', error);
    return NextResponse.json({
      success: false,
      message: 'Errore durante l\'inizializzazione delle tabelle',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint per inizializzare le tabelle analytics. Usa POST per creare le tabelle.'
  });
}