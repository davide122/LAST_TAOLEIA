import { useRef, useState } from 'react';

export function useAudioManager() {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudioRef = useRef(null);
  const audioElementRef = useRef(null);

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

  const playAudio = async (text) => {
    if (!text.trim()) return;

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
        body: JSON.stringify({ text })
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

  return {
    playAudio,
    stopCurrentAudio,
    togglePlayPause,
    isPlaying,
    audioElementRef
  };
}