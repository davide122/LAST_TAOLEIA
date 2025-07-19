import { useState, useEffect } from 'react';

export default function ChatSuggestions({ currentLanguage, onSuggestionClick, messages }) {
  // Stato per tracciare se i suggerimenti sono stati già utilizzati
  const [suggestionsUsed, setSuggestionsUsed] = useState(false);

  // Resetta i suggerimenti quando la chat è vuota
  useEffect(() => {
    if (messages.length <= 1) { // Solo il messaggio di sistema o nessun messaggio
      setSuggestionsUsed(false);
    }
  }, [messages]);

  // Traduzioni per i suggerimenti in base alla lingua
  const suggestionsByLanguage = {
    it: [
      { text: "Cosa posso visitare a Taormina?", icon: "🏛️" },
      { text: "Dove posso mangiare?", icon: "🍽️" },
      { text: "Raccontami la storia di Taormina", icon: "📚" },
      { text: "Eventi di oggi", icon: "🎭" }
    ],
    en: [
      { text: "What can I visit in Taormina?", icon: "🏛️" },
      { text: "Where can I eat?", icon: "🍽️" },
      { text: "Tell me about Taormina's history", icon: "📚" },
      { text: "Today's events", icon: "🎭" }
    ],
    fr: [
      { text: "Que puis-je visiter à Taormina?", icon: "🏛️" },
      { text: "Où puis-je manger?", icon: "🍽️" },
      { text: "Racontez-moi l'histoire de Taormina", icon: "📚" },
      { text: "Événements d'aujourd'hui", icon: "🎭" }
    ],
    es: [
      { text: "¿Qué puedo visitar en Taormina?", icon: "🏛️" },
      { text: "¿Dónde puedo comer?", icon: "🍽️" },
      { text: "Cuéntame la historia de Taormina", icon: "📚" },
      { text: "Eventos de hoy", icon: "🎭" }
    ],
    de: [
      { text: "Was kann ich in Taormina besichtigen?", icon: "🏛️" },
      { text: "Wo kann ich essen?", icon: "🍽️" },
      { text: "Erzähl mir die Geschichte von Taormina", icon: "📚" },
      { text: "Heutige Veranstaltungen", icon: "🎭" }
    ]
  };

  // Usa i suggerimenti nella lingua corrente o in italiano come fallback
  const suggestions = suggestionsByLanguage[currentLanguage] || suggestionsByLanguage.it;

  // Se i suggerimenti sono già stati utilizzati o ci sono più messaggi, non mostrare nulla
  if (suggestionsUsed || messages.length > 2) {
    return null;
  }

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion.text);
    setSuggestionsUsed(true);
  };

  return (
    <div className="chat-suggestions mt-3 mb-1">
      <div className="flex flex-wrap gap-1 justify-center">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="suggestion-chip flex items-center bg-white hover:bg-orange-50 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 shadow-sm transition-colors"
          >
            <span className="mr-1">{suggestion.icon}</span>
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
}