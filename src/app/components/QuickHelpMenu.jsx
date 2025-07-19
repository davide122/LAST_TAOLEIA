import { useState } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function QuickHelpMenu({ currentLanguage, onSuggestionClick }) {
  const [isOpen, setIsOpen] = useState(false);

  // Traduzioni per le etichette e i suggerimenti
  const translations = {
    it: {
      helpButton: "Aiuto",
      title: "Come posso aiutarti?",
      suggestions: [
        "Cosa puoi fare?",
        "Raccontami di Taormina",
        "Consigli per ristoranti",
        "Attrazioni da visitare",
        "Eventi in città"
      ],
      close: "Chiudi"
    },
    en: {
      helpButton: "Help",
      title: "How can I help you?",
      suggestions: [
        "What can you do?",
        "Tell me about Taormina",
        "Restaurant recommendations",
        "Attractions to visit",
        "Events in the city"
      ],
      close: "Close"
    },
    fr: {
      helpButton: "Aide",
      title: "Comment puis-je vous aider?",
      suggestions: [
        "Que pouvez-vous faire?",
        "Parlez-moi de Taormina",
        "Recommandations de restaurants",
        "Attractions à visiter",
        "Événements dans la ville"
      ],
      close: "Fermer"
    },
    es: {
      helpButton: "Ayuda",
      title: "¿Cómo puedo ayudarte?",
      suggestions: [
        "¿Qué puedes hacer?",
        "Háblame de Taormina",
        "Recomendaciones de restaurantes",
        "Atracciones para visitar",
        "Eventos en la ciudad"
      ],
      close: "Cerrar"
    },
    de: {
      helpButton: "Hilfe",
      title: "Wie kann ich dir helfen?",
      suggestions: [
        "Was kannst du tun?",
        "Erzähl mir von Taormina",
        "Restaurantempfehlungen",
        "Sehenswürdigkeiten",
        "Veranstaltungen in der Stadt"
      ],
      close: "Schließen"
    }
  };

  // Usa la traduzione corretta o l'italiano come fallback
  const t = translations[currentLanguage] || translations.it;

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setIsOpen(false);
  };

  return (
    <div className="quick-help-container fixed bottom-24 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="help-button flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-xl transition-all transform hover:scale-105"
          aria-label={t.helpButton}
        >
          <QuestionMarkCircleIcon className="h-7 w-7" />
          <span className="ml-2 font-medium text-base">{t.helpButton}</span>
        </button>
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="help-menu bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-2 border-orange-300 backdrop-blur-lg bg-opacity-95 animate-fade-in-up">
            <div className="flex justify-between items-center mb-5 border-b border-orange-200 pb-3">
              <h3 className="font-bold text-gray-800 text-xl">{t.title}</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                aria-label={t.close}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
          </div>
          
          <ul className="space-y-3">
            {t.suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-4 rounded-lg hover:bg-orange-100 text-gray-700 transition-colors flex items-center border border-orange-100 hover:border-orange-300 hover:shadow-md"
                >
                  <span className="inline-block w-8 h-8 bg-orange-200 rounded-full text-orange-700 flex items-center justify-center mr-3 text-sm font-bold shadow-inner">{index + 1}</span>
                  <span className="font-medium">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
          </div>
        </div>
      )}
    </div>
  );
}