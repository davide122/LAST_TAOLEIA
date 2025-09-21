"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiMessageSquare, FiAlertCircle, FiInfo, FiRefreshCw, FiFilter } from 'react-icons/fi';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import AlertingSystem from '@/components/analytics/AlertingSystem';
import CardDisplay from '@/components/backoffice/CardDisplay';
import { useConversationAnalytics } from '@/hooks/useConversationAnalytics';

export default function ConversationDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const conversationId = unwrappedParams.id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [errors, setErrors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [cardViews, setCardViews] = useState(null);
  const [wordAnalysis, setWordAnalysis] = useState(null);
  const [behaviorPatterns, setBehaviorPatterns] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('messages');
  const [messageFilter, setMessageFilter] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Inizializza tracking analytics automatico
  const {
    isTracking,
    trackMessage,
    trackCardView,
    trackUserBehavior,
    trackError,
    interactionCounts
  } = useConversationAnalytics(conversationId);

  // Carica i dettagli della conversazione
  const loadConversationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carica i dettagli della conversazione
      const convResponse = await fetch(`/api/conversations/${conversationId}`);
      if (!convResponse.ok) {
        throw new Error(`HTTP error! status: ${convResponse.status}`);
      }
      const convData = await convResponse.json();

      if (!convData.success) {
        throw new Error(convData.message || 'Failed to load conversation');
      }

      setConversation(convData.conversation);

      // Carica i messaggi
      const messagesResponse = await fetch(`/api/conversations/messages?conversationId=${conversationId}`);
      if (!messagesResponse.ok) {
        throw new Error(`HTTP error! status: ${messagesResponse.status}`);
      }
      const messagesData = await messagesResponse.json();

      if (!messagesData.success) {
        throw new Error(messagesData.message || 'Failed to load messages');
      }

      setMessages(messagesData.messages);

      // Carica gli errori
      const errorsResponse = await fetch(`/api/conversations/errors?conversationId=${conversationId}`);
      if (!errorsResponse.ok) {
        throw new Error(`HTTP error! status: ${errorsResponse.status}`);
      }
      const errorsData = await errorsResponse.json();

      if (!errorsData.success) {
        throw new Error(errorsData.message || 'Failed to load errors');
      }

      setErrors(errorsData.errors);
      setSuccess('Dati caricati con successo');
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento dei dettagli:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      
      // Carica analytics di sessione
      const analyticsResponse = await fetch(`/api/conversations/analytics?conversationId=${conversationId}`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.success) {
          setAnalytics(analyticsData.analytics);
        }
      }
      
      // Carica visualizzazioni schede
      const cardViewsResponse = await fetch(`/api/conversations/card-views?conversationId=${conversationId}`);
      if (cardViewsResponse.ok) {
        const cardViewsData = await cardViewsResponse.json();
        if (cardViewsData.success) {
          setCardViews(cardViewsData.cardViews);
        }
      }
      
      // Carica analisi parole
      const wordAnalysisResponse = await fetch(`/api/conversations/word-analysis?conversationId=${conversationId}`);
      if (wordAnalysisResponse.ok) {
        const wordAnalysisData = await wordAnalysisResponse.json();
        if (wordAnalysisData.success) {
          setWordAnalysis(wordAnalysisData.wordAnalysis);
        }
      }
      
      // Carica pattern comportamentali
      const behaviorResponse = await fetch(`/api/conversations/behavior-patterns?conversationId=${conversationId}`);
      if (behaviorResponse.ok) {
        const behaviorData = await behaviorResponse.json();
        if (behaviorData.success) {
          setBehaviorPatterns(behaviorData.behaviorPatterns);
        }
      }
      
      // Carica metriche performance
      const performanceResponse = await fetch(`/api/conversations/performance-metrics?conversationId=${conversationId}`);
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        if (performanceData.success) {
          setPerformanceMetrics(performanceData.performanceMetrics);
        }
      }
      
    } catch (err) {
      console.error('Errore nel caricamento analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      loadConversationDetails();
      loadAnalyticsData();
    }
  }, [conversationId]);

  // Filtra i messaggi per ruolo
  const filteredMessages = messages.filter(message => 
    filterRole === 'all' || message.role === filterRole
  );

  // Estrai i ruoli unici
  const roles = ['all', ...new Set(messages.map(m => m.role))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7]">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <Link 
                href="/backoffice/conversations" 
                className="flex items-center gap-2 text-[#FEF5E7]/80 hover:text-[#FEF5E7] transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Torna alla lista</span>
              </Link>
              <h1 className="text-3xl font-bold mt-2">
                Conversazione #{conversationId}
              </h1>
            </div>
            <button
              onClick={loadConversationDetails}
              className="flex items-center gap-2 px-4 py-2 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 p-4 rounded-xl mb-6">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 p-4 rounded-xl mb-6">
              <div className="flex items-center gap-2">
                <FiInfo className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Conversation Info */}
          {conversation && (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[#FEF5E7]/60">Thread ID</h3>
                  <p className="mt-1 text-[#FEF5E7]">{conversation.thread_id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#FEF5E7]/60">Lingua</h3>
                  <p className="mt-1 text-[#FEF5E7]">{conversation.language.toUpperCase()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#FEF5E7]/60">Stato</h3>
                  <p className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      conversation.status === 'active' ? 'bg-green-500/20 text-green-200' :
                      conversation.status === 'completed' ? 'bg-blue-500/20 text-blue-200' :
                      'bg-red-500/20 text-red-200'
                    }`}>
                      {conversation.status}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#FEF5E7]/60">Data Inizio</h3>
                  <p className="mt-1 text-[#FEF5E7]">
                    {new Date(conversation.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Messaggi ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'errors'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Errori ({errors.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Analytics Sessione
            </button>
            <button
              onClick={() => setActiveTab('cardViews')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'cardViews'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Schede Visualizzate
            </button>
            <button
              onClick={() => setActiveTab('wordAnalysis')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'wordAnalysis'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Analisi Parole
            </button>
            <button
              onClick={() => setActiveTab('behavior')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'behavior'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Comportamento
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'charts'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Grafici
            </button>
            <button
              onClick={() => setActiveTab('alert')}
              className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'alert'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Alert
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
              <p className="mt-4 text-[#FEF5E7]/80">Caricamento in corso...</p>
            </div>
          ) : activeTab === 'messages' ? (
            <>
              {/* Filtro messaggi */}
              <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 mb-6">
                <div className="flex items-center gap-2">
                  <FiFilter className="text-[#FEF5E7]/60" />
                  <select
                    className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {role === 'all' ? 'Tutti i ruoli' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista messaggi */}
              {filteredMessages.length === 0 ? (
                <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-8 text-center">
                  <FiMessageSquare className="w-12 h-12 mx-auto text-[#FEF5E7]/40" />
                  <p className="mt-4 text-xl text-[#FEF5E7]/80">Nessun messaggio trovato</p>
                  <p className="mt-2 text-[#FEF5E7]/60">Prova a modificare i filtri</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            message.role === 'user' ? 'bg-blue-500/20 text-blue-200' :
                            message.role === 'assistant' ? 'bg-green-500/20 text-green-200' :
                            message.role === 'error' ? 'bg-red-500/20 text-red-200' :
                            'bg-gray-500/20 text-gray-200'
                          }`}>
                            {message.role}
                          </span>
                          <span className="text-sm text-[#FEF5E7]/60">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-[#FEF5E7] whitespace-pre-wrap">
                        {message.content}
                      </div>
                      {message.metadata && (
                        <div className="mt-4">
                          {message.role === 'tool' ? (
                            <CardDisplay card={message} />
                          ) : (
                            <div className="pt-4 border-t border-[#FEF5E7]/10">
                              <pre className="text-sm text-[#FEF5E7]/60 overflow-x-auto">
                                {JSON.stringify(message.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Lista errori
            <div className="space-y-4">
              {errors.length === 0 ? (
                <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-8 text-center">
                  <FiAlertCircle className="w-12 h-12 mx-auto text-[#FEF5E7]/40" />
                  <p className="mt-4 text-xl text-[#FEF5E7]/80">Nessun errore trovato</p>
                </div>
              ) : (
                errors.map((error) => (
                  <div
                    key={error.id}
                    className="bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-500/20 p-6"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-red-200">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-red-200 mb-4">
                      {error.error_message}
                    </div>
                    {error.error_context && (
                      <div className="mt-4 pt-4 border-t border-red-500/20">
                        <pre className="text-sm text-red-200/80 overflow-x-auto">
                          {JSON.stringify(error.error_context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Analytics Sessione */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E4E68] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Caricamento analytics...</p>
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informazioni Sessione */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Sessione</h3>
                    {analytics.session && (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">IP Utente:</span>
                          <span className="font-medium">{analytics.session.user_ip || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paese:</span>
                          <span className="font-medium">{analytics.session.user_country || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Città:</span>
                          <span className="font-medium">{analytics.session.user_city || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timezone:</span>
                          <span className="font-medium">{analytics.session.user_timezone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Durata Sessione:</span>
                          <span className="font-medium">{analytics.session.session_duration ? `${Math.round(analytics.session.session_duration / 1000)}s` : 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statistiche Interazioni */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Interazioni</h3>
                    {analytics.stats && (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Totale Interazioni:</span>
                          <span className="font-medium">{analytics.stats.total_interactions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Schede Visualizzate:</span>
                          <span className="font-medium">{analytics.stats.total_card_views || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Durata Media Visualizzazione:</span>
                          <span className="font-medium">{analytics.stats.avg_card_view_duration ? `${Math.round(analytics.stats.avg_card_view_duration / 1000)}s` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Problemi Comportamentali:</span>
                          <span className="font-medium">{analytics.stats.behavior_issues || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Totale Click:</span>
                          <span className="font-medium">{analytics.stats.total_clicks || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timeline Attività */}
                  {analytics.timeline && analytics.timeline.length > 0 && (
                    <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Attività</h3>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {analytics.timeline.slice(0, 20).map((event, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                              event.type === 'interaction' ? 'bg-blue-500' :
                              event.type === 'card_view' ? 'bg-green-500' :
                              'bg-yellow-500'
                            }`}></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {event.action} - {event.target}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleString()}
                                {event.duration && ` • ${Math.round(event.duration / 1000)}s`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nessun dato analytics disponibile
                </div>
              )}
            </div>
          )}

          {/* Schede Visualizzate */}
          {activeTab === 'cardViews' && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E4E68] rounded-full mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Caricamento dati schede</h3>
                    <p className="text-gray-600">Stiamo recuperando le informazioni sulle visualizzazioni delle schede...</p>
                  </div>
                </div>
              ) : cardViews ? (
                <div className="space-y-6">
                  {/* Metriche Engagement */}
                  {cardViews.engagement_metrics && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#1E4E68] rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Metriche di Engagement</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-[#1E4E68] mb-1">{cardViews.engagement_metrics.total_card_views || 0}</div>
                          <div className="text-sm text-gray-600">Visualizzazioni Totali</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-[#1E4E68] mb-1">{cardViews.engagement_metrics.unique_activities_viewed || 0}</div>
                          <div className="text-sm text-gray-600">Attività Uniche</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-[#1E4E68] mb-1">{cardViews.engagement_metrics.avg_view_duration ? `${Math.round(cardViews.engagement_metrics.avg_view_duration / 1000)}s` : '0s'}</div>
                          <div className="text-sm text-gray-600">Durata Media</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-[#1E4E68] mb-1">{cardViews.engagement_metrics.total_audio_plays || 0}</div>
                          <div className="text-sm text-gray-600">Audio Riprodotti</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Attività */}
                  {cardViews.top_activities && cardViews.top_activities.length > 0 && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">Attività Più Visualizzate</h3>
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {cardViews.top_activities.length} attività
                        </div>
                      </div>
                      <div className="space-y-3">
                        {cardViews.top_activities.slice(0, 10).map((activity, index) => (
                          <div key={index} className="group bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="flex-shrink-0">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                                    'bg-gradient-to-r from-blue-400 to-indigo-500'
                                  }`}>
                                    #{index + 1}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate group-hover:text-[#1E4E68] transition-colors">
                                    {activity.activity_name}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {activity.activity_category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="flex items-center space-x-3">
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-[#1E4E68]">{Math.round(activity.total_time_spent / 1000)}s</div>
                                    <div className="text-xs text-gray-500">Tempo totale</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-green-600">{activity.view_count}</div>
                                    <div className="text-xs text-gray-500">Visualizzazioni</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {cardViews.top_activities.length > 10 && (
                        <div className="mt-4 text-center">
                          <div className="text-sm text-gray-500">
                            Mostrando le prime 10 di {cardViews.top_activities.length} attività
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sequenze di Visualizzazione */}
                  {cardViews.view_sequences && cardViews.view_sequences.length > 0 && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">Sequenze di Navigazione</h3>
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {cardViews.view_sequences.length} transizioni
                        </div>
                      </div>
                      <div className="space-y-3">
                        {cardViews.view_sequences.slice(0, 10).map((sequence, index) => (
                          <div key={index} className="group bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">{index + 1}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                      <div className="font-medium text-blue-900 text-sm truncate">
                                        {sequence.from_activity}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                      <svg className="w-4 h-4 text-gray-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                      <div className="font-medium text-green-900 text-sm truncate">
                                        {sequence.to_activity}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-4">
                                <div className="text-center">
                                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white">
                                    {sequence.transition_count}x
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">Transizioni</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {cardViews.view_sequences.length > 10 && (
                        <div className="mt-4 text-center">
                          <div className="text-sm text-gray-500">
                            Mostrando le prime 10 di {cardViews.view_sequences.length} sequenze
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun dato disponibile</h3>
                    <p className="text-gray-600 mb-4">Non sono ancora disponibili dati sulle visualizzazioni delle schede per questa conversazione.</p>
                    <div className="text-sm text-gray-500">
                      I dati verranno mostrati quando gli utenti inizieranno a interagire con le schede.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analisi Parole */}
          {activeTab === 'wordAnalysis' && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E4E68] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Analizzando il linguaggio...</p>
                </div>
              ) : wordAnalysis ? (
                <div className="space-y-6">
                  {/* Statistiche Generali */}
                  {wordAnalysis.overall_stats && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Linguistiche</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#1E4E68]">{wordAnalysis.overall_stats.total_user_messages || 0}</div>
                          <div className="text-sm text-gray-600">Messaggi Utente</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#1E4E68]">{wordAnalysis.overall_stats.total_words || 0}</div>
                          <div className="text-sm text-gray-600">Parole Totali</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#1E4E68]">{wordAnalysis.overall_stats.avg_words_per_message || 0}</div>
                          <div className="text-sm text-gray-600">Parole per Messaggio</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#1E4E68]">{wordAnalysis.overall_stats.total_confusion_indicators || 0}</div>
                          <div className="text-sm text-gray-600">Indicatori Confusione</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parole Più Usate */}
                  {wordAnalysis.user_analysis && wordAnalysis.user_analysis.top_words && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Parole Più Usate</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {wordAnalysis.user_analysis.top_words.slice(0, 15).map(([word, count], index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{word}</span>
                            <span className="text-sm font-bold text-[#1E4E68]">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentiment Analysis */}
                  {wordAnalysis.sentiment_progression && wordAnalysis.sentiment_progression.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Evoluzione del Sentiment</h3>
                      <div className="space-y-2">
                        {wordAnalysis.sentiment_progression.map((sentiment, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                              sentiment.sentiment === 'positive' ? 'bg-green-500' :
                              sentiment.sentiment === 'negative' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">Messaggio {sentiment.message_index}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(sentiment.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-sm font-medium capitalize">
                              {sentiment.sentiment}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nessuna analisi linguistica disponibile
                </div>
              )}
            </div>
          )}

          {/* Pattern Comportamentali */}
          {activeTab === 'behavior' && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E4E68] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Analizzando comportamenti...</p>
                </div>
              ) : behaviorPatterns ? (
                <div className="space-y-6">
                  {/* Statistiche Comportamentali */}
                  {behaviorPatterns.behavior_stats && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Comportamentali</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#1E4E68]">{behaviorPatterns.behavior_stats.engagement_score || 0}</div>
                          <div className="text-sm text-gray-600">Punteggio Engagement</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{behaviorPatterns.behavior_stats.total_blocking_events || 0}</div>
                          <div className="text-sm text-gray-600">Eventi di Blocco</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{behaviorPatterns.behavior_stats.total_confusion_episodes || 0}</div>
                          <div className="text-sm text-gray-600">Episodi Confusione</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{behaviorPatterns.behavior_stats.total_rapid_interactions || 0}</div>
                          <div className="text-sm text-gray-600">Interazioni Rapide</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raccomandazioni */}
                  {behaviorPatterns.recommendations && behaviorPatterns.recommendations.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Raccomandazioni</h3>
                      <div className="space-y-3">
                        {behaviorPatterns.recommendations.map((rec, index) => (
                          <div key={index} className={`p-4 rounded-lg border-l-4 ${
                            rec.priority === 'critical' ? 'bg-red-50 border-red-500' :
                            rec.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                            rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                            'bg-blue-50 border-blue-500'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                rec.priority === 'critical' ? 'bg-red-500' :
                                rec.priority === 'high' ? 'bg-orange-500' :
                                rec.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div>
                                <div className="font-medium text-gray-900 capitalize">{rec.type}</div>
                                <div className="text-sm text-gray-700 mt-1">{rec.message}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline Comportamentale */}
                  {behaviorPatterns.behavior_timeline && behaviorPatterns.behavior_timeline.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Comportamentale</h3>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {behaviorPatterns.behavior_timeline.map((event, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                              event.severity === 'high' ? 'bg-red-500' :
                              event.severity === 'medium' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {event.type} - {event.subtype}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {event.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nessuna analisi comportamentale disponibile
                </div>
              )}
            </div>
          )}

          {/* Metriche Performance */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E4E68] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Caricamento metriche performance...</p>
                </div>
              ) : performanceMetrics ? (
                <div className="space-y-6">
                  {/* Statistiche Generali Performance */}
                  {performanceMetrics.overall_stats && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche Performance</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#1E4E68]">{performanceMetrics.overall_stats.performance_score || 0}</div>
                          <div className="text-sm text-gray-600">Punteggio Performance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{performanceMetrics.overall_stats.total_errors || 0}</div>
                          <div className="text-sm text-gray-600">Errori Totali</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{Math.round((performanceMetrics.overall_stats.error_rate || 0) * 100)}%</div>
                          <div className="text-sm text-gray-600">Tasso di Errore</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#1E4E68]">{performanceMetrics.overall_stats.total_metrics || 0}</div>
                          <div className="text-sm text-gray-600">Metriche Raccolte</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analisi Errori */}
                  {performanceMetrics.error_analysis && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisi Errori</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Distribuzione Severità */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Distribuzione per Severità</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                              <span className="text-sm text-red-800">Alta</span>
                              <span className="font-medium text-red-600">{performanceMetrics.error_analysis.error_severity_distribution?.high || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                              <span className="text-sm text-yellow-800">Media</span>
                              <span className="font-medium text-yellow-600">{performanceMetrics.error_analysis.error_severity_distribution?.medium || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                              <span className="text-sm text-blue-800">Bassa</span>
                              <span className="font-medium text-blue-600">{performanceMetrics.error_analysis.error_severity_distribution?.low || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Errori Ricorrenti */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Errori Ricorrenti</h4>
                          <div className="space-y-2">
                            {performanceMetrics.error_analysis.recurring_errors?.slice(0, 5).map((error, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm text-gray-900">{error.type}</span>
                                <span className="font-medium text-gray-600">{error.count}x</span>
                              </div>
                            )) || <div className="text-sm text-gray-500">Nessun errore ricorrente</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raccomandazioni Performance */}
                  {performanceMetrics.recommendations && performanceMetrics.recommendations.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Raccomandazioni Performance</h3>
                      <div className="space-y-3">
                        {performanceMetrics.recommendations.map((rec, index) => (
                          <div key={index} className={`p-4 rounded-lg border-l-4 ${
                            rec.priority === 'critical' ? 'bg-red-50 border-red-500' :
                            rec.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                            rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                            'bg-blue-50 border-blue-500'
                          }`}>
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                rec.priority === 'critical' ? 'bg-red-500' :
                                rec.priority === 'high' ? 'bg-orange-500' :
                                rec.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div>
                                <div className="font-medium text-gray-900 capitalize">{rec.type}</div>
                                <div className="text-sm text-gray-700 mt-1">{rec.message}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informazioni Sistema */}
                  {performanceMetrics.system_info && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Sistema</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Browser:</span>
                            <span className="font-medium">{performanceMetrics.system_info.browser_name || 'N/A'} {performanceMetrics.system_info.browser_version || ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">OS:</span>
                            <span className="font-medium">{performanceMetrics.system_info.os_name || 'N/A'} {performanceMetrics.system_info.os_version || ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dispositivo:</span>
                            <span className="font-medium">{performanceMetrics.system_info.device_type || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risoluzione:</span>
                            <span className="font-medium">{performanceMetrics.system_info.screen_resolution || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Connessione:</span>
                            <span className="font-medium">{performanceMetrics.system_info.connection_type || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nessuna metrica di performance disponibile
                </div>
              )}
            </div>
          )}

          {/* Grafici Analytics */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <AnalyticsCharts 
                conversationId={conversationId}
                analytics={analytics}
                cardViews={cardViews}
                wordAnalysis={wordAnalysis}
                behaviorPatterns={behaviorPatterns}
                performanceMetrics={performanceMetrics}
              />
            </div>
          )}

          {/* Sistema Alert */}
          {activeTab === 'alert' && (
            <div className="space-y-6">
              <AlertingSystem 
                conversationId={conversationId}
                analytics={analytics}
                cardViews={cardViews}
                wordAnalysis={wordAnalysis}
                behaviorPatterns={behaviorPatterns}
                performanceMetrics={performanceMetrics}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}