import { useState, useCallback } from 'react';

export const useConversationLogger = () => {
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inizia una nuova conversazione
  const startConversation = useCallback(async (threadId, language = 'it') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          language,
          userAgent: navigator.userAgent,
          sessionId: sessionStorage.getItem('sessionId') || crypto.randomUUID(),
          deviceInfo: {
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            platform: navigator.platform,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setConversationId(data.conversationId);
      return data.conversationId;
    } catch (err) {
      setError(err.message);
      console.error('Errore nell\'avvio della conversazione:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registra un messaggio
  const logMessage = useCallback(async (role, content, metadata = {}) => {
    if (!conversationId) {
      console.warn('Nessuna conversazione attiva');
      return;
    }

    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          role,
          content,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.messageId;
    } catch (err) {
      console.error('Errore nel logging del messaggio:', err);
      return null;
    }
  }, [conversationId]);

  // Registra un errore
  const logError = useCallback(async (errorMessage, errorContext = {}) => {
    if (!conversationId) {
      console.warn('Nessuna conversazione attiva');
      return;
    }

    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          role: 'error',
          content: errorMessage,
          metadata: {
            ...errorContext,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.messageId;
    } catch (err) {
      console.error('Errore nel logging dell\'errore:', err);
      return null;
    }
  }, [conversationId]);

  // Recupera i messaggi di una conversazione
  const getMessages = useCallback(async (limit = 100, offset = 0, role = null) => {
    if (!conversationId) {
      console.warn('Nessuna conversazione attiva');
      return null;
    }

    try {
      const queryParams = new URLSearchParams({
        conversationId,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (role) {
        queryParams.append('role', role);
      }

      const response = await fetch(`/api/conversations/messages?${queryParams}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data;
    } catch (err) {
      console.error('Errore nel recupero dei messaggi:', err);
      return null;
    }
  }, [conversationId]);

  // Recupera gli errori di una conversazione
  const getErrors = useCallback(async (limit = 50, offset = 0) => {
    if (!conversationId) {
      console.warn('Nessuna conversazione attiva');
      return null;
    }

    try {
      const queryParams = new URLSearchParams({
        conversationId,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/conversations/errors?${queryParams}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data;
    } catch (err) {
      console.error('Errore nel recupero degli errori:', err);
      return null;
    }
  }, [conversationId]);

  return {
    conversationId,
    isLoading,
    error,
    startConversation,
    logMessage,
    logError,
    getMessages,
    getErrors,
  };
}; 