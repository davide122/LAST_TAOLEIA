import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Soglie per rilevare comportamenti anomali
const THRESHOLDS = {
  LONG_PAUSE: 30000, // 30 secondi
  VERY_LONG_PAUSE: 120000, // 2 minuti
  RAPID_CLICKS: 5, // 5 click in 10 secondi
  SHORT_VIEW: 2000, // 2 secondi
  REPEATED_ACTIONS: 3, // stessa azione ripetuta
  HIGH_SCROLL_SPEED: 1000, // pixel per secondo
  CONFUSION_THRESHOLD: 2 // indicatori di confusione
};

function detectBehaviorPatterns(interactions, messages, cardViews) {
  const patterns = {
    confusion_episodes: [],
    blocking_events: [],
    rapid_interactions: [],
    abandonment_signals: [],
    engagement_drops: [],
    repetitive_behavior: [],
    navigation_issues: []
  };

  // Analizza le pause tra i messaggi
  for (let i = 1; i < messages.length; i++) {
    const timeDiff = new Date(messages[i].timestamp) - new Date(messages[i-1].timestamp);
    
    if (timeDiff > THRESHOLDS.VERY_LONG_PAUSE) {
      patterns.blocking_events.push({
        type: 'long_pause',
        duration: timeDiff,
        timestamp: messages[i-1].timestamp,
        context: `Pausa di ${Math.round(timeDiff/1000)} secondi tra messaggi`,
        severity: 'high'
      });
    } else if (timeDiff > THRESHOLDS.LONG_PAUSE) {
      patterns.blocking_events.push({
        type: 'medium_pause',
        duration: timeDiff,
        timestamp: messages[i-1].timestamp,
        context: `Pausa di ${Math.round(timeDiff/1000)} secondi tra messaggi`,
        severity: 'medium'
      });
    }
  }

  // Analizza interazioni rapide (possibile frustrazione)
  const interactionGroups = {};
  interactions.forEach(interaction => {
    const timeWindow = Math.floor(new Date(interaction.timestamp).getTime() / 10000) * 10000;
    if (!interactionGroups[timeWindow]) interactionGroups[timeWindow] = [];
    interactionGroups[timeWindow].push(interaction);
  });

  Object.entries(interactionGroups).forEach(([timeWindow, groupInteractions]) => {
    const clickCount = groupInteractions.filter(i => i.interaction_type === 'click').length;
    if (clickCount >= THRESHOLDS.RAPID_CLICKS) {
      patterns.rapid_interactions.push({
        type: 'rapid_clicking',
        count: clickCount,
        timestamp: new Date(parseInt(timeWindow)),
        context: `${clickCount} click in 10 secondi`,
        severity: 'medium'
      });
    }
  });

  // Analizza visualizzazioni brevi delle schede (possibile confusione)
  cardViews.forEach(view => {
    if (view.view_duration < THRESHOLDS.SHORT_VIEW) {
      patterns.confusion_episodes.push({
        type: 'quick_card_exit',
        duration: view.view_duration,
        timestamp: view.view_start,
        context: `Scheda "${view.activity_name}" vista per solo ${view.view_duration}ms`,
        activity_id: view.activity_id,
        severity: 'low'
      });
    }
  });

  // Rileva comportamenti ripetitivi
  const actionSequences = {};
  interactions.forEach((interaction, index) => {
    const key = `${interaction.interaction_type}_${interaction.element_type}`;
    if (!actionSequences[key]) actionSequences[key] = [];
    actionSequences[key].push({ ...interaction, index });
  });

  Object.entries(actionSequences).forEach(([actionType, actions]) => {
    // Cerca sequenze di azioni identiche ravvicinate
    for (let i = 0; i < actions.length - THRESHOLDS.REPEATED_ACTIONS + 1; i++) {
      const sequence = actions.slice(i, i + THRESHOLDS.REPEATED_ACTIONS);
      const timeSpan = new Date(sequence[sequence.length - 1].timestamp) - new Date(sequence[0].timestamp);
      
      if (timeSpan < 30000) { // 30 secondi
        patterns.repetitive_behavior.push({
          type: 'repeated_action',
          action: actionType,
          count: THRESHOLDS.REPEATED_ACTIONS,
          timestamp: sequence[0].timestamp,
          context: `Azione "${actionType}" ripetuta ${THRESHOLDS.REPEATED_ACTIONS} volte in ${Math.round(timeSpan/1000)} secondi`,
          severity: 'medium'
        });
      }
    }
  });

  // Analizza scroll veloce (possibile frustrazione)
  const scrollInteractions = interactions.filter(i => i.interaction_type === 'scroll');
  scrollInteractions.forEach((scroll, index) => {
    if (index > 0) {
      const prevScroll = scrollInteractions[index - 1];
      const timeDiff = new Date(scroll.timestamp) - new Date(prevScroll.timestamp);
      const scrollDiff = Math.abs((scroll.scroll_position || 0) - (prevScroll.scroll_position || 0));
      
      if (timeDiff > 0 && scrollDiff / timeDiff > THRESHOLDS.HIGH_SCROLL_SPEED) {
        patterns.navigation_issues.push({
          type: 'rapid_scrolling',
          speed: Math.round(scrollDiff / timeDiff),
          timestamp: scroll.timestamp,
          context: `Scroll veloce: ${Math.round(scrollDiff / timeDiff)} px/ms`,
          severity: 'low'
        });
      }
    }
  });

  // Rileva segnali di abbandono
  const lastInteraction = interactions[interactions.length - 1];
  const lastMessage = messages[messages.length - 1];
  
  if (lastInteraction && lastMessage) {
    const timeSinceLastInteraction = Date.now() - new Date(lastInteraction.timestamp).getTime();
    const timeSinceLastMessage = Date.now() - new Date(lastMessage.timestamp).getTime();
    
    if (timeSinceLastInteraction > 300000 && timeSinceLastMessage > 300000) { // 5 minuti
      patterns.abandonment_signals.push({
        type: 'session_abandonment',
        duration: Math.min(timeSinceLastInteraction, timeSinceLastMessage),
        timestamp: new Date(),
        context: 'Sessione abbandonata da più di 5 minuti',
        severity: 'high'
      });
    }
  }

  return patterns;
}

