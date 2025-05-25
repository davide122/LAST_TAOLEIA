"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiSearch, FiFilter, FiRefreshCw, FiMessageSquare, FiAlertCircle, FiInfo } from 'react-icons/fi';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Carica le conversazioni
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/conversations');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setConversations(data.conversations);
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento delle conversazioni:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Filtra le conversazioni
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = 
      conversation.thread_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.language.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = filterLanguage === 'all' || conversation.language === filterLanguage;
    const matchesStatus = filterStatus === 'all' || conversation.status === filterStatus;
    return matchesSearch && matchesLanguage && matchesStatus;
  });

  // Estrai le lingue uniche
  const languages = ['all', ...new Set(conversations.map(c => c.language))];
  const statuses = ['all', 'active', 'completed', 'error'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7]">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <Link 
                href="/backoffice" 
                className="flex items-center gap-2 text-[#FEF5E7]/80 hover:text-[#FEF5E7] transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Torna al backoffice</span>
              </Link>
              <h1 className="text-3xl font-bold mt-2">Gestione Conversazioni</h1>
            </div>
            <button
              onClick={loadConversations}
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

          {/* Filtri e ricerca */}
          <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-[#FEF5E7]/60" />
                </div>
                <input
                  type="text"
                  placeholder="Cerca conversazione..."
                  className="w-full pl-10 pr-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <FiFilter className="text-[#FEF5E7]/60" />
                <select
                  className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'all' ? 'Tutte le lingue' : lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <FiFilter className="text-[#FEF5E7]/60" />
                <select
                  className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'Tutti gli stati' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
              <p className="mt-4 text-[#FEF5E7]/80">Caricamento conversazioni in corso...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-8 text-center">
              <FiMessageSquare className="w-12 h-12 mx-auto text-[#FEF5E7]/40" />
              <p className="mt-4 text-xl text-[#FEF5E7]/80">Nessuna conversazione trovata</p>
              <p className="mt-2 text-[#FEF5E7]/60">Prova a modificare i filtri di ricerca</p>
            </div>
          ) : (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#FEF5E7]/10">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">ID</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Thread ID</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Lingua</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Stato</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Inizio</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Fine</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Messaggi</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Errori</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FEF5E7]/10">
                    {filteredConversations.map((conversation) => (
                      <tr key={conversation.id} className="hover:bg-[#FEF5E7]/5">
                        <td className="py-4 px-6 text-[#FEF5E7]/80">{conversation.id}</td>
                        <td className="py-4 px-6 text-[#FEF5E7]/80">{conversation.thread_id}</td>
                        <td className="py-4 px-6 text-[#FEF5E7]/80">{conversation.language.toUpperCase()}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            conversation.status === 'active' ? 'bg-green-500/20 text-green-200' :
                            conversation.status === 'completed' ? 'bg-blue-500/20 text-blue-200' :
                            'bg-red-500/20 text-red-200'
                          }`}>
                            {conversation.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#FEF5E7]/80">
                          {new Date(conversation.start_time).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-[#FEF5E7]/80">
                          {conversation.end_time ? new Date(conversation.end_time).toLocaleString() : '-'}
                        </td>
                        <td className="py-4 px-6 text-[#FEF5E7]/80">{conversation.message_count}</td>
                        <td className="py-4 px-6 text-[#FEF5E7]/80">{conversation.error_count}</td>
                        <td className="py-4 px-6">
                          <Link
                            href={`/backoffice/conversations/${conversation.id}`}
                            className="text-[#FEF5E7] hover:text-[#FEF5E7]/80 transition-colors"
                          >
                            Dettagli
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8">
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
              <h2 className="text-xl font-semibold mb-4">Informazioni</h2>
              <div className="space-y-4 text-[#FEF5E7]/80">
                <p>
                  Questa sezione mostra tutte le conversazioni registrate nel sistema. Puoi filtrare le conversazioni per lingua e stato, e cercare per thread ID.
                </p>
                <p>
                  Ogni conversazione contiene un log completo dei messaggi scambiati e degli eventuali errori riscontrati.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 