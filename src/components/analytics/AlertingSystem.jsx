'use client';

import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiX, FiBell, FiBellOff } from 'react-icons/fi';

const AlertingSystem = ({ analytics, cardViews, wordAnalysis, behaviorPatterns, performanceMetrics, conversationId }) => {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Analyze data and generate alerts
  useEffect(() => {
    if (!alertsEnabled) return;

    const newAlerts = [];
    const timestamp = new Date().toISOString();

    // Performance Alerts
    if (performanceMetrics?.overall_stats) {
      const { error_rate, total_errors, performance_score } = performanceMetrics.overall_stats;
      
      if (error_rate > 0.1) {
        newAlerts.push({
          id: `error-rate-${conversationId}`,
          type: 'critical',
          category: 'performance',
          title: 'Tasso di Errore Elevato',
          message: `Il tasso di errore è del ${Math.round(error_rate * 100)}%, superiore alla soglia del 10%`,
          timestamp,
          data: { error_rate, total_errors }
        });
      }

      if (total_errors > 5) {
        newAlerts.push({
          id: `total-errors-${conversationId}`,
          type: 'high',
          category: 'performance',
          title: 'Numero Elevato di Errori',
          message: `Rilevati ${total_errors} errori nella conversazione`,
          timestamp,
          data: { total_errors }
        });
      }

      if (performance_score < 50) {
        newAlerts.push({
          id: `low-performance-${conversationId}`,
          type: 'medium',
          category: 'performance',
          title: 'Performance Bassa',
          message: `Punteggio di performance: ${performance_score}/100`,
          timestamp,
          data: { performance_score }
        });
      }
    }

    // Behavior Alerts
    if (behaviorPatterns?.behavior_stats) {
      const { total_blocking_events, total_confusion_episodes, engagement_score } = behaviorPatterns.behavior_stats;
      
      if (total_blocking_events > 3) {
        newAlerts.push({
          id: `blocking-events-${conversationId}`,
          type: 'critical',
          category: 'behavior',
          title: 'Eventi di Blocco Frequenti',
          message: `L'utente ha avuto ${total_blocking_events} eventi di blocco`,
          timestamp,
          data: { total_blocking_events }
        });
      }

      if (total_confusion_episodes > 5) {
        newAlerts.push({
          id: `confusion-episodes-${conversationId}`,
          type: 'high',
          category: 'behavior',
          title: 'Episodi di Confusione Elevati',
          message: `Rilevati ${total_confusion_episodes} episodi di confusione`,
          timestamp,
          data: { total_confusion_episodes }
        });
      }

      if (engagement_score < 30) {
        newAlerts.push({
          id: `low-engagement-${conversationId}`,
          type: 'medium',
          category: 'behavior',
          title: 'Engagement Basso',
          message: `Punteggio di engagement: ${engagement_score}/100`,
          timestamp,
          data: { engagement_score }
        });
      }
    }

    // Session Duration Alerts
    if (analytics?.session?.session_duration) {
      const durationMinutes = analytics.session.session_duration / (1000 * 60);
      
      if (durationMinutes > 30) {
        newAlerts.push({
          id: `long-session-${conversationId}`,
          type: 'medium',
          category: 'session',
          title: 'Sessione Prolungata',
          message: `La sessione è durata ${Math.round(durationMinutes)} minuti`,
          timestamp,
          data: { duration_minutes: durationMinutes }
        });
      }

      if (durationMinutes < 1) {
        newAlerts.push({
          id: `short-session-${conversationId}`,
          type: 'low',
          category: 'session',
          title: 'Sessione Molto Breve',
          message: `La sessione è durata solo ${Math.round(durationMinutes * 60)} secondi`,
          timestamp,
          data: { duration_seconds: Math.round(durationMinutes * 60) }
        });
      }
    }

    // Word Analysis Alerts
    if (wordAnalysis?.overall_stats) {
      const { total_confusion_indicators, avg_words_per_message } = wordAnalysis.overall_stats;
      
      if (total_confusion_indicators > 10) {
        newAlerts.push({
          id: `confusion-indicators-${conversationId}`,
          type: 'high',
          category: 'language',
          title: 'Indicatori di Confusione Elevati',
          message: `Rilevati ${total_confusion_indicators} indicatori di confusione nel linguaggio`,
          timestamp,
          data: { total_confusion_indicators }
        });
      }

      if (avg_words_per_message < 3) {
        newAlerts.push({
          id: `short-messages-${conversationId}`,
          type: 'low',
          category: 'language',
          title: 'Messaggi Molto Brevi',
          message: `Media di ${avg_words_per_message} parole per messaggio`,
          timestamp,
          data: { avg_words_per_message }
        });
      }
    }

    // Engagement Alerts
    if (cardViews?.engagement_metrics) {
      const { total_card_views, avg_view_duration } = cardViews.engagement_metrics;
      
      if (total_card_views === 0) {
        newAlerts.push({
          id: `no-card-views-${conversationId}`,
          type: 'medium',
          category: 'engagement',
          title: 'Nessuna Scheda Visualizzata',
          message: 'L\'utente non ha visualizzato alcuna scheda attività',
          timestamp,
          data: { total_card_views }
        });
      }

      if (avg_view_duration && avg_view_duration < 5000) {
        newAlerts.push({
          id: `short-view-duration-${conversationId}`,
          type: 'low',
          category: 'engagement',
          title: 'Visualizzazioni Molto Brevi',
          message: `Durata media di visualizzazione: ${Math.round(avg_view_duration / 1000)}s`,
          timestamp,
          data: { avg_view_duration }
        });
      }
    }

    // Filter out dismissed alerts
    const filteredAlerts = newAlerts.filter(alert => !dismissedAlerts.has(alert.id));
    setAlerts(filteredAlerts);
  }, [analytics, cardViews, wordAnalysis, behaviorPatterns, performanceMetrics, conversationId, alertsEnabled, dismissedAlerts]);

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <FiAlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <FiAlertCircle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <FiInfo className="w-5 h-5 text-yellow-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'performance':
        return 'bg-red-100 text-red-800';
      case 'behavior':
        return 'bg-orange-100 text-orange-800';
      case 'session':
        return 'bg-blue-100 text-blue-800';
      case 'language':
        return 'bg-purple-100 text-purple-800';
      case 'engagement':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const highAlerts = alerts.filter(alert => alert.type === 'high');
  const otherAlerts = alerts.filter(alert => !['critical', 'high'].includes(alert.type));

  if (!alertsEnabled) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiBellOff className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Sistema di Alerting</h3>
          </div>
          <button
            onClick={() => setAlertsEnabled(true)}
            className="px-4 py-2 bg-[#1E4E68] text-white rounded-lg hover:bg-[#1E4E68]/90 transition-colors"
          >
            Abilita Alerting
          </button>
        </div>
        <p className="text-gray-600 mt-2">Il sistema di alerting è disabilitato</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiBell className="w-5 h-5 text-[#1E4E68]" />
            <h3 className="text-lg font-semibold text-gray-900">Sistema di Alerting</h3>
            {alerts.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={() => setAlertsEnabled(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Disabilita
          </button>
        </div>
        
        {alerts.length === 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">Tutto OK</span>
            </div>
            <p className="text-green-700 text-sm mt-1">Nessun comportamento anomalo rilevato</p>
          </div>
        )}
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center space-x-2">
            <FiAlertTriangle className="w-5 h-5" />
            <span>Alert Critici</span>
          </h4>
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertStyles(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold">{alert.title}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(alert.category)}`}>
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Priority Alerts */}
      {highAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center space-x-2">
            <FiAlertCircle className="w-5 h-5" />
            <span>Alert Alta Priorità</span>
          </h4>
          <div className="space-y-3">
            {highAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertStyles(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold">{alert.title}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(alert.category)}`}>
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Alerts */}
      {otherAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <FiInfo className="w-5 h-5" />
            <span>Altri Alert</span>
          </h4>
          <div className="space-y-3">
            {otherAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertStyles(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-semibold">{alert.title}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(alert.category)}`}>
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertingSystem;