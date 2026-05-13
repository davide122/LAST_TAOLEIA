import SpeechRecognition from './SpeechRecognition';

export default function ChatInput({
  input,
  setInput,
  loading,
  sendMessage,
  currentLanguage,
  isOffline,
  onMenuClick
}) {
  // Traduzioni per i placeholder e le etichette in base alla lingua
  const translations = {
    it: {
      placeholder: "Scrivi un messaggio…",
      sendLabel: "Invia messaggio",
      loadingLabel: "Caricamento in corso...",
      menuLabel: "Menu categorie"
    },
    en: {
      placeholder: "Type a message…",
      sendLabel: "Send message",
      loadingLabel: "Loading...",
      menuLabel: "Category menu"
    },
    fr: {
      placeholder: "Écrivez un message…",
      sendLabel: "Envoyer le message",
      loadingLabel: "Chargement...",
      menuLabel: "Menu catégories"
    },
    es: {
      placeholder: "Escribe un mensaje…",
      sendLabel: "Enviar mensaje",
      loadingLabel: "Cargando...",
      menuLabel: "Menú categorías"
    },
    de: {
      placeholder: "Schreibe eine Nachricht…",
      sendLabel: "Nachricht senden",
      loadingLabel: "Wird geladen...",
      menuLabel: "Kategoriemenü"
    }
  };
  
  // Ottieni le traduzioni corrette o usa l'italiano come fallback
  const t = translations[currentLanguage] || translations.it;
  
  return (
    <div className="input-container" role="form" aria-label={t.sendLabel}>
      <div className="flex items-center space-x-2">
        <button
          onClick={onMenuClick}
          className="p-2 text-[#E3742E] hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
          aria-label={t.menuLabel}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
        <input
          type="text"
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder={t.placeholder}
          disabled={loading || isOffline}
          aria-label={t.placeholder}
          aria-disabled={loading || isOffline}
        />
        <SpeechRecognition
          currentLanguage={currentLanguage}
          onTranscriptChange={setInput}
          disabled={loading || isOffline}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim() || isOffline}
          className={`send-button ${loading || !input.trim() || isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={t.sendLabel}
          aria-busy={loading}
        >
          <span aria-hidden="true">➤</span>
          <span className="sr-only">{t.sendLabel}</span>
        </button>
      </div>
      {loading && (
        <div className="sr-only" aria-live="polite">
          {t.loadingLabel}
        </div>
      )}
    </div>
  );
}