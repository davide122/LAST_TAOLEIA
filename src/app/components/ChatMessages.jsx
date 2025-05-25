import { useRef, useEffect } from 'react';
import ActivityCard from './ActivityCard';
import ClickableCategory from './ClickableCategory';
import LoadingDots from './LoadingDots';

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

  // Determina se mostrare i pallini di caricamento
  const showLoadingDots = loading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant';

  return (
    <div className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {m.role === 'tool' ? (
            <ActivityCard {...m.data} />
          ) : (
            <div className={
              m.role === 'user'
                ? 'message-user break-words'
                : 'message-assistant break-words'
            }>
              {m.role === 'assistant' ? (
                <ClickableCategory onCategoryClick={onCategoryClick}>
                  {m.content}
                </ClickableCategory>
              ) : m.content}
            </div>
          )}
        </div>
      ))}
      {showLoadingDots && (
        <div className="flex justify-start">
          <div className="message-assistant break-words">
            <LoadingDots />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
} 