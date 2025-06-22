import { useRef, useEffect } from 'react';
import ActivityCard from './ActivityCard';
import MenuCard from './MenuCard';
import ClickableCategory from './ClickableCategory';
import LoadingIndicator from './LoadingIndicator';

export default function ChatMessages({ 
  messages, 
  onCategoryClick,
  UI_THROTTLE_MS = 50,
  lastUiUpdateRef,
  loading
}) {
  const endRef = useRef(null);

  // Auto-scroll effect
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Determina se mostrare i pallini di caricamento globali
  const showLoadingDots = loading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant';

  // Ottieni la lingua preferita dal localStorage
  const getPreferredLanguage = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedLanguage') || localStorage.getItem('preferredLanguage') || 'it';
    }
    return 'it';
  };

  // Funzione per renderizzare il contenuto del tool in base al tipo
  const renderToolContent = (data) => {
    const currentLang = getPreferredLanguage();
    if (data.type === 'menu') {
      return <MenuCard {...data} language_code={currentLang} onCategoryClick={onCategoryClick} />;
    }
    return <ActivityCard {...data} language_code={currentLang} onCategoryClick={onCategoryClick} />;
  };

  // Filtra i messaggi per nascondere il primo messaggio dell'utente (istruzioni)
  const visibleMessages = messages.length > 0 ? messages.slice(1) : [];

  return (
    <div className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-3" role="list" aria-live="polite">
      {visibleMessages.map((m, i) => (
        <div
          key={i}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          role="listitem"
        >
          {m.role === 'tool' ? (
            renderToolContent(m.data)
          ) : m.role === 'offline' ? (
            <div className="message-assistant offline-message break-words" aria-live="polite">
              <span aria-label="Messaggio offline">{m.content}</span>
            </div>
          ) : (
            <div className={
              m.role === 'user'
                ? 'message-user break-words'
                : 'message-assistant break-words'
            }>
              {m.role === 'assistant' ? (
                m.isLoading ? (
                  <LoadingIndicator type="dots" size="medium" />
                ) : (
                  <ClickableCategory 
                    key={`message-${i}-${Date.now()}`} 
                    onCategoryClick={onCategoryClick}
                  >
                    {m.content}
                  </ClickableCategory>
                )
              ) : m.content}
            </div>
          )}
        </div>
      ))}
      {showLoadingDots && (
        <div className="flex justify-start" role="status" aria-live="polite">
          <div className="message-assistant break-words">
            <LoadingIndicator type="dots" size="medium" />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}