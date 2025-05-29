import SpeechRecognition from './SpeechRecognition';

export default function ChatInput({
  input,
  setInput,
  loading,
  sendMessage,
  currentLanguage
}) {
  // Traduzioni per i placeholder e le etichette in base alla lingua
  const translations = {
    it: {
      placeholder: "Scrivi un messaggio…",
      sendLabel: "Invia messaggio",
      loadingLabel: "Caricamento in corso..."
    },
    en: {
      placeholder: "Type a message…",
      sendLabel: "Send message",
      loadingLabel: "Loading..."
    },
    fr: {
      placeholder: "Écrivez un message…",
      sendLabel: "Envoyer le message",
      loadingLabel: "Chargement..."
    },
    es: {
      placeholder: "Escribe un mensaje…",
      sendLabel: "Enviar mensaje",
      loadingLabel: "Cargando..."
    },
    de: {
      placeholder: "Schreibe eine Nachricht…",
      sendLabel: "Nachricht senden",
      loadingLabel: "Wird geladen..."
    }
  };
  
  // Ottieni le traduzioni corrette o usa l'italiano come fallback
  const t = translations[currentLanguage] || translations.it;
  
  return (
    <div className="input-container" role="form" aria-label={t.sendLabel}>
      <div className="flex space-x-2">
        <input
          type="text"
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder={t.placeholder}
          disabled={loading}
          aria-label={t.placeholder}
          aria-disabled={loading}
        />
        <SpeechRecognition
          currentLanguage={currentLanguage}
          onTranscriptChange={setInput}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className={`send-button ${loading || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
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