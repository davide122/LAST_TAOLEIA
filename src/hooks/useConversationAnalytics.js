import { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Utility per rilevare informazioni del dispositivo
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return {};
  
  const userAgent = navigator.userAgent;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { viewport, isMobile, browser, os, userAgent };
};

// Utility per inviare dati analytics
const sendAnalytics = async (endpoint, data) => {
  try {
    const response = await fetch(`/api/analytics/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.warn(`Analytics ${endpoint} failed:`, response.status);
    }
    
    return response.ok;
  } catch (error) {
    console.warn(`Analytics ${endpoint} error:`, error);
    return false;
  }
};

export const useConversationAnalytics = (conversationId) => {
  const [sessionId] = useState(() => uuidv4());
  const [isTracking, setIsTracking] = useState(false);
  const [deviceInfo] = useState(() => getDeviceInfo());
  
  // Refs per tracking
  const sessionStartTime = useRef(null);
  const lastActivityTime = useRef(null);
  const inactivityTimer = useRef(null);
  const cardViewTimers = useRef(new Map());
  const scrollPosition = useRef({ x: 0, y: 0 });
  const interactionCounts = useRef({
    clicks: 0,
    scrolls: 0,
    cardViews: 0,
    audioPlays: 0,
    messages: 0,
    errors: 0
  });
  
  // Inizializza sessione
  const initializeSession = useCallback(async () => {
    if (!conversationId || isTracking) return;
    
    sessionStartTime.current = new Date();
    lastActivityTime.current = new Date();
    setIsTracking(true);
    
    // Crea sessione analytics
    await sendAnalytics('sessions', {
      sessionId,
      conversationId,
      startTime: sessionStartTime.current.toISOString(),
      deviceInfo,
      isActive: true
    });
    
  }, [conversationId, sessionId, deviceInfo, isTracking]);
  
  // Aggiorna attività utente
  const updateActivity = useCallback(() => {
    lastActivityTime.current = new Date();
    
    // Reset timer inattività
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    // Imposta nuovo timer per rilevare inattività (30 secondi)
    inactivityTimer.current = setTimeout(() => {
      trackUserBehavior('inactivity', {
        severity: 'medium',
        metadata: {
          inactivityDuration: 30000,
          lastScrollPosition: scrollPosition.current
        }
      });
    }, 30000);
    
  }, []);
  
  // Traccia interazione generica
  const trackInteraction = useCallback(async (interactionType, elementId, elementType, data = {}) => {
    if (!isTracking) return;
    
    updateActivity();
    
    const interactionData = {
      conversationId,
      sessionId,
      interactionType,
      elementId,
      elementType,
      timestamp: new Date().toISOString(),
      ...data,
      ...deviceInfo
    };
    
    await sendAnalytics('interactions', interactionData);
    
  }, [conversationId, sessionId, isTracking, deviceInfo, updateActivity]);
  
  // Traccia visualizzazione scheda attività
  const trackCardView = useCallback(async (cardId, cardTitle, cardType, viewType = 'view', data = {}) => {
    if (!isTracking) return;
    
    updateActivity();
    interactionCounts.current.cardViews++;
    
    // Gestisci timer per durata visualizzazione
    if (viewType === 'start') {
      cardViewTimers.current.set(cardId, Date.now());
    } else if (viewType === 'end' && cardViewTimers.current.has(cardId)) {
      const startTime = cardViewTimers.current.get(cardId);
      const duration = Date.now() - startTime;
      cardViewTimers.current.delete(cardId);
      
      data.viewDuration = duration;
    }
    
    const cardViewData = {
      conversationId,
      sessionId,
      cardId,
      cardTitle,
      cardType,
      viewType,
      ...data,
      ...deviceInfo
    };
    
    await sendAnalytics('card-views', cardViewData);
    
  }, [conversationId, sessionId, isTracking, deviceInfo, updateActivity]);
  
  // Traccia messaggio e analizza parole
  const trackMessage = useCallback(async (messageText, messageType = 'user') => {
    if (!isTracking || !messageText) return;
    
    updateActivity();
    interactionCounts.current.messages++;
    
    // Analizza parole del messaggio
    await sendAnalytics('word-analysis', {
      conversationId,
      sessionId,
      messageText,
      messageType,
      timestamp: new Date().toISOString()
    });
    
  }, [conversationId, sessionId, isTracking, updateActivity]);
  
  // Traccia comportamento utente (blocchi, confusione, etc.)
  const trackUserBehavior = useCallback(async (behaviorType, data = {}) => {
    if (!isTracking) return;
    
    const behaviorData = {
      conversationId,
      sessionId,
      behaviorType,
      timestamp: new Date().toISOString(),
      context: {
        interactionCounts: { ...interactionCounts.current },
        lastActivity: lastActivityTime.current?.toISOString(),
        sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current.getTime() : 0
      },
      ...data
    };
    
    await sendAnalytics('user-behavior', behaviorData);
    
  }, [conversationId, sessionId, isTracking]);
  
  // Traccia errore
  const trackError = useCallback(async (errorType, errorMessage, context = {}) => {
    if (!isTracking) return;
    
    interactionCounts.current.errors++;
    
    await trackUserBehavior('error', {
      severity: 'high',
      metadata: {
        errorType,
        errorMessage,
        context
      }
    });
    
  }, [isTracking, trackUserBehavior]);
  
  // Traccia riproduzione audio
  const trackAudioPlay = useCallback(async (audioId, action, data = {}) => {
    if (!isTracking) return;
    
    updateActivity();
    
    if (action === 'play') {
      interactionCounts.current.audioPlays++;
    }
    
    await trackInteraction('audio_' + action, audioId, 'audio_player', data);
    
  }, [isTracking, trackInteraction, updateActivity]);
  
  // Chiudi sessione
  const endSession = useCallback(async () => {
    if (!isTracking || !sessionStartTime.current) return;
    
    const endTime = new Date();
    const duration = endTime.getTime() - sessionStartTime.current.getTime();
    
    // Aggiorna sessione con dati finali
    await sendAnalytics('sessions', {
      sessionId,
      conversationId,
      endTime: endTime.toISOString(),
      duration,
      messageCount: interactionCounts.current.messages,
      errorCount: interactionCounts.current.errors,
      cardViewsCount: interactionCounts.current.cardViews,
      audioPlaysCount: interactionCounts.current.audioPlays,
      scrollEvents: interactionCounts.current.scrolls,
      clickEvents: interactionCounts.current.clicks,
      isActive: false
    });
    
    // Pulisci timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    cardViewTimers.current.clear();
    setIsTracking(false);
    
  }, [conversationId, sessionId, isTracking]);
  
  // Event listeners per tracking automatico
  useEffect(() => {
    if (!isTracking) return;
    
    // Traccia scroll
    const handleScroll = () => {
      scrollPosition.current = {
        x: window.scrollX,
        y: window.scrollY
      };
      interactionCounts.current.scrolls++;
      updateActivity();
    };
    
    // Traccia click
    const handleClick = (event) => {
      interactionCounts.current.clicks++;
      updateActivity();
      
      // Traccia click con coordinate
      trackInteraction('click', event.target.id || 'unknown', event.target.tagName.toLowerCase(), {
        coordinates: { x: event.clientX, y: event.clientY }
      });
    };
    
    // Traccia visibilità pagina
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackUserBehavior('page_hidden', { severity: 'low' });
      } else {
        updateActivity();
        trackUserBehavior('page_visible', { severity: 'low' });
      }
    };
    
    // Traccia chiusura finestra
    const handleBeforeUnload = () => {
      endSession();
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    
  }, [isTracking, trackInteraction, trackUserBehavior, updateActivity, endSession]);
  
  // Inizializza quando conversationId è disponibile
  useEffect(() => {
    if (conversationId && !isTracking) {
      initializeSession();
    }
    
    return () => {
      if (isTracking) {
        endSession();
      }
    };
  }, [conversationId, initializeSession, endSession, isTracking]);
  
  return {
    sessionId,
    isTracking,
    trackInteraction,
    trackCardView,
    trackMessage,
    trackUserBehavior,
    trackError,
    trackAudioPlay,
    endSession,
    interactionCounts: interactionCounts.current
  };
};

export default useConversationAnalytics;