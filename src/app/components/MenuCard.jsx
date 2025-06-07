'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function MenuCard({ category, recommendations, timestamp, type, language_code }) {
  const [expanded, setExpanded] = useState(true);

  // Se non ci sono dati validi, non mostrare nulla
  if (!category || !recommendations || !Array.isArray(recommendations)) {
    return null;
  }

  // Traduzioni per le etichette dell'interfaccia
  const translations = {
    recommendations: {
      it: 'Raccomandazioni:',
      en: 'Recommendations:',
      fr: 'Recommandations:',
      es: 'Recomendaciones:',
      de: 'Empfehlungen:'
    },
    expand: {
      it: 'Espandi sezione',
      en: 'Expand section',
      fr: 'Développer la section',
      es: 'Expandir sección',
      de: 'Abschnitt erweitern'
    },
    collapse: {
      it: 'Comprimi sezione',
      en: 'Collapse section',
      fr: 'Réduire la section',
      es: 'Contraer sección',
      de: 'Abschnitt reduzieren'
    }
  };

  // Usa la lingua corrente o fallback a italiano
  const currentLang = language_code && translations.recommendations[language_code] ? language_code : 'it';

  const headingId = `category-heading-${category.replace(/\s+/g, '-').toLowerCase()}`;
  const contentId = `category-content-${category.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <div 
      className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden mb-4"
      role="region"
      aria-labelledby={headingId}
    >
      {/* Intestazione con categoria e pulsante di espansione */}
      <div 
        className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        tabIndex="0"
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <h3 className="text-lg font-semibold" id={headingId}>{category}</h3>
        <button 
          className="text-white"
          aria-label={expanded ? translations.collapse[currentLang] : translations.expand[currentLang]}
        >
          {expanded ? (
            <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Contenuto espandibile */}
      {expanded && (
        <div className="p-4" id={contentId}>
          <h4 className="text-md font-medium mb-2" id="recommendations-heading">{translations.recommendations[currentLang]}</h4>
          <ul 
            className="list-disc pl-5 space-y-1" 
            aria-labelledby="recommendations-heading"
            role="list"
          >
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-gray-700" role="listitem">{recommendation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}