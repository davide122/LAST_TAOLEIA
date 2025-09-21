import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Soglie per classificare le performance
const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME: {
    EXCELLENT: 500,
    GOOD: 1000,
    FAIR: 2000,
    POOR: 5000
  },
  LOAD_TIME: {
    EXCELLENT: 1000,
    GOOD: 2000,
    FAIR: 3000,
    POOR: 5000
  },
  ERROR_RATE: {
    EXCELLENT: 0.01,
    GOOD: 0.05,
    FAIR: 0.1,
    POOR: 0.2
  }
};

// Classificazione degli errori per severità
const ERROR_SEVERITY = {
  'TypeError': 'high',
  'ReferenceError': 'high',
  'SyntaxError': 'high',
  'NetworkError': 'medium',
  'TimeoutError': 'medium',
  'ValidationError': 'low',
  'UserInputError': 'low',
  'PermissionError': 'medium',
  'AuthenticationError': 'high',
  'DatabaseError': 'high',
  'APIError': 'medium'
};

function classifyPerformance(value, thresholds) {
  if (value <= thresholds.EXCELLENT) return 'excellent';
  if (value <= thresholds.GOOD) return 'good';
  if (value <= thresholds.FAIR) return 'fair';
  if (value <= thresholds.POOR) return 'poor';
  return 'critical';
}

function analyzeErrorPatterns(errors) {
  const patterns = {
    error_frequency: {},
    error_severity_distribution: { high: 0, medium: 0, low: 0 },
    error_timeline: [],
    recurring_errors: [],
    error_contexts: {},
    critical_error_sequences: []
  };

  // Analizza frequenza errori
  errors.forEach(error => {
    const errorType = error.error_type || 'Unknown';
    patterns.error_frequency[errorType] = (patterns.error_frequency[errorType] || 0) + 1;
    
    // Classifica severità
    const severity = ERROR_SEVERITY[errorType] || 'medium';
    patterns.error_severity_distribution[severity]++;
    
    // Timeline errori
    patterns.error_timeline.push({
      timestamp: error.timestamp,
      type: errorType,
      severity: severity,
      message: error.error_message,
      context: error.context
    });
    
    // Analizza contesti
    const context = error.context?.component || 'Unknown';
    if (!patterns.error_contexts[context]) {
      patterns.error_contexts[context] = { count: 0, errors: [] };
    }
    patterns.error_contexts[context].count++;
    patterns.error_contexts[context].errors.push(errorType);
  });

  // Identifica errori ricorrenti
  Object.entries(patterns.error_frequency).forEach(([errorType, count]) => {
    if (count >= 3) {
      patterns.recurring_errors.push({
        type: errorType,
        count: count,
        severity: ERROR_SEVERITY[errorType] || 'medium'
      });
    }
  });

  // Identifica sequenze critiche (errori consecutivi)
  for (let i = 0; i < errors.length - 1; i++) {
    const currentError = errors[i];
    const nextError = errors[i + 1];
    const timeDiff = new Date(nextError.timestamp) - new Date(currentError.timestamp);
    
    if (timeDiff < 10000) { // Errori entro 10 secondi
      patterns.critical_error_sequences.push({
        first_error: currentError.error_type,
        second_error: nextError.error_type,
        time_between: timeDiff,
        timestamp: currentError.timestamp
      });
    }
  }

  return patterns;
}

