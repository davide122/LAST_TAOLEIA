"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiMessageSquare, FiAlertCircle, FiInfo, FiRefreshCw, FiFilter } from 'react-icons/fi';

export default function ConversationDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const conversationId = unwrappedParams.id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState('messages');

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

  useEffect(() => {
    if (conversationId) {
    loadConversationDetails();
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
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 rounded-xl transition-all ${
                activeTab === 'messages'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Messaggi ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-6 py-3 rounded-xl transition-all ${
                activeTab === 'errors'
                  ? 'bg-[#FEF5E7] text-[#1E4E68]'
                  : 'bg-[#FEF5E7]/10 text-[#FEF5E7] hover:bg-[#FEF5E7]/20'
              }`}
            >
              Errori ({errors.length})
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
                        <div className="mt-4 pt-4 border-t border-[#FEF5E7]/10">
                          <pre className="text-sm text-[#FEF5E7]/60 overflow-x-auto">
                            {JSON.stringify(message.metadata, null, 2)}
                          </pre>
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
        </div>
      </div>
    </div>
  );
} 