function calculateEngagementScore(interactions, messages, cardViews, patterns) {
  let score = 100; // Punteggio base
  
  // Penalità per comportamenti negativi
  patterns.blocking_events.forEach(event => {
    if (event.severity === 'high') score -= 15;
    else if (event.severity === 'medium') score -= 8;
    else score -= 3;
  });
  
  patterns.confusion_episodes.forEach(() => score -= 5);
  patterns.rapid_interactions.forEach(() => score -= 10);
  patterns.repetitive_behavior.forEach(() => score -= 8);
  patterns.abandonment_signals.forEach(() => score -= 20);
  
  // Bonus per comportamenti positivi
  const avgCardViewDuration = cardViews.reduce((sum, view) => sum + view.view_duration, 0) / cardViews.length;
  if (avgCardViewDuration > 10000) score += 10; // Visualizzazioni lunghe
  
  const messageCount = messages.filter(m => m.role === 'user').length;
  if (messageCount > 5) score += 5; // Conversazione attiva
  
  return Math.max(0, Math.min(100, score));
}

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
      // Recupera interazioni utente
      const interactionsQuery = `
        SELECT * FROM user_interactions 
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
      `;
      const interactionsResult = await client.query(interactionsQuery, [conversationId]);
      
      // Recupera messaggi
      const messagesQuery = `
        SELECT * FROM messages 
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
      `;
      const messagesResult = await client.query(messagesQuery, [conversationId]);
      
      // Recupera visualizzazioni schede
      const cardViewsQuery = `
        SELECT * FROM activity_card_views 
        WHERE conversation_id = $1
        ORDER BY view_start ASC
      `;
      const cardViewsResult = await client.query(cardViewsQuery, [conversationId]);
      
      // Recupera pattern comportamentali esistenti dal database
      const existingPatternsQuery = `
        SELECT * FROM user_behavior_patterns 
        WHERE conversation_id = $1
        ORDER BY start_time DESC
      `;
      const existingPatternsResult = await client.query(existingPatternsQuery, [conversationId]);
      
      // Analizza i pattern comportamentali
      const detectedPatterns = detectBehaviorPatterns(
        interactionsResult.rows,
        messagesResult.rows,
        cardViewsResult.rows
      );
      
      // Calcola punteggio di engagement
      const engagementScore = calculateEngagementScore(
        interactionsResult.rows,
        messagesResult.rows,
        cardViewsResult.rows,
        detectedPatterns
      );
      
      // Statistiche comportamentali
      const behaviorStats = {
        total_interactions: interactionsResult.rows.length,
        unique_interaction_types: new Set(interactionsResult.rows.map(i => i.interaction_type)).size,
        avg_interaction_duration: interactionsResult.rows.reduce((sum, i) => sum + (i.duration || 0), 0) / interactionsResult.rows.length,
        total_blocking_events: detectedPatterns.blocking_events.length,
        total_confusion_episodes: detectedPatterns.confusion_episodes.length,
        total_rapid_interactions: detectedPatterns.rapid_interactions.length,
        engagement_score: Math.round(engagementScore * 100) / 100
      };
      
      // Timeline comportamentale
      const behaviorTimeline = [];
      
      // Aggiungi eventi di blocco
      detectedPatterns.blocking_events.forEach(event => {
        behaviorTimeline.push({
          timestamp: event.timestamp,
          type: 'blocking',
          subtype: event.type,
          severity: event.severity,
          description: event.context,
          duration: event.duration
        });
      });
      
      // Aggiungi episodi di confusione
      detectedPatterns.confusion_episodes.forEach(event => {
        behaviorTimeline.push({
          timestamp: event.timestamp,
          type: 'confusion',
          subtype: event.type,
          severity: event.severity,
          description: event.context,
          activity_id: event.activity_id
        });
      });
      
      // Ordina timeline per timestamp
      behaviorTimeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      return NextResponse.json({
        success: true,
        behaviorPatterns: {
          detected_patterns: detectedPatterns,
          existing_patterns: existingPatternsResult.rows,
          behavior_stats: behaviorStats,
          behavior_timeline: behaviorTimeline,
          recommendations: generateRecommendations(detectedPatterns, behaviorStats)
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Errore nell\'analisi dei pattern comportamentali:', error);
    return NextResponse.json(
      { success: false, message: 'Errore interno del server', error: error.message },
      { status: 500 }
    );
  }
}

