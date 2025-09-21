'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsCharts = ({ analytics, cardViews, wordAnalysis, behaviorPatterns, performanceMetrics }) => {
  const sessionChartRef = useRef(null);
  const engagementChartRef = useRef(null);
  const sentimentChartRef = useRef(null);
  const behaviorChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const wordCloudRef = useRef(null);

  // Cleanup function for charts
  const cleanupChart = (chartRef) => {
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
  };

  // Session Analytics Chart
  useEffect(() => {
    if (!analytics?.timeline) return;

    const canvas = document.getElementById('sessionChart');
    if (!canvas) return;

    cleanupChart(sessionChartRef);

    const ctx = canvas.getContext('2d');
    const timelineData = analytics.timeline.slice(0, 20);
    
    const labels = timelineData.map((_, index) => `Evento ${index + 1}`);
    const durations = timelineData.map(event => event.duration ? event.duration / 1000 : 0);
    
    sessionChartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Durata Eventi (secondi)',
          data: durations,
          borderColor: '#1E4E68',
          backgroundColor: 'rgba(30, 78, 104, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Durata (s)'
            }
          }
        }
      }
    });
  }, [analytics]);

  // Engagement Chart
  useEffect(() => {
    if (!cardViews?.top_activities) return;

    const canvas = document.getElementById('engagementChart');
    if (!canvas) return;

    cleanupChart(engagementChartRef);

    const ctx = canvas.getContext('2d');
    const topActivities = cardViews.top_activities.slice(0, 8);
    
    const labels = topActivities.map(activity => activity.activity_name.substring(0, 20) + '...');
    const viewCounts = topActivities.map(activity => activity.view_count);
    const timeSpent = topActivities.map(activity => Math.round(activity.total_time_spent / 1000));
    
    engagementChartRef.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Visualizzazioni',
            data: viewCounts,
            backgroundColor: 'rgba(30, 78, 104, 0.8)',
            yAxisID: 'y'
          },
          {
            label: 'Tempo Totale (s)',
            data: timeSpent,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Visualizzazioni'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Tempo (s)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });
  }, [cardViews]);

  // Sentiment Chart
  useEffect(() => {
    if (!wordAnalysis?.sentiment_progression) return;

    const canvas = document.getElementById('sentimentChart');
    if (!canvas) return;

    cleanupChart(sentimentChartRef);

    const ctx = canvas.getContext('2d');
    const sentimentData = wordAnalysis.sentiment_progression;
    
    const labels = sentimentData.map((_, index) => `Msg ${index + 1}`);
    const sentimentValues = sentimentData.map(item => {
      switch(item.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });
    
    sentimentChartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sentiment',
          data: sentimentValues,
          borderColor: function(context) {
            const value = context.parsed.y;
            return value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#6B7280';
          },
          backgroundColor: function(context) {
            const value = context.parsed.y;
            return value > 0 ? 'rgba(16, 185, 129, 0.1)' : value < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)';
          },
          tension: 0.4,
          fill: true,
          pointBackgroundColor: function(context) {
            const value = context.parsed.y;
            return value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#6B7280';
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            min: -1.2,
            max: 1.2,
            ticks: {
              callback: function(value) {
                if (value === 1) return 'Positivo';
                if (value === 0) return 'Neutro';
                if (value === -1) return 'Negativo';
                return '';
              }
            },
            title: {
              display: true,
              text: 'Sentiment'
            }
          }
        }
      }
    });
  }, [wordAnalysis]);

  // Behavior Patterns Chart
  useEffect(() => {
    if (!behaviorPatterns?.behavior_stats) return;

    const canvas = document.getElementById('behaviorChart');
    if (!canvas) return;

    cleanupChart(behaviorChartRef);

    const ctx = canvas.getContext('2d');
    const stats = behaviorPatterns.behavior_stats;
    
    behaviorChartRef.current = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Eventi di Blocco', 'Episodi Confusione', 'Interazioni Rapide', 'Comportamenti Normali'],
        datasets: [{
          data: [
            stats.total_blocking_events || 0,
            stats.total_confusion_episodes || 0,
            stats.total_rapid_interactions || 0,
            Math.max(0, (stats.engagement_score || 0) - (stats.total_blocking_events || 0) - (stats.total_confusion_episodes || 0) - (stats.total_rapid_interactions || 0))
          ],
          backgroundColor: [
            '#EF4444', // Rosso per blocchi
            '#F59E0B', // Giallo per confusione
            '#F97316', // Arancione per interazioni rapide
            '#10B981'  // Verde per normali
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  }, [behaviorPatterns]);

  // Performance Chart
  useEffect(() => {
    if (!performanceMetrics?.error_analysis?.error_severity_distribution) return;

    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;

    cleanupChart(performanceChartRef);

    const ctx = canvas.getContext('2d');
    const errorDist = performanceMetrics.error_analysis.error_severity_distribution;
    
    performanceChartRef.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels: ['Errori Alta Severità', 'Errori Media Severità', 'Errori Bassa Severità'],
        datasets: [{
          label: 'Numero di Errori',
          data: [errorDist.high || 0, errorDist.medium || 0, errorDist.low || 0],
          backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
          borderColor: ['#DC2626', '#D97706', '#2563EB'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Numero di Errori'
            }
          }
        }
      }
    });
  }, [performanceMetrics]);

  // Word Cloud Visualization
  useEffect(() => {
    if (!wordAnalysis?.user_analysis?.top_words) return;

    const canvas = document.getElementById('wordCloudChart');
    if (!canvas) return;

    cleanupChart(wordCloudRef);

    const ctx = canvas.getContext('2d');
    const topWords = wordAnalysis.user_analysis.top_words.slice(0, 10);
    
    const labels = topWords.map(([word]) => word);
    const counts = topWords.map(([, count]) => count);
    
    wordCloudRef.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Frequenza Parole',
          data: counts,
          backgroundColor: 'rgba(30, 78, 104, 0.8)',
          borderColor: '#1E4E68',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequenza'
            }
          }
        }
      }
    });
  }, [wordAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupChart(sessionChartRef);
      cleanupChart(engagementChartRef);
      cleanupChart(sentimentChartRef);
      cleanupChart(behaviorChartRef);
      cleanupChart(performanceChartRef);
      cleanupChart(wordCloudRef);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Session Timeline Chart */}
      {analytics?.timeline && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Attività Sessione</h3>
          <div className="h-64">
            <canvas id="sessionChart"></canvas>
          </div>
        </div>
      )}

      {/* Engagement Chart */}
      {cardViews?.top_activities && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement per Attività</h3>
          <div className="h-64">
            <canvas id="engagementChart"></canvas>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Chart */}
        {wordAnalysis?.sentiment_progression && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evoluzione Sentiment</h3>
            <div className="h-48">
              <canvas id="sentimentChart"></canvas>
            </div>
          </div>
        )}

        {/* Behavior Patterns Chart */}
        {behaviorPatterns?.behavior_stats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Comportamenti</h3>
            <div className="h-48">
              <canvas id="behaviorChart"></canvas>
            </div>
          </div>
        )}

        {/* Performance Chart */}
        {performanceMetrics?.error_analysis && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuzione Errori</h3>
            <div className="h-48">
              <canvas id="performanceChart"></canvas>
            </div>
          </div>
        )}

        {/* Word Frequency Chart */}
        {wordAnalysis?.user_analysis?.top_words && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parole Più Frequenti</h3>
            <div className="h-48">
              <canvas id="wordCloudChart"></canvas>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCharts;