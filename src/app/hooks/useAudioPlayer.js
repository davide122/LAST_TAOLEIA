import { useRef } from 'react';

export function useAudioPlayer() {
  const audioInitRef = useRef(false);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const audioElementRef = useRef(null);

  const initAudio = () => {
    // Pulizia delle risorse precedenti se esistono
    if (audioInitRef.current) {
      try {
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.src = '';
          URL.revokeObjectURL(audioElementRef.current.src);
        }
        if (mediaSourceRef.current) {
          if (mediaSourceRef.current.readyState === 'open') {
            mediaSourceRef.current.endOfStream();
          }
          mediaSourceRef.current = null;
        }
        sourceBufferRef.current = null;
      } catch (err) {
        console.error('Errore durante la pulizia delle risorse audio:', err);
      }
    }
    
    // Inizializzazione nuove risorse
    const audio = new Audio();
    audioElementRef.current = audio;
    const ms = new MediaSource();
    audio.src = URL.createObjectURL(ms);
    ms.addEventListener('sourceopen', () => {
      try {
        if (ms.sourceBuffers.length === 0) {
          sourceBufferRef.current = ms.addSourceBuffer('audio/mpeg');
        }
      } catch (err) {
        console.error('Errore durante la creazione del SourceBuffer:', err);
      }
    });
    audio.play().catch(() => {});
    mediaSourceRef.current = ms;
    audioInitRef.current = true;
  };

  const playTTS = async text => {
    if (!text.trim()) return;
    
    try {
      // Inizializza o reinizializza l'audio per ogni nuova riproduzione
      initAudio();
      
      // Attendi che il SourceBuffer sia pronto
      await new Promise((resolve, reject) => {
        const checkBuffer = () => {
          if (sourceBufferRef.current) {
            resolve();
          } else if (mediaSourceRef.current) {
            const onSourceOpen = () => {
              mediaSourceRef.current.removeEventListener('sourceopen', onSourceOpen);
              if (sourceBufferRef.current) {
                resolve();
              } else {
                reject(new Error('Impossibile creare SourceBuffer'));
              }
            };
            mediaSourceRef.current.addEventListener('sourceopen', onSourceOpen, { once: true });
          } else {
            reject(new Error('MediaSource non inizializzato'));
          }
        };
        
        checkBuffer();
      });
      
      // Fetch dell'audio
      const res = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) {
        throw new Error(`TTS fallito con stato ${res.status}`);
      }
      
      // Leggi e processa lo stream audio
      const reader = res.body.getReader();
      const sb = sourceBufferRef.current;
      
      if (!sb) {
        throw new Error('SourceBuffer non disponibile');
      }
      
      // Assicurati che il buffer sia in uno stato aggiornabile
      if (sb.updating) {
        await new Promise(r => {
          const onEnd = () => { sb.removeEventListener('updateend', onEnd); r(); };
          sb.addEventListener('updateend', onEnd, { once: true });
        });
      }
      
      // Processa lo stream audio
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
            mediaSourceRef.current.endOfStream();
          }
          break;
        }
        
        // Attendi che il buffer sia pronto prima di appendere nuovi dati
        if (sb.updating) {
          await new Promise(r => {
            const onEnd = () => { sb.removeEventListener('updateend', onEnd); r(); };
            sb.addEventListener('updateend', onEnd, { once: true });
          });
        }
        
        try {
          sb.appendBuffer(value);
        } catch (err) {
          console.error('Errore durante l\'appendBuffer:', err);
          if (err.name === 'QuotaExceededError') {
            console.log('Quota superata, reinizializzazione audio...');
            initAudio();
            break;
          }
          throw err;
        }
        
        // Attendi che l'append sia completato
        await new Promise(r => {
          const onEnd = () => { sb.removeEventListener('updateend', onEnd); r(); };
          sb.addEventListener('updateend', onEnd, { once: true });
        });
      }
    } catch (err) {
      console.error('Errore durante la riproduzione TTS:', err);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    }
  };

  return {
    playTTS,
    initAudio
  };
} 