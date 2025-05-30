'use client';

import { useState } from 'react';
import { FiGlobe, FiLoader, FiCheck } from 'react-icons/fi';

// Lingue supportate per la traduzione
const supportedLanguages = [
  { code: 'it', name: 'Italiano' },
  { code: 'en', name: 'Inglese' },
  { code: 'fr', name: 'Francese' },
  { code: 'es', name: 'Spagnolo' },
  { code: 'de', name: 'Tedesco' },
];

/**
 * Componente per tradurre automaticamente le categorie in tutte le lingue supportate
 * 
 * @param {Object} props
 * @param {boolean} [props.compact=false] - Se true, mostra solo l'icona senza testo
 */
export default function TranslateCategoriesButton({ compact = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Funzione per tradurre in tutte le lingue
  const translateCategories = async () => {
    setIsLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await fetch('/api/categories/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Nessun parametro specifico, tradurrà in tutte le lingue supportate
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Errore durante la traduzione');
      }
      
      setSuccess(true);
      alert('Categorie tradotte con successo in tutte le lingue');
    } catch (err) {
      setError(err.message);
      alert(`Errore: ${err.message}`);
    } finally {
      setIsLoading(false);
      
      // Reset dello stato di successo dopo 3 secondi
      if (success) {
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };
  
  return (
    <button 
      onClick={translateCategories}
      className={`flex items-center gap-2 px-3 py-2 bg-[#FEF5E7]/10 rounded-lg hover:bg-[#FEF5E7]/20 transition-colors ${compact ? "h-8 w-8 p-0 flex items-center justify-center" : ""}`}
      disabled={isLoading}
    >
      {isLoading ? (
        <FiLoader className="h-4 w-4 animate-spin" />
      ) : success ? (
        <FiCheck className="h-4 w-4 text-green-500" />
      ) : (
        <>
          <FiGlobe className="h-4 w-4" />
          {!compact && "Traduci Categorie"}
        </>
      )}
    </button>
  );
}