"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiCalendar, FiClock, FiEdit2, FiTrash2, FiArrowLeft, FiLoader, FiAlertCircle, FiInfo, FiFilter } from 'react-icons/fi';

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDays, setFilterDays] = useState('all'); // 'all', 'short', 'medium', 'long'
  const router = useRouter();

  // Funzione per caricare gli itinerari
  const fetchItineraries = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/itineraries/list');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli itinerari');
      }
      
      const data = await response.json();
      setItineraries(data.itineraries || []);
    } catch (error) {
      console.error('Errore:', error);
      setError('Impossibile caricare gli itinerari. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []);

  // Filtra gli itinerari in base al termine di ricerca e ai giorni
  const filteredItineraries = itineraries.filter(itinerary => {
    const matchesSearch = 
      itinerary.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterDays === 'all') return matchesSearch;
    if (filterDays === 'short' && itinerary.days <= 3) return matchesSearch;
    if (filterDays === 'medium' && itinerary.days > 3 && itinerary.days <= 7) return matchesSearch;
    if (filterDays === 'long' && itinerary.days > 7) return matchesSearch;
    
    return matchesSearch;
  });

  // Funzione per eliminare un itinerario
  const deleteItinerary = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo itinerario?')) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/itineraries/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione');
      }
      
      setItineraries(itineraries.filter(item => item.id !== id));
      setSuccess('Itinerario eliminato con successo');
    } catch (error) {
      console.error('Errore:', error);
      setError('Impossibile eliminare l\'itinerario. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold mt-2">Gestione Itinerari</h1>
            </div>
            <Link 
              href="/backoffice/itineraries/create" 
              className="px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Nuovo Itinerario</span>
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

          {/* Filtri e ricerca */}
          <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-[#FEF5E7]/60" />
                </div>
                <input
                  type="text"
                  placeholder="Cerca itinerario..."
                  className="w-full pl-10 pr-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <FiFilter className="text-[#FEF5E7]/60" />
                <select
                  className="bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7]"
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value)}
                >
                  <option value="all">Tutti gli itinerari</option>
                  <option value="short">Brevi (1-3 giorni)</option>
                  <option value="medium">Medi (4-7 giorni)</option>
                  <option value="long">Lunghi (8+ giorni)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
              <p className="mt-4 text-[#FEF5E7]/80">Caricamento itinerari in corso...</p>
            </div>
          ) : filteredItineraries.length === 0 ? (
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-8 text-center">
              <FiCalendar className="w-12 h-12 mx-auto text-[#FEF5E7]/40" />
              <p className="mt-4 text-xl text-[#FEF5E7]/80">Nessun itinerario trovato</p>
              <p className="mt-2 text-[#FEF5E7]/60">Prova a modificare i filtri di ricerca</p>
              <Link 
                href="/backoffice/itineraries/create" 
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all"
              >
                <FiPlus className="w-5 h-5" />
                <span>Crea Itinerario</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItineraries.map((itinerary) => (
                <div key={itinerary.id} className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 hover:border-[#FEF5E7]/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-[#FEF5E7]">{itinerary.title}</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/backoffice/itineraries/edit/${itinerary.id}`)}
                        className="p-2 text-[#FEF5E7] hover:bg-[#FEF5E7]/10 rounded-xl transition"
                        title="Modifica itinerario"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteItinerary(itinerary.id)}
                        className="p-2 text-[#FEF5E7] hover:bg-red-500/20 rounded-xl transition"
                        title="Elimina itinerario"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[#FEF5E7]/70 mb-4 line-clamp-2">{itinerary.description}</p>
                  
                  <div className="flex items-center text-[#FEF5E7]/60 text-sm mb-4">
                    <FiCalendar className="w-4 h-4 mr-1" />
                    <span>{itinerary.days || 0} giorni</span>
                    <span className="mx-2">•</span>
                    <FiClock className="w-4 h-4 mr-1" />
                    <span>{itinerary.activities?.length || 0} attività</span>
                  </div>
                  
                  <Link 
                    href={`/backoffice/itineraries/edit/${itinerary.id}`}
                    className="block w-full text-center py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all"
                  >
                    Modifica Itinerario
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8">
            <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6">
              <h2 className="text-xl font-semibold mb-4">Informazioni</h2>
              <div className="space-y-4 text-[#FEF5E7]/80">
                <p>
                  Questa sezione mostra tutti gli itinerari disponibili. Puoi creare nuovi itinerari, modificare quelli esistenti o eliminarli.
                </p>
                <p>
                  Ogni itinerario può contenere diverse attività e può essere personalizzato in base alle esigenze dei viaggiatori.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}