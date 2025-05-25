"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiSearch, FiFilter, FiGlobe } from 'react-icons/fi';
import TranslateButton from '../../components/TranslateButton';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/activities/list');
        if (!res.ok) throw new Error('Errore nel caricamento delle attività');

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || 'API returned success: false');
        }

        setActivities(data.activities || []);
      } catch (err) {
        console.error('Errore nel recupero delle attività:', err);
        setError('Impossibile caricare le attività. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore nell\'eliminazione');
      setActivities((a) => a.filter((x) => x.id !== id));
    } catch (err) {
      console.error('Errore nell\'eliminazione:', err);
      setError('Impossibile eliminare l\'attività. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(activities.map(a => a.category).filter(Boolean))];

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
                <span>Indietro</span>
              </Link>
              <h1 className="text-3xl font-bold mt-2">Gestione Attività</h1>
            </div>
            <Link 
              href="/backoffice/activities/new"
              className="flex items-center gap-2 px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all"
            >
              <FiPlus className="w-5 h-5" />
              <span>Nuova Attività</span>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#FEF5E7]/60" />
              <input
                type="text"
                placeholder="Cerca attività..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#FEF5E7]/60" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-12 pr-10 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Tutte le categorie' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10">
              <p className="text-xl text-[#FEF5E7]/60 mb-4">Nessuna attività trovata</p>
              <Link 
                href="/backoffice/activities/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all"
              >
                <FiPlus className="w-5 h-5" />
                <span>Aggiungi la prima attività</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10">
                <thead>
                  <tr className="border-b border-[#FEF5E7]/10">
                    <th className="py-4 px-6 text-left font-medium text-[#FEF5E7]/60">Nome</th>
                    <th className="py-4 px-6 text-left font-medium text-[#FEF5E7]/60">Categoria</th>
                    <th className="py-4 px-6 text-left font-medium text-[#FEF5E7]/60">Indirizzo</th>
                    <th className="py-4 px-6 text-left font-medium text-[#FEF5E7]/60">Email</th>
                    <th className="py-4 px-6 text-left font-medium text-[#FEF5E7]/60">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FEF5E7]/10">
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-[#FEF5E7]/5 transition-colors">
                      <td className="py-4 px-6">{activity.name}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-[#FEF5E7]/10 rounded-full text-sm">
                          {activity.category || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">{activity.address || '-'}</td>
                      <td className="py-4 px-6">{activity.email || '-'}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <Link 
                            href={`/backoffice/activities/edit/${activity.id}`}
                            className="p-2 bg-[#FEF5E7]/10 hover:bg-[#FEF5E7]/20 rounded-lg transition-colors"
                            title="Modifica"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                            title="Elimina"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                          <div className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors" title="Traduci">
                            <TranslateButton activity={{...activity}} compact={true} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
