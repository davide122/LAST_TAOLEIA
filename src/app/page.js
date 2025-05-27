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
import MapView from './components/MapView';
import NewsletterForm from './components/newsletter/NewsletterForm';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import LanguageSelector from './components/languageselector.jsx';
import { useConversationLogger } from '../hooks/useConversationLogger';

export default function TaoleiaChat() {
  // --- STATE & REF ---
  const [activeTab, setActiveTab]   = useState('chat');
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [threadId, setThreadId]     = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('it');
  const [mapKey, setMapKey] = useState(0);
  const [categories, setCategories] = useState([]);

  const [isListeningChat, setIsListeningChat] = useState(false);
  const chatRecRef = useRef(null);
  const UI_THROTTLE_MS = 100;
  const lastUiUpdateRef = useRef(0);

  const audioInitRef       = useRef(false);
  const mediaSourceRef     = useRef(null);
  const sourceBufferRef    = useRef(null);
  const audioElementRef    = useRef(null);

  const endRef             = useRef(null);

  const [videoTtsText, setVideoTtsText] = useState('');

  const welcomeMessageSentRef = useRef(false);
  const { playTTS } = useAudioPlayer();

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // Inizializza il logger delle conversazioni
  const { 
    conversationId, 
    startConversation, 
    logMessage, 
    logError 
  } = useConversationLogger();

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
  
  // --- EFFECT: pulizia risorse audio quando si cambia scheda ---
  useEffect(() => {
    // Pulisci le risorse audio quando l'utente cambia scheda
    if (activeTab !== 'chat' && audioInitRef.current) {
      try {
        if (mediaSourceRef.current && mediaSourceRef.current.readyState !== 'closed') {
          mediaSourceRef.current.endOfStream();
        }
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.src = '';
          URL.revokeObjectURL(audioElementRef.current.src);
        }
        sourceBufferRef.current = null;
        audioInitRef.current = false;
        console.log('Risorse audio pulite dopo cambio scheda');
      } catch (err) {
        console.error('Errore durante la pulizia delle risorse audio:', err);
      }
    }
  }, [activeTab]);

  // --- EFFECT: Messaggio di benvenuto ---
  useEffect(() => {
    if (!welcomeMessageSentRef.current && !loading && messages.length === 0) {
      const timer = setTimeout(async () => {
        try {
          // Recupera la lingua dal localStorage e aggiorna lo stato
          const storedLanguage = localStorage.getItem('selectedLanguage') || 'it';
          setCurrentLanguage(storedLanguage);
          
          // Utilizziamo il messaggio di benvenuto tradotto nella lingua selezionata
          const welcomeMessage = welcomeMessages[storedLanguage] || welcomeMessages.it;
          
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
          
          // Aggiungi il placeholder del messaggio dell'assistente
          setMessages(m => [...m, { role: 'assistant', content: '' }]);

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
                // Gestione degli errori nelle function calls
                if (obj.data && obj.data.error) {
                  // Se c'è un errore nella function call, aggiungiamo un messaggio di errore
                  setMessages(m => [...m, { 
                    role: 'assistant', 
                    content: `Mi dispiace, non sono riuscito a recuperare le informazioni richieste. ${obj.data.error}`
                  }]);
                } else if (obj.data && (!obj.data.name || !obj.data.description)) {
                  // Se i dati sono incompleti o vuoti
                  setMessages(m => [...m, { 
                    role: 'assistant', 
                    content: 'Mi dispiace, non sono riuscito a trovare informazioni dettagliate su questa attività.'
                  }]);
                } else {
                  // Se tutto va bene, mostriamo la scheda dell'attività
                  setMessages(m => [...m, { role: 'tool', data: obj.data }]);
                }
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
            return c;
          });

          // Log della risposta dell'assistente
          if (conversationId) {
            await logMessage('assistant', full, {
              timestamp: new Date().toISOString(),
              language: storedLanguage
            });
          }
          
          // Riproduci l'audio della risposta
          await playTTS(full);

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
  }, [loading, messages.length, conversationId, logMessage, logError, playTTS]);

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

  // Funzione per gestire l'audio della chat
  const handleChatAudio = async (text) => {
    if (!text.trim()) return;
    
    try {
      // Ferma e pulisce l'audio corrente se presente
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
        setIsAudioPlaying(false);
      }

      // Crea un nuovo elemento audio
      const audio = new Audio();
      audioRef.current = audio;

      // Fetch dell'audio
      const res = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        throw new Error(`TTS fallito con stato ${res.status}`);
      }

      // Imposta la sorgente audio
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audio.src = audioUrl;

      // Gestisci gli eventi di riproduzione
      audio.addEventListener('play', () => {
        setIsAudioPlaying(true);
      });

      audio.addEventListener('pause', () => {
        setIsAudioPlaying(false);
      });

      audio.addEventListener('ended', () => {
        setIsAudioPlaying(false);
        if (audioRef.current) {
          audioRef.current.src = '';
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        }
      });

      audio.addEventListener('error', (e) => {
        console.error('Errore durante la riproduzione audio:', e);
        setIsAudioPlaying(false);
        if (audioRef.current) {
          audioRef.current.src = '';
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        }
      });

      // Avvia la riproduzione
      await audio.play();

    } catch (err) {
      console.error('Errore durante la riproduzione TTS:', err);
      setIsAudioPlaying(false);
      if (audioRef.current) {
        audioRef.current.src = '';
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    }
  };

  // --- EFFECT: Inizializza le categorie ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/get-categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Modifica la funzione sendMessage per utilizzare handleChatAudio
  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    
    setLoading(true);
    setInput('');
    
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

      // Prepara il contesto per l'assistente usando le categorie già caricate
      const context = {
        language: currentLanguage,
        categories: categories,
        instructions: `You are a helpful assistant for Taormina tourism. Please respond in the same language as the user's message (${currentLanguage}). If the user asks about specific categories or activities, use the provided categories list to give relevant information.`
      };

      const response = await fetch('/api/taoleia-agent-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-selected-language': currentLanguage
        },
        body: JSON.stringify({ 
          message: text, 
          threadId,
          context 
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const dec = new TextDecoder();
      let buf = '', full = '';

      // Aggiungi il placeholder del messaggio dell'assistente
      setMessages(m => [...m, { role: 'assistant', content: '' }]);

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
            // Gestione degli errori nelle function calls
            if (obj.data && obj.data.error) {
              // Se c'è un errore nella function call, aggiungiamo un messaggio di errore
              const errorMessage = `Mi dispiace, non sono riuscito a recuperare le informazioni richieste. ${obj.data.error}`;
              setMessages(m => {
                const newMessages = [...m];
                // Rimuovi il messaggio dell'assistente vuoto
                newMessages.pop();
                // Aggiungi il messaggio di errore
                newMessages.push({ role: 'assistant', content: errorMessage });
                return newMessages;
              });
              // Aggiorna anche il testo completo per l'audio
              full = errorMessage;
            } else if (obj.data && (!obj.data.name || !obj.data.description)) {
              // Se i dati sono incompleti o vuoti
              const errorMessage = 'Mi dispiace, non sono riuscito a trovare informazioni dettagliate su questa attività.';
              setMessages(m => {
                const newMessages = [...m];
                // Rimuovi il messaggio dell'assistente vuoto
                newMessages.pop();
                // Aggiungi il messaggio di errore
                newMessages.push({ role: 'assistant', content: errorMessage });
                return newMessages;
              });
              // Aggiorna anche il testo completo per l'audio
              full = errorMessage;
            } else {
              // Se tutto va bene, mostriamo la scheda dell'attività
              setMessages(m => [...m, { role: 'tool', data: obj.data }]);
            }
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
        return c;
      });

      // Log della risposta finale dell'assistente
      if (conversationId) {
        await logMessage('assistant', full, {
          timestamp: new Date().toISOString(),
          language: currentLanguage
        });
      }

      // Riproduci l'audio della risposta usando handleChatAudio
      await handleChatAudio(full);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Mi dispiace, si è verificato un errore.' }]);
      
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
    <>
    <NewsletterForm></NewsletterForm>
    </>
    <img src="/sfondo.png" className='absolute sfocas'></img>

    {/* Video con bordi arrotondati */}
    <div className="absolute top-0 left-0 w-full h-[30vh] z-50 overflow-hidden rounded-3xl p-3">
      <VideoPlayer
        videoUrl="/parla.mp4"
        isPlaying={isAudioPlaying}
        className="object-cover w-full h-full"
      />
    </div>
    
    {/* Dropdown delle lingue */}
    <div className="absolute top-4 right-4 z-100">
      <LanguageSelector
        currentLanguage={currentLanguage}
        onLanguageChange={handleSpeechLanguageChange}
      />
    </div>

    {/* Contenuti che scorrono sotto il video */}
    <div className="flex flex-col pt-[30vh] h-full rounded-full">
      {/* Area dinamica */}
      <div className="relative flex-1">
        {/* CHAT */}
        {activeTab === 'chat' && (
          <div className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-3">
            <ChatMessages
              messages={messages}
              onCategoryClick={(category) => sendMessage(`Parlami di ${category}`)}
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
      )}

      {/* Bottom nav arrotondata */}
      <nav className="nav-bar">
        
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
      </nav>
    </div>
  </div>
);

}
