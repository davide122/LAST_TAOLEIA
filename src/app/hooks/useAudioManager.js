import { useRef, useState, useEffect } from 'react';

export function useAudioManager() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const currentAudioRef = useRef(null);
  const audioElementRef = useRef(null);
  
  // Carica le preferenze audio salvate quando il componente viene montato
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAudioPreference = localStorage.getItem('taoleia-audio-enabled');
      if (savedAudioPreference !== null) {
        setIsAudioEnabled(savedAudioPreference === 'true');
      }
    }
  }, []);

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      if (currentAudioRef.current.src) {
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      currentAudioRef.current = null;
      setIsPlaying(false);
    }
  };

  const playAudio = async (text, language = 'it') => {
    if (!text.trim()) return;
    
    // Se l'audio è disabilitato, non fare nulla
    if (!isAudioEnabled) return;

    try {
      // Ferma qualsiasi audio in riproduzione
      stopCurrentAudio();

      // Crea un nuovo elemento audio
      const audio = new Audio();
      currentAudioRef.current = audio;
      audioElementRef.current = audio;

      // Fetch dell'audio
      const res = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      });

      if (!res.ok) {
        throw new Error(`TTS fallito con stato ${res.status}`);
      }

      // Imposta la sorgente audio
      const blob = await res.blob();
      audio.src = URL.createObjectURL(blob);

      // Gestisci gli eventi di riproduzione
      audio.addEventListener('play', () => {
        setIsPlaying(true);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        stopCurrentAudio();
      });

      // Avvia la riproduzione
      await audio.play();

    } catch (err) {
      console.error('Errore durante la riproduzione TTS:', err);
      setIsPlaying(false);
      stopCurrentAudio();
    }
  };
  
  const togglePlayPause = () => {
    if (!currentAudioRef.current) return;
    
    if (isPlaying) {
      currentAudioRef.current.pause();
    } else {
      currentAudioRef.current.play().catch(err => {
        console.error('Errore nella riproduzione:', err);
      });
    }
  };

  // Funzione per attivare/disattivare l'audio
  const toggleAudioEnabled = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    localStorage.setItem('taoleia-audio-enabled', newState.toString());
    
    // Se stiamo disabilitando l'audio e c'è un audio in riproduzione, fermalo
    if (!newState && isPlaying) {
      stopCurrentAudio();
    }
  };

  return {
    playAudio,
    stopCurrentAudio,
    togglePlayPause,
    isPlaying,
    audioElementRef,
    isAudioEnabled,
    toggleAudioEnabled
  };
}