function calculatePerformanceScore(metrics, errors) {
  let score = 100;
  
  // Penalità per performance scarse
  const avgResponseTime = metrics.reduce((sum, m) => 
    sum + (m.metric_name === 'response_time' ? parseFloat(m.metric_value) : 0), 0) / 
    metrics.filter(m => m.metric_name === 'response_time').length;
  
  if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.POOR) score -= 30;
  else if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.FAIR) score -= 20;
  else if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.GOOD) score -= 10;
  
  // Penalità per errori
  const errorRate = errors.length / Math.max(1, metrics.length);
  if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE.POOR) score -= 40;
  else if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE.FAIR) score -= 25;
  else if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE.GOOD) score -= 15;
  
  // Penalità per errori critici
  const criticalErrors = errors.filter(e => ERROR_SEVERITY[e.error_type] === 'high').length;
  score -= criticalErrors * 10;
  
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
      // Recupera metriche di performance
      const performanceQuery = `
        SELECT 
          pm.*,
          EXTRACT(EPOCH FROM (pm.timestamp - LAG(pm.timestamp) OVER (ORDER BY pm.timestamp))) * 1000 as time_since_previous
        FROM performance_metrics pm
        WHERE pm.conversation_id = $1
        ORDER BY pm.timestamp ASC
      `;
      const performanceResult = await client.query(performanceQuery, [conversationId]);
      
      // Recupera errori dettagliati
      const errorsQuery = `
        SELECT 
          ea.*,
          EXTRACT(EPOCH FROM (ea.timestamp - LAG(ea.timestamp) OVER (ORDER BY ea.timestamp))) * 1000 as time_since_previous_error
        FROM error_analytics ea
        WHERE ea.conversation_id = $1
        ORDER BY ea.timestamp ASC
      `;
      const errorsResult = await client.query(errorsQuery, [conversationId]);
      
      // Recupera informazioni di sistema
      const systemInfoQuery = `
        SELECT 
          browser_name,
          browser_version,
          os_name,
          os_version,
          device_type,
          screen_resolution,
          connection_type,
          user_agent
        FROM conversations 
        WHERE id = $1
      `;
      const systemInfoResult = await client.query(systemInfoQuery, [conversationId]);
      
      // Analizza le metriche di performance
      const metrics = performanceResult.rows;
      const errors = errorsResult.rows;
      
      // Raggruppa metriche per tipo
      const metricsByType = {};
      metrics.forEach(metric => {
        if (!metricsByType[metric.metric_name]) {
          metricsByType[metric.metric_name] = [];
        }
        metricsByType[metric.metric_name].push(parseFloat(metric.metric_value));
      });
      
      // Calcola statistiche per ogni tipo di metrica
      const performanceStats = {};
      Object.entries(metricsByType).forEach(([metricName, values]) => {
        const sorted = values.sort((a, b) => a - b);
        performanceStats[metricName] = {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          median: sorted[Math.floor(sorted.length / 2)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          classification: classifyPerformance(
            values.reduce((sum, val) => sum + val, 0) / values.length,
            PERFORMANCE_THRESHOLDS.RESPONSE_TIME
          )
        };
      });
      
      // Analizza pattern degli errori
      const errorPatterns = analyzeErrorPatterns(errors);
      
      // Calcola punteggio di performance
      const performanceScore = calculatePerformanceScore(metrics, errors);
      
      // Analizza trend temporali
      const timeWindows = {};
      metrics.forEach(metric => {
        const hour = new Date(metric.timestamp).getHours();
        if (!timeWindows[hour]) timeWindows[hour] = { metrics: [], errors: [] };
        timeWindows[hour].metrics.push(metric);
      });
      
      errors.forEach(error => {
        const hour = new Date(error.timestamp).getHours();
        if (!timeWindows[hour]) timeWindows[hour] = { metrics: [], errors: [] };
        timeWindows[hour].errors.push(error);
      });
      
      // Identifica picchi di performance
      const performancePeaks = [];
      Object.entries(timeWindows).forEach(([hour, data]) => {
        const avgResponseTime = data.metrics
          .filter(m => m.metric_name === 'response_time')
          .reduce((sum, m) => sum + parseFloat(m.metric_value), 0) / 
          Math.max(1, data.metrics.filter(m => m.metric_name === 'response_time').length);
        
        if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.POOR) {
          performancePeaks.push({
            hour: parseInt(hour),
            avg_response_time: avgResponseTime,
            error_count: data.errors.length,
            severity: 'high'
          });
        }
      });
      
      // Raccomandazioni per il miglioramento
      const recommendations = [];
      
      if (performanceScore < 70) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          message: 'Performance generali scarse. Ottimizzazione urgente necessaria.'
        });
      }
      
      if (errorPatterns.recurring_errors.length > 0) {
        recommendations.push({
          type: 'errors',
          priority: 'high',
          message: `${errorPatterns.recurring_errors.length} tipi di errori ricorrenti rilevati. Priorità alla risoluzione.`
        });
      }
      
      if (performancePeaks.length > 0) {
        recommendations.push({
          type: 'load',
          priority: 'medium',
          message: `Picchi di performance rilevati in ${performancePeaks.length} fasce orarie. Considera il load balancing.`
        });
      }
      
      const criticalErrors = errors.filter(e => ERROR_SEVERITY[e.error_type] === 'high');
      if (criticalErrors.length > 0) {
        recommendations.push({
          type: 'critical_errors',
          priority: 'critical',
          message: `${criticalErrors.length} errori critici rilevati. Intervento immediato richiesto.`
        });
      }
      
      return NextResponse.json({
        success: true,
        performanceMetrics: {
          overall_stats: {
            total_metrics: metrics.length,
            total_errors: errors.length,
            error_rate: errors.length / Math.max(1, metrics.length),
            performance_score: Math.round(performanceScore * 100) / 100,
            session_duration: metrics.length > 0 ? 
              new Date(metrics[metrics.length - 1].timestamp) - new Date(metrics[0].timestamp) : 0
          },
          performance_stats: performanceStats,
          error_analysis: errorPatterns,
          system_info: systemInfoResult.rows[0] || {},
          time_analysis: {
            performance_peaks: performancePeaks,
            hourly_distribution: Object.entries(timeWindows).map(([hour, data]) => ({
              hour: parseInt(hour),
              metric_count: data.metrics.length,
              error_count: data.errors.length
            }))
          },
          detailed_metrics: metrics,
          detailed_errors: errors,
          recommendations: recommendations
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Errore nel recupero metriche di performance:', error);
    return NextResponse.json(
      { success: false, message: 'Errore interno del server', error: error.message },
      { status: 500 }
    );
  }
}