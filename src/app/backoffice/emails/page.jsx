"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMail, FiRefreshCw, FiSearch, FiFilter, FiCheck, FiX, FiArrowLeft, FiLoader, FiAlertCircle, FiInfo } from 'react-icons/fi';

export default function EmailsPage() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('all'); // 'all', 'verified', 'unverified'

  // Carica le email dal database
  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/emails/list');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle email');
      }
      
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Errore nel recupero delle email:', error);
      setError('Impossibile caricare le email. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Filtra le email in base alla ricerca e allo stato di verifica
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterVerified === 'all') return matchesSearch;
    if (filterVerified === 'verified') return matchesSearch && email.is_verified;
    if (filterVerified === 'unverified') return matchesSearch && !email.is_verified;
    
    return matchesSearch;
  });

  // Invia email di verifica
  const sendVerificationEmail = async (emailAddress) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/emails/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailAddress }),
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'invio dell\'email di verifica');
      }
      
      setSuccess(`Email di verifica inviata a ${emailAddress}`);
      fetchEmails(); // Aggiorna la lista
    } catch (error) {
      console.error('Errore:', error);
      setError('Impossibile inviare l\'email di verifica. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Elimina un'email
  const deleteEmail = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa email?')) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione dell\'email');
      }
      
      // Rimuovi l'email dalla lista locale
      setEmails(emails.filter(email => email.id !== id));
      setSuccess('Email eliminata con successo');
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      setError('Impossibile eliminare l\'email. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#082c33] to-[#1E4E68] text-[#FEF5E7]">
      <div className=" p-8">
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
              <h1 className="text-3xl font-bold mt-2">Gestione Email</h1>
            </div>
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
                  placeholder="Cerca per email..."
                  className="w-full pl-10 pr-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <FiFilter className="text-[#FEF5E7]/60" />
                <select
                  className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
                  value={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.value)}
                >
                  <option value="all">Tutte le email</option>
                  <option value="verified">Verificate</option>
                  <option value="unverified">Non verificate</option>
                </select>
              </div>
              
              <button
                onClick={fetchEmails}
                className="flex items-center justify-center px-4 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <FiRefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span>Aggiorna</span>
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
              <p className="mt-4 text-[#FEF5E7]/80">Caricamento email in corso...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-8 text-center">
              <FiMail className="w-12 h-12 mx-auto text-[#FEF5E7]/40" />
              <p className="mt-4 text-xl text-[#FEF5E7]/80">Nessuna email trovata</p>
              <p className="mt-2 text-[#FEF5E7]/60">Prova a modificare i filtri di ricerca</p>
            </div>
          ) : (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#FEF5E7]/10">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">ID</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Email</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Domande Rimaste</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Data Registrazione</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Verificata</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Lingua</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FEF5E7]/10">
                    {filteredEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-[#FEF5E7]/10 transition-colors">
                        <td className="py-4 px-6">{email.id}</td>
                        <td className="py-4 px-6">{email.email}</td>
                        <td className="py-4 px-6">{email.questions_left}</td>
                        <td className="py-4 px-6">{new Date(email.created_at).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          {email.is_verified ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-200">
                              <FiCheck className="w-4 h-4 mr-1" />
                              Verificata
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-200">
                              <FiX className="w-4 h-4 mr-1" />
                              Non verificata
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">{email.language || 'Non specificata'}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {!email.is_verified && (
                              <button
                                onClick={() => sendVerificationEmail(email.email)}
                                className="px-3 py-1 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all text-sm"
                                title="Invia email di verifica"
                              >
                                Verifica
                              </button>
                            )}
                            <button
                              onClick={() => deleteEmail(email.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-200 rounded-xl hover:bg-red-500/30 transition-all text-sm"
                              title="Elimina email"
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8">
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
              <h2 className="text-xl font-semibold mb-4">Informazioni</h2>
              <div className="space-y-4 text-[#FEF5E7]/80">
                <p>
                  Questa sezione mostra tutte le email registrate nel sistema. Le email verificate possono ricevere newsletter e aggiornamenti.
                </p>
                <p>
                  Per inviare una newsletter a tutte le email verificate, utilizza la funzione di invio newsletter nella dashboard principale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}