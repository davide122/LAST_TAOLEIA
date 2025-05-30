'use client';

import { useState, useEffect } from 'react';
import { FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';

/**
 * Componente per visualizzare e gestire le traduzioni delle categorie
 * 
 * @param {Object} props
 * @param {string} props.language - Codice lingua per le traduzioni (default: 'it')
 */
export default function CategoryTranslations({ language = 'it' }) {
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Lingue disponibili per la traduzione
  const availableLanguages = [
    { code: 'it', name: 'Italiano' },
    { code: 'en', name: 'Inglese' },
    { code: 'fr', name: 'Francese' },
    { code: 'es', name: 'Spagnolo' },
    { code: 'de', name: 'Tedesco' }
  ];

  // Carica le traduzioni delle categorie
  const fetchTranslations = async (lang = language) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/get-category-translations?language=${lang}`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle traduzioni');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTranslations(data.translations || {});
        setSuccess(true);
        // Nascondi il messaggio di successo dopo 3 secondi
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'API ha restituito un errore');
      }
    } catch (err) {
      console.error('Errore nel recupero delle traduzioni:', err);
      setError('Impossibile caricare le traduzioni. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Carica le traduzioni all'avvio del componente
  useEffect(() => {
    fetchTranslations();
  }, [language]);

  // Cambia la lingua delle traduzioni
  const changeLanguage = (lang) => {
    fetchTranslations(lang);
  };

  return (
    <div className="bg-[#FEF5E7]/5 backdrop-blur-sm rounded-xl border border-[#FEF5E7]/10 p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Traduzioni Categorie</h2>
      
      {/* Selezione lingua */}
      <div className="flex gap-2 mb-4">
        {availableLanguages.map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-3 py-1 rounded-lg transition-colors ${lang.code === language ? 'bg-[#FEF5E7] text-[#1E4E68]' : 'bg-[#FEF5E7]/10 hover:bg-[#FEF5E7]/20 text-[#FEF5E7]'}`}
          >
            {lang.name}
          </button>
        ))}
      </div>
      
      {/* Stato di caricamento */}
      {loading && (
        <div className="flex justify-center py-4">
          <FiLoader className="w-6 h-6 animate-spin text-[#FEF5E7]/60" />
        </div>
      )}
      
      {/* Messaggio di errore */}
      {error && (
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 p-4 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Messaggio di successo */}
      {success && (
        <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 p-4 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5" />
            <span>Traduzioni caricate con successo</span>
          </div>
        </div>
      )}
      
      {/* Lista delle traduzioni */}
      {!loading && !error && Object.keys(translations).length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-4 font-semibold pb-2 border-b border-[#FEF5E7]/20">
            <div>Categoria Originale</div>
            <div>Traduzione</div>
          </div>
          {Object.entries(translations).map(([category, translation]) => (
            <div key={category} className="grid grid-cols-2 gap-4 py-2 border-b border-[#FEF5E7]/10">
              <div>{category}</div>
              <div>{translation}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Nessuna traduzione */}
      {!loading && !error && Object.keys(translations).length === 0 && (
        <div className="text-center py-6 text-[#FEF5E7]/60">
          Nessuna traduzione disponibile per questa lingua
        </div>
      )}
    </div>
  );
}