function generateRecommendations(patterns, stats) {
  const recommendations = [];
  
  if (patterns.blocking_events.length > 2) {
    recommendations.push({
      type: 'blocking',
      priority: 'high',
      message: 'L\'utente ha mostrato segni di blocco multipli. Considera di semplificare l\'interfaccia o fornire più aiuto contestuale.'
    });
  }
  
  if (patterns.confusion_episodes.length > 3) {
    recommendations.push({
      type: 'confusion',
      priority: 'medium',
      message: 'Molti episodi di confusione rilevati. Le schede potrebbero essere troppo complesse o poco chiare.'
    });
  }
  
  if (patterns.rapid_interactions.length > 1) {
    recommendations.push({
      type: 'frustration',
      priority: 'medium',
      message: 'Interazioni rapide rilevate, possibile frustrazione. Verifica la responsività dell\'interfaccia.'
    });
  }
  
  if (stats.engagement_score < 50) {
    recommendations.push({
      type: 'engagement',
      priority: 'high',
      message: 'Basso punteggio di engagement. L\'esperienza utente necessita miglioramenti significativi.'
    });
  }
  
  if (patterns.abandonment_signals.length > 0) {
    recommendations.push({
      type: 'retention',
      priority: 'high',
      message: 'Segnali di abbandono rilevati. Implementa strategie di re-engagement.'
    });
  }
  
  return recommendations;
}