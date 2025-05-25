'use client';

import { useState } from 'react';
import { FiGlobe, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';

/**
 * Componente pulsante per tradurre automaticamente i contenuti di un'attività
 * in diverse lingue utilizzando l'API OpenAI.
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Object} props.activity - Dati dell'attività da tradurre
 */
export default function TranslateButton({ activity, compact = false }) {
  // Stati per gestire il processo di traduzione
  const [isTranslating, setIsTranslating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Lingue disponibili per la traduzione
  const availableLanguages = [
    { code: 'it', name: 'Italiano' },
    { code: 'en', name: 'Inglese' },
    { code: 'fr', name: 'Francese' },
    { code: 'es', name: 'Spagnolo' },
    { code: 'de', name: 'Tedesco' }
  ];

  // Funzione per avviare la traduzione in tutte le lingue
  const translateAll = async () => {
    await handleTranslate();
  };

  // Funzione per avviare la traduzione in una lingua specifica
  const translateToLanguage = async (languageCode) => {
    await handleTranslate([languageCode]);
    setShowDropdown(false);
  };

  // Funzione principale per gestire la traduzione
  const handleTranslate = async (targetLanguages = null) => {
    if (!activity || !activity.id) {
      setError('Dati dell\'attività mancanti');
      return;
    }

    setIsTranslating(true);
    setSuccess(false);
    setError('');

    try {
      const response = await fetch('/api/activities/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activity_id: activity.id,
          target_languages: targetLanguages // Se null, tradurrà in tutte le lingue supportate
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Nascondi il messaggio di successo dopo 3 secondi
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || 'Errore durante la traduzione');
      }
    } catch (error) {
      console.error('Errore durante la traduzione:', error);
      setError('Errore di connessione al server');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="relative">
      {/* Pulsante principale */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isTranslating}
          className={`flex items-center ${compact ? '' : 'gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isTranslating ? (
            <FiLoader className="w-5 h-5 animate-spin" />
          ) : (
            <FiGlobe className="w-5 h-5" />
          )}
          {!compact && <span>Traduci</span>}
        </button>

        {/* Indicatori di stato */}
        {success && !compact && (
          <span className="flex items-center gap-1 text-green-400">
            <FiCheck className="w-5 h-5" />
            <span>Traduzione completata</span>
          </span>
        )}

        {error && !compact && (
          <span className="flex items-center gap-1 text-red-400">
            <FiAlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </span>
        )}
      </div>

      {/* Dropdown per selezione lingua */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={translateAll}
              disabled={isTranslating}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors"
            >
              Traduci in tutte le lingue
            </button>
          </div>
          <div className="p-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => translateToLanguage(lang.code)}
                disabled={isTranslating}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors"
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}