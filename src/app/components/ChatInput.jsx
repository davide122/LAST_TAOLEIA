import SpeechRecognition from './SpeechRecognition';

export default function ChatInput({
  input,
  setInput,
  loading,
  sendMessage,
  currentLanguage
}) {
  return (
    <div className="input-container">
      <div className="flex space-x-2">
        <input
          type="text"
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Scrivi un messaggio…"
          disabled={loading}
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
        >
          ➤
        </button>
      </div>
    </div>
  );
} 