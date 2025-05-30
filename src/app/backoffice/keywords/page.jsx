"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiTrash2, FiSearch, FiFilter, FiSave, FiAlertCircle, FiCheck, FiGlobe } from 'react-icons/fi';
import TranslateKeywordsButton from '../../components/TranslateKeywordsButton';
import TranslateCategoriesButton from '../../components/TranslateCategoriesButton';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Stato per il form di aggiunta
  const [newKeywords, setNewKeywords] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Carica le parole chiave
  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/keywords');
      if (!res.ok) throw new Error('Errore nel caricamento delle parole chiave');

      const data = await res.json();

      if (data.success) {
        setKeywords(data.keywords || []);
      } else {
        throw new Error(data.error || 'API ha restituito un errore');
      }
    } catch (err) {
      console.error('Errore nel recupero delle parole chiave:', err);
      setError('Impossibile caricare le parole chiave. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  // Gestione dell'aggiunta di nuove parole chiave
  const handleAddKeywords = async (e) => {
    e.preventDefault();
    
    if (!newKeywords.trim() || !newCategory.trim()) {
      setError('Inserisci sia le parole chiave che la categoria');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Dividi le parole chiave per virgola e rimuovi spazi extra
      const keywordsList = newKeywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      if (keywordsList.length === 0) {
        setError('Inserisci almeno una parola chiave valida');
        return;
      }
      
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: keywordsList,
          category: newCategory.trim()
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Parole chiave aggiunte con successo');
        setNewKeywords('');
        fetchKeywords(); // Ricarica la lista
      } else {
        throw new Error(data.error || 'Errore durante il salvataggio');
      }
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
      setError('Errore durante il salvataggio delle parole chiave');
    } finally {
      setSaving(false);
    }
  };

  // Gestione dell'eliminazione di una parola chiave
  const handleDeleteKeyword = async (keyword, category) => {
    if (!confirm(`Sei sicuro di voler eliminare la parola chiave "${keyword}"?`)) return;
    
    try {
      setError('');
      setSuccess('');
      
      const res = await fetch(`/api/keywords?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category)}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Parola chiave eliminata con successo');
        fetchKeywords(); // Ricarica la lista
      } else {
        throw new Error(data.error || 'Errore durante l\'eliminazione');
      }
    } catch (err) {
      console.error('Errore durante l\'eliminazione:', err);
      setError('Errore durante l\'eliminazione della parola chiave');
    }
  };

  // Filtra le parole chiave
  const filteredKeywords = keywords.filter(item => {
    const matchesSearch = 
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Estrai le categorie uniche
  const categories = ['all', ...new Set(keywords.map(item => item.category))];

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
              <h1 className="text-3xl font-bold mt-2">Gestione Parole Chiave</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/backoffice/translations" 
                className="flex items-center gap-2 px-3 py-2 bg-[#FEF5E7]/10 rounded-lg hover:bg-[#FEF5E7]/20 transition-colors"
              >
                <FiGlobe className="h-4 w-4" />
                <span>Visualizza Traduzioni</span>
              </Link>
              <TranslateCategoriesButton />
            </div>
          </div>

          {/* Form per aggiungere nuove parole chiave */}
          <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Aggiungi Nuove Parole Chiave</h2>
            
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
                  <FiCheck className="w-5 h-5" />
                  <span>{success}</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleAddKeywords} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="newCategory" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Categoria *
                  </label>
                  <input
                    id="newCategory"
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Inserisci la categoria"
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="newKeywords" className="block text-sm font-medium text-[#FEF5E7]/80">
                    Parole Chiave *
                  </label>
                  <input
                    id="newKeywords"
                    type="text"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="Inserisci parole chiave separate da virgole"
                    className="w-full px-4 py-3 bg-[#FEF5E7]/10 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/20 focus:outline-none focus:ring-2 focus:ring-[#FEF5E7]/30 text-[#FEF5E7] placeholder-[#FEF5E7]/40"
                    required
                  />
                  <p className="text-sm text-[#FEF5E7]/60">
                    Separa le parole chiave con virgole (es: pizza, pasta, mare)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#FEF5E7] text-[#1E4E68] rounded-xl hover:bg-[#FEF5E7]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1E4E68] border-t-transparent"></div>
                      <span>Salvataggio...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      <span>Salva</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Filtri */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#FEF5E7]/60" />
              <input
                type="text"
                placeholder="Cerca parole chiave..."
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

          {/* Lista delle parole chiave */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FEF5E7] border-t-transparent"></div>
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="text-center py-12 bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10">
              <p className="text-xl text-[#FEF5E7]/60 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Nessuna parola chiave trovata con i filtri applicati' 
                  : 'Nessuna parola chiave presente. Aggiungine una!'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredKeywords.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{item.category}</h3>
                    <TranslateKeywordsButton category={item.category} />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {item.keywords.map((keyword, kidx) => (
                      <div 
                        key={kidx}
                        className="flex items-center gap-2 px-3 py-2 bg-[#FEF5E7]/10 rounded-lg"
                      >
                        <span>{keyword}</span>
                        <button
                          onClick={() => handleDeleteKeyword(keyword, item.category)}
                          className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                          title="Elimina"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-300" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}