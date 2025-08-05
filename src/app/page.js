'use client';

import { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, MapPinIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import VideoPlayer from './components/VideoPlayer';
import ActivityCard from './components/ActivityCard';
import LanguageDropdown from './components/LanguageDropdown';
import ClickableCategory from './components/ClickableCategory';
import SpeechRecognition from './components/SpeechRecognition';
import { speechLanguages } from './config/languages';
import { welcomeMessages } from './config/welcomeMessages';
import '../chat.css';
import './taoleia-style.css';
import './central-audio-player.css';
import './audio-toggle.css';
import './components/InstallPWA.css';
import MapView from './components/MapView';
import NewsletterForm from './components/newsletter/NewsletterForm';
// Rimosso import useAudioPlayer poiché utilizziamo solo useAudioManager
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import LanguageSelector from './components/languageselector.jsx';
import { useConversationLogger } from '../hooks/useConversationLogger';
import { useAudioManager } from './hooks/useAudioManager';
import CentralAudioPlayer from './components/CentralAudioPlayer';
import AudioToggle from './components/AudioToggle';
import AccessibilityMenu from './components/AccessibilityMenu';
import LoadingIndicator from './components/LoadingIndicator';
import InstallPWA from './components/InstallPWA';
import { useOfflineData } from '../hooks/useOfflineData';
import LanguageModal from './components/LanguageModal';
// Nuovi componenti per migliorare l'UX
import CategoryMenu from './components/CategoryMenu';
import WelcomeGuide from './components/WelcomeGuide';
import FeatureIntroduction from './components/FeatureIntroduction';

export default function TaoleiaChat() {
  // --- STATE & REF ---
  const [activeTab, setActiveTab]   = useState('chat');
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [threadId, setThreadId]     = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('it');
  const [mapKey, setMapKey] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  // Stati per i nuovi componenti UX
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  // Verifica se l'utente ha già selezionato una lingua in precedenza
  const [languageSelected, setLanguageSelected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedLanguage') !== null;
    }
    return false;
  }); 
  // Mostra il modale solo se non c'è una lingua selezionata
  const [showLanguageModal, setShowLanguageModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedLanguage') === null;
    }
    return true;
  });

  const [isListeningChat, setIsListeningChat] = useState(false);
  const chatRecRef = useRef(null);
  const UI_THROTTLE_MS = 100;
  const lastUiUpdateRef = useRef(0);

  // Rimossi riferimenti a useAudioPlayer

  const endRef             = useRef(null);

  const [videoTtsText, setVideoTtsText] = useState('');

  const welcomeMessageSentRef = useRef(false);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // Inizializza il logger delle conversazioni
  const { 
    conversationId, 
    startConversation, 
    logMessage, 
    logError 
  } = useConversationLogger();

  const { playAudio, isPlaying, togglePlayPause, stopCurrentAudio, audioElementRef: audioManagerRef, isAudioEnabled, toggleAudioEnabled } = useAudioManager();
  
  // Inizializza l'hook per i dati offline
  const { 
    saveMessageToQueue, 
    getMessagesQueue, 
    saveActivity, 
    getActivity 
  } = useOfflineData();

  // --- EFFECT: Inizia una nuova conversazione quando viene creato un nuovo thread ---
  useEffect(() => {
    if (threadId && !conversationId) {
      startConversation(threadId, currentLanguage);
    }
  }, [threadId, conversationId, currentLanguage, startConversation]);

  // --- EFFECT: auto-scroll chat ---
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // --- EFFECT: ferma l'audio quando si cambia scheda ---
  useEffect(() => {
    // Ferma l'audio quando l'utente cambia scheda
    if (activeTab !== 'chat' && isPlaying) {
      stopCurrentAudio();
      console.log('Audio fermato dopo cambio scheda');
    }
  }, [activeTab, isPlaying, stopCurrentAudio]);

  // --- EFFECT: Registrazione del service worker ---
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !serviceWorkerRegistered) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registrato con successo:', registration);
          setServiceWorkerRegistered(true);
        })
        .catch((error) => {
          console.error('Errore durante la registrazione del Service Worker:', error);
        });
    }
  }, [serviceWorkerRegistered]);
  
  // --- EFFECT: Monitoraggio dello stato della connessione ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineBanner(false);
      
      // Tenta di sincronizzare i messaggi in coda quando la connessione viene ripristinata
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('sync-messages');
        });
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineBanner(true);
      
      // Nascondi il banner dopo 5 secondi
      setTimeout(() => {
        setShowOfflineBanner(false);
      }, 5000);
    };
    
    // Controlla lo stato iniziale della connessione
    setIsOffline(!navigator.onLine);
    
    // Aggiungi i listener per gli eventi online e offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // --- EFFECT: Messaggio di benvenuto ---
  useEffect(() => {
    console.log('Effect welcome message - languageSelected:', languageSelected, 'welcomeMessageSent:', welcomeMessageSentRef.current);
    // Invia il messaggio di benvenuto solo se l'utente ha selezionato una lingua
    if (languageSelected && !welcomeMessageSentRef.current && !loading && messages.length === 0) {
      const timer = setTimeout(async () => {
        try {
          // Recupera la lingua dal localStorage e aggiorna lo stato
          const storedLanguage = localStorage.getItem('selectedLanguage') || currentLanguage;
          setCurrentLanguage(storedLanguage);
          
          // Utilizziamo il messaggio di benvenuto tradotto nella lingua selezionata
          const welcomeMessage = welcomeMessages[storedLanguage] || welcomeMessages.it;
          
          // Ferma qualsiasi audio in riproduzione prima di iniziare
          stopCurrentAudio();
          
          // Aggiungi il messaggio di benvenuto all'UI come messaggio utente
          setMessages(m => [...m, { role: 'user', content: welcomeMessage }]);
          
          // Log del messaggio dell'utente
          if (conversationId) {
            await logMessage('user', welcomeMessage, {
              timestamp: new Date().toISOString(),
              language: storedLanguage
            });
          }

          // Invia il messaggio all'assistente con la lingua corretta
          const res = await fetch('/api/taoleia-agent-stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-selected-language': storedLanguage
            },
            body: JSON.stringify({ message: welcomeMessage, threadId })
          });
          
          const newTid = res.headers.get('X-Thread-Id');
          if (newTid) setThreadId(newTid);
          
          // Aggiungi il placeholder del messaggio dell'assistente con l'indicatore di caricamento
          setMessages(m => [...m, { role: 'assistant', content: '', isLoading: true }]);

          // Processa la risposta dell'assistente
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = '', full = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const parts = buf.split(/\r?\n\r?\n/);
            buf = parts.pop();
            for (const p of parts) {
              const line = p.split(/\r?\n/).find(l => l.startsWith('data:'));
              if (!line) continue;
              const data = line.slice(5).trim();
              if (data === '[DONE]') continue;
              let obj;
              try { obj = JSON.parse(data); }
              catch { continue; }
              if (obj.type === 'tool_call_result') {
                setMessages(m => [...m, { role:'tool', data:obj.data }]);
                continue;
              }
              if (obj.object==='thread.message.delta' && obj.delta?.content) {
                const delta = obj.delta.content
                  .filter(i=>i.type==='text')
                  .map(i=>i.text.value).join('');
                full += delta;
                const now = performance.now();
                if (now - lastUiUpdateRef.current > UI_THROTTLE_MS) {
                  setMessages(m => {
                    const c = [...m];
                    c[c.length-1].content = full;
                    c[c.length-1].isLoading = false; // Rimuovi l'indicatore di caricamento
                    return c;
                  });
                  lastUiUpdateRef.current = now;
                }
              }
            }
          }
          
          // Aggiungi la risposta finale dell'assistente
          setMessages(m => {
            const c = [...m];
            c[c.length-1].content = full;
            c[c.length-1].isLoading = false; // Assicurati che l'indicatore di caricamento sia rimosso
            return c;
          });

          // Log della risposta dell'assistente
          if (conversationId) {
            await logMessage('assistant', full, {
              timestamp: new Date().toISOString(),
              language: storedLanguage
            });
          }
          
          // Ferma qualsiasi audio in riproduzione prima di riprodurre il nuovo
          stopCurrentAudio();
          
          // Riproduci l'audio della risposta usando il sistema centralizzato
          await playAudio(full, currentLanguage);

          welcomeMessageSentRef.current = true;
        } catch (error) {
          console.error('Errore nell\'invio del messaggio di benvenuto:', error);
          if (conversationId) {
            await logError('Errore nell\'invio del messaggio di benvenuto', { error });
          }
        }
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [loading, messages.length, conversationId, logMessage, logError, languageSelected, currentLanguage, stopCurrentAudio, playAudio]);

  // --- EFFECT: init Web Speech ---
  useEffect(() => {
    console.log('Initializing speech recognition with language:', speechLanguages[currentLanguage]);
    
    // Function to create and configure a new recognition instance
    const createRecognitionInstance = () => {
      if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
        console.warn('Speech recognition not available in this browser');
        return null;
      }
      
      try {
        const rec = new window.webkitSpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = speechLanguages[currentLanguage];
        rec.maxAlternatives = 1;

        // Aggiungi un timer per l'auto-spegnimento
        let silenceTimer;
        const SILENCE_THRESHOLD = 1500; // 1.5 secondi di silenzio
        let isAutoStopped = false; // Flag per tracciare se è stato fermato automaticamente

        rec.onstart = () => {
          console.log('Speech recognition started (initial setup)');
          setIsListeningChat(true);
          isAutoStopped = false; // Reset del flag quando viene avviato manualmente
        };
        
        rec.onend = () => {
          console.log('Speech recognition ended (initial setup)');
          setIsListeningChat(false);
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
          }
        };
        
        rec.onerror = (event) => {
          console.error('Speech recognition error (initial setup):', event.error);
          setIsListeningChat(false);
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
          }
        };
        
        rec.onresult = (event) => {
          console.log('Got speech result (initial setup)');
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);

          // Resetta il timer del silenzio ogni volta che riceviamo un risultato
          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }
          silenceTimer = setTimeout(() => {
            if (rec && isListeningChat && !isAutoStopped) {
              console.log('Auto-stopping speech recognition due to silence');
              isAutoStopped = true;
              rec.stop();
            }
          }, SILENCE_THRESHOLD);
        };

        rec.onaudiostart = () => {
          console.log('Audio capturing started');
        };

        rec.onsoundstart = () => {
          console.log('Sound detected');
        };

        rec.onspeechstart = () => {
          console.log('Speech detected');
        };

        rec.onspeechend = () => {
          console.log('Speech ended');
          // Ferma il riconoscimento quando l'utente smette di parlare
          if (rec && isListeningChat && !isAutoStopped) {
            setTimeout(() => {
              isAutoStopped = true;
              rec.stop();
            }, 1000); // Attendi 1 secondo dopo la fine del parlato
          }
        };

        return rec;
      } catch (error) {
        console.error('Error creating speech recognition instance:', error);
        return null;
      }
    };
    
    // Cleanup previous instance if exists
    if (chatRecRef.current) {
      try {
        chatRecRef.current.stop();
        console.log('Stopped previous recognition instance during initialization');
      } catch (e) {
        console.log('Error stopping previous recognition during initialization:', e);
      }
      chatRecRef.current = null; // Ensure garbage collection
    }
    
    // Create new instance
    chatRecRef.current = createRecognitionInstance();
    
    if (chatRecRef.current) {
      console.log('Speech recognition successfully initialized with language:', speechLanguages[currentLanguage]);
    }
    
    // Cleanup function
    return () => {
      if (chatRecRef.current) {
        try {
          chatRecRef.current.stop();
          console.log('Speech recognition stopped during cleanup');
        } catch (e) {
          console.log('Error stopping recognition during cleanup:', e);
        }
        chatRecRef.current = null; // Ensure garbage collection
      }
    };
  }, [currentLanguage]);

  const handleSpeechLanguageChange = lang => {
    console.log('Changing speech language to:', lang, speechLanguages[lang]);
    setCurrentLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
    
    // Imposta che l'utente ha selezionato una lingua e nascondi il modale
    setLanguageSelected(true);
    setShowLanguageModal(false);
    
    // Resetta lo stato del messaggio di benvenuto per permettere il reinvio
    welcomeMessageSentRef.current = false;
    
    try {
      // Always stop any existing recognition instance first
      if (chatRecRef.current) {
        const wasListening = isListeningChat;
        console.log('Was listening before language change:', wasListening);
        
        try {
          chatRecRef.current.stop();
          console.log('Stopped previous recognition instance');
        } catch (error) {
          console.error('Error stopping recognition during language change:', error);
        }
        
        // Set to null to ensure garbage collection
        chatRecRef.current = null;
        
        // Use a longer delay before creating a new instance
        setTimeout(() => {
          try {
            // Create new instance with updated language
            if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
              const rec = new window.webkitSpeechRecognition();
              rec.continuous = false;
              rec.interimResults = true;
              rec.lang = speechLanguages[lang];
              rec.maxAlternatives = 1;

              // Aggiungi un timer per l'auto-spegnimento
              let silenceTimer;
              const SILENCE_THRESHOLD = 1500; // 1.5 secondi di silenzio
              let isAutoStopped = false; // Flag per tracciare se è stato fermato automaticamente

              rec.onstart = () => {
                console.log('Speech recognition started after language change');
                setIsListeningChat(true);
                isAutoStopped = false; // Reset del flag quando viene avviato manualmente
              };
              
              rec.onend = () => {
                console.log('Speech recognition ended after language change');
                setIsListeningChat(false);
                if (silenceTimer) {
                  clearTimeout(silenceTimer);
                  silenceTimer = null;
                }
              };
              
              rec.onerror = (event) => {
                console.error('Speech recognition error after language change:', event.error);
                setIsListeningChat(false);
                if (silenceTimer) {
                  clearTimeout(silenceTimer);
                  silenceTimer = null;
                }
              };
              
              rec.onresult = (event) => {
                console.log('Got speech result after language change');
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                  transcript += event.results[i][0].transcript;
                }
                setInput(transcript);

                // Resetta il timer del silenzio ogni volta che riceviamo un risultato
                if (silenceTimer) {
                  clearTimeout(silenceTimer);
                }
                silenceTimer = setTimeout(() => {
                  if (rec && isListeningChat && !isAutoStopped) {
                    console.log('Auto-stopping speech recognition due to silence');
                    isAutoStopped = true;
                    rec.stop();
                  }
                }, SILENCE_THRESHOLD);
              };

              rec.onaudiostart = () => {
                console.log('Audio capturing started');
              };

              rec.onsoundstart = () => {
                console.log('Sound detected');
              };

              rec.onspeechstart = () => {
                console.log('Speech detected');
              };

              rec.onspeechend = () => {
                console.log('Speech ended');
                // Ferma il riconoscimento quando l'utente smette di parlare
                if (rec && isListeningChat && !isAutoStopped) {
                  setTimeout(() => {
                    isAutoStopped = true;
                    rec.stop();
                  }, 1000); // Attendi 1 secondo dopo la fine del parlato
                }
              };
              
              chatRecRef.current = rec;
              console.log('Created new recognition instance with language:', speechLanguages[lang]);
              
              // Non riavviare automaticamente dopo il cambio lingua
              // L'utente dovrà cliccare manualmente per riattivare
            }
          } catch (error) {
            console.error('Error creating new recognition instance:', error);
            setIsListeningChat(false);
          }
        }, 800);
      }
    } catch (error) {
      console.error('Error in handleSpeechLanguageChange:', error);
    }
  };

  // Modifica la funzione sendMessage per utilizzare il nuovo sistema audio
  // Funzione per gestire i suggerimenti di chat (mantenuta per compatibilità)
  const handleSuggestionClick = (suggestion) => {
    // Invia direttamente il messaggio invece di metterlo nell'input
    sendMessage(suggestion);
  };
  

  
  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    
    setLoading(true);
    setInput('');
    
    // Ferma qualsiasi audio in riproduzione prima di iniziare
    stopCurrentAudio();
    
    try {
      // Aggiungi il messaggio dell'utente
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    
      // Log del messaggio dell'utente
      if (conversationId) {
        await logMessage('user', text, {
          timestamp: new Date().toISOString(),
          language: currentLanguage
        });
      }

      // Se l'utente è offline, salva il messaggio nella coda e mostra un messaggio di avviso
      if (isOffline) {
        try {
          // Salva il messaggio nella coda offline
          await saveMessageToQueue({
            message: text,
            threadId: threadId,
            language: currentLanguage,
            timestamp: new Date().toISOString()
          });
          
          // Aggiungi un messaggio di avviso
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Sei offline. Il tuo messaggio verrà inviato automaticamente quando tornerai online.',
            type: 'offline',
            timestamp: new Date().toISOString()
          }]);
          
          setLoading(false);
          return;
        } catch (error) {
          console.error('Errore durante il salvataggio del messaggio offline:', error);
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/taoleia-agent-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-selected-language': currentLanguage
        },
        body: JSON.stringify({ message: text, threadId })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const dec = new TextDecoder();
      let buf = '', full = '';

      // Aggiungi il placeholder del messaggio dell'assistente immediatamente
      // Questo verrà mostrato con l'indicatore di caricamento
      setMessages(m => [...m, { role: 'assistant', content: '', isLoading: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split(/\r?\n\r?\n/);
        buf = parts.pop();
        for (const p of parts) {
          const line = p.split(/\r?\n/).find(l => l.startsWith('data:'));
          if (!line) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          let obj;
          try { obj = JSON.parse(data); }
          catch { continue; }
          if (obj.type === 'tool_call_result') {
            setMessages(m => [...m, { role: 'tool', data: obj.data }]);
            continue;
          }
          if (obj.object === 'thread.message.delta' && obj.delta?.content) {
            const delta = obj.delta.content
              .filter(i => i.type === 'text')
              .map(i => i.text.value).join('');
            full += delta;
            const now = performance.now();
            if (now - lastUiUpdateRef.current > UI_THROTTLE_MS) {
              setMessages(m => {
                const c = [...m];
                c[c.length - 1].content = full;
                c[c.length - 1].isLoading = false; // Rimuovi l'indicatore di caricamento quando iniziamo a ricevere contenuto
                return c;
              });
              lastUiUpdateRef.current = now;
            }
          }
        }
      }

      // Aggiorna il messaggio finale e riproduci l'audio
      setMessages(m => {
        const c = [...m];
        c[c.length - 1].content = full;
        c[c.length - 1].isLoading = false; // Assicurati che l'indicatore di caricamento sia rimosso
        return c;
      });

      // Log della risposta finale dell'assistente
      if (conversationId) {
        await logMessage('assistant', full, {
          timestamp: new Date().toISOString(),
          language: currentLanguage
        });
      }

      // Ferma qualsiasi audio in riproduzione prima di riprodurre il nuovo
      stopCurrentAudio();
      
      // Riproduci l'audio della risposta usando il sistema centralizzato
      await playAudio(full, currentLanguage);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Mi dispiace, si è verificato un errore.' }]);
      
      // Se l'errore è dovuto alla connessione, salva il messaggio nella coda offline
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setIsOffline(true);
        setShowOfflineBanner(true);
        
        // Nascondi il banner dopo 5 secondi
        setTimeout(() => {
          setShowOfflineBanner(false);
        }, 5000);
        
        // Salva il messaggio nella coda offline
        saveMessageToQueue({
          message: text,
          threadId: threadId,
          language: currentLanguage,
          timestamp: new Date().toISOString()
        }).catch(err => {
          console.error('Errore durante il salvataggio del messaggio offline:', err);
        });
      }
      
      // Log dell'errore
      if (conversationId) {
        await logError('Errore durante l\'invio del messaggio', {
          error: error.message,
          message: text,
          language: currentLanguage
        });
      }
    }
    setLoading(false);
  };

  // --- RENDER JSX ---
  return (
    <div className="relative w-full h-screen max-w-xl mx-auto flex flex-col z-3 app"
        style={{
        paddingTop:    'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Modale di selezione lingua */}
      <LanguageModal 
        isOpen={showLanguageModal} 
        onLanguageSelect={(lang) => {
          handleSpeechLanguageChange(lang);
          // La funzione handleSpeechLanguageChange già imposta languageSelected e showLanguageModal
          // quindi non è necessario impostarli di nuovo qui
        }} 
      />
      
      <>
      {/* <NewsletterForm></NewsletterForm> */}
      </>
      <img src="/sfondo.png" className='absolute sfocas'></img>
      
      {/* Componente per l'installazione PWA */}
      <InstallPWA />
      
      {/* Banner per la modalità offline */}
      {showOfflineBanner && (
        <div className="offline-banner" role="alert" aria-live="assertive">
          <span>Sei offline. Alcune funzionalità potrebbero non essere disponibili.</span>
        </div>
      )}
      
      {/* Guida di benvenuto per i nuovi utenti */}
      <WelcomeGuide 
        currentLanguage={currentLanguage}
        languageSelected={languageSelected}
        onClose={() => {}}
      />
    
      {/* Menu di accessibilità */}
      <AccessibilityMenu />
      
      {/* Pulsante per aprire il menu delle categorie */}
      <div 
        style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 60 }}
      >
        <button
          onClick={() => setShowCategoryMenu(true)}
          className="bg-white hover:bg-gray-100 text-[#0a3b3b] rounded-full p-3.5 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E3742E] border-2 border-[#E3742E] transition-all duration-200 hover:scale-110"
          aria-label={
            currentLanguage === 'en' ? 'Open Category Menu' :
            currentLanguage === 'fr' ? 'Ouvrir le menu des catégories' :
            currentLanguage === 'es' ? 'Abrir menú de categorías' :
            currentLanguage === 'de' ? 'Kategoriemenü öffnen' :
            'Apri menu categorie'
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="#E3742E"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>
      
      {/* Menu delle categorie */}
      <CategoryMenu
             isVisible={showCategoryMenu}
             onClose={() => setShowCategoryMenu(false)}
             onCategorySelect={(suggestion) => {
               // Invia direttamente il messaggio invece di metterlo nell'input
               sendMessage(suggestion);
               setShowCategoryMenu(false); // Chiudi il menu dopo aver selezionato un suggerimento
             }}
             currentLanguage={currentLanguage}
           />
      
      {/* Introduzione alle funzionalità */}
      <FeatureIntroduction 
        currentLanguage={currentLanguage} 
      />
      


      {/* Video con bordi arrotondati - dimensioni ridotte - nascosto quando il menu categorie è aperto */}
      {!showCategoryMenu && (
        <div className="absolute top-0 left-0 w-full h-[25vh] z-50 overflow-hidden rounded-3xl p-3">
          <VideoPlayer
            videoUrl="/parla.mp4"
            isPlaying={isPlaying && !showCategoryMenu}
            className="object-cover w-full h-full"
            isMuted={true}
          />
          
          {/* Player audio centralizzato */}
          <CentralAudioPlayer 
            audioRef={audioManagerRef}
            isPlaying={isPlaying && !showCategoryMenu}
            onPlayPause={togglePlayPause}
          />
        </div>
      )}
      
      {/* Dropdown delle lingue */}
      <div className="absolute top-4 right-4 z-100">
        <LanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={handleSpeechLanguageChange}
        />
      </div>

      {/* Pulsante toggle audio */}
      <AudioToggle 
        isAudioEnabled={isAudioEnabled}
        onToggle={toggleAudioEnabled}
      />

      {/* Contenuti che scorrono sotto il video */}
      <div className="flex flex-col pt-[25vh] h-full rounded-full">
        {/* Area dinamica */}
        <div className="relative flex-1">
          {/* CHAT */}
          {activeTab === 'chat' && (
            <div className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-3" role="list" aria-live="polite">
              <ChatMessages
                messages={messages}
                onCategoryClick={(clickedText) => {
                    // Traduzioni per "Parlami di" in base alla lingua selezionata
                    const talkAboutTranslations = {
                      it: "Parlami di",
                      en: "Tell me about",
                      fr: "Parle-moi de",
                      es: "Háblame de",
                      de: "Erzähl mir von",
                      pt: "Fale-me sobre",
                      ru: "Расскажи мне о",
                      zh: "告诉我关于",
                      ja: "について教えて",
                      ar: "حدثني عن"
                    };
                    
                    // Usa la traduzione corretta o l'italiano come fallback
                    const talkAbout = talkAboutTranslations[currentLanguage] || talkAboutTranslations.it;
                    
                    // Gestione speciale per il giapponese che ha una struttura grammaticale diversa
                    if (currentLanguage === 'ja') {
                      sendMessage(`${clickedText}${talkAbout}`);
                    } else {
                      sendMessage(`${talkAbout} ${clickedText}`);
                    }
                  }}
                UI_THROTTLE_MS={UI_THROTTLE_MS}
                lastUiUpdateRef={lastUiUpdateRef}
                loading={loading}
              />
              <div ref={endRef} />
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="absolute inset-0 overflow-y-auto p-4">
              <LanguageSelector
                currentLanguage={currentLanguage}
                onLanguageChange={handleSpeechLanguageChange}
              />
            </div>
          )}

          {/* LOCATION */}
          {activeTab === 'location' && (
            <div className="absolute inset-0">
              <MapView key={mapKey} />
            </div>
          )}
        </div>

        {/* Input bar (solo in chat) */}
        {activeTab === 'chat' && (
          <div className="input-container">
            <div className="flex space-x-2">
              <input
                type="text"
                className="input-field"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="Scrivi un messaggio…"
                disabled={loading || isOffline}
                aria-label="Messaggio di testo"
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
                aria-label="Invia messaggio"
              >
                ➤
              </button>
            </div>
            
            {/* I suggerimenti di chat sono stati rimossi come richiesto */}
          </div>
        )}

        {/* Bottom nav arrotondata */}
        {/* <nav className="nav-bar">
          
          <button 
            onClick={() => setActiveTab('location')} 
            className={`nav-button ${activeTab === 'location' ? 'active' : ''}`}
          >
            <MapPinIcon
              className={`nav-icon ${activeTab === 'location' ? 'text-[#E3742E]' : 'text-[#F5EFE0]'}`}
            />
          </button>
          
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`nav-button ${activeTab === 'chat' ? 'active' : ''}`}
          >
            <CodeBracketIcon
              className={`nav-icon ${activeTab === 'chat' ? 'text-[#E3742E]' : 'text-[#F5EFE0]'}`}
            />
          </button>
        </nav> */}
      </div>
    </div>
);

}
