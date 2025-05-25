"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiUserPlus, FiEdit2, FiTrash2, FiLoader, FiAlertCircle, FiInfo } from 'react-icons/fi';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carica gli utenti dal database
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/users/list');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Errore nel caricamento degli utenti');
        }
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Risposta non valida dal server');
        }
        setUsers(data.users);
      } catch (err) {
        console.error('Errore nel recupero degli utenti:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
              <h1 className="text-3xl font-bold mt-2">Gestione Utenti</h1>
            </div>
            <Link
              href="/backoffice/users/create"
              className="flex items-center gap-2 px-4 py-2 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all"
            >
              <FiUserPlus className="w-5 h-5" />
              <span>Nuovo Utente</span>
            </Link>
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

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
              <p className="mt-4 text-[#FEF5E7]/80">Caricamento utenti in corso...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-8 text-center">
              <FiUser className="w-12 h-12 mx-auto text-[#FEF5E7]/40" />
              <p className="mt-4 text-xl text-[#FEF5E7]/80">Nessun utente trovato</p>
              <p className="mt-2 text-[#FEF5E7]/60">Crea il tuo primo utente per iniziare</p>
            </div>
          ) : (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#FEF5E7]/10">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">ID</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Nome</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Email</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Data Registrazione</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-[#FEF5E7]/80">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FEF5E7]/10">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FEF5E7]/10 transition-colors">
                        <td className="py-4 px-6">{user.id}</td>
                        <td className="py-4 px-6">{user.name}</td>
                        <td className="py-4 px-6">{user.email}</td>
                        <td className="py-4 px-6">
                          {new Date(user.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/backoffice/users/edit/${user.id}`}
                              className="p-2 hover:bg-[#FEF5E7]/20 rounded-lg transition-colors"
                            >
                              <FiEdit2 className="w-5 h-5 text-[#FEF5E7]/80" />
                            </Link>
                            <button
                              onClick={() => {
                                // TODO: Implement delete functionality
                              }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <FiTrash2 className="w-5 h-5 text-red-400" />
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
                  Questa sezione mostra tutti gli utenti registrati nel sistema. Gli utenti possono accedere al backoffice solo se hanno i permessi di amministratore.
                </p>
                <p>
                  Per aggiungere un nuovo amministratore, è necessario registrare un nuovo utente e poi assegnargli i permessi di amministratore direttamente nel database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
