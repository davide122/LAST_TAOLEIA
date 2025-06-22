'use client';

import { useEffect, useRef, useState } from 'react';
import { FiPlay, FiPause, FiLoader } from 'react-icons/fi';

export default function AudioPlayer({ text, language = 'it' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  // Genera l'audio quando il testo cambia
  const generateAudio = async () => {
    if (!text) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Pulisci l'URL precedente se esiste
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      const response = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella generazione dell\'audio');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    } catch (err) {
      console.error('Errore nella generazione dell\'audio:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce il play/pause dell'audio
  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) {
      generateAudio();
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Errore nella riproduzione:', err);
        setError('Impossibile riprodurre l\'audio');
      });
    }
  };

  // Aggiorna lo stato di riproduzione quando l'audio cambia
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      
      // Pulisci l'URL quando il componente viene smontato
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Traduzioni per i pulsanti e messaggi di errore
  const translations = {
    play: {
      it: 'Riproduci audio guida',
      en: 'Play audio guide',
      fr: 'Lire le guide audio',
      es: 'Reproducir guía de audio',
      de: 'Audioguide abspielen'
    },
    loading: {
      it: 'Generazione audio...',
      en: 'Generating audio...',
      fr: 'Génération audio...',
      es: 'Generando audio...',
      de: 'Audio wird generiert...'
    },
    error: {
      it: 'Errore nella generazione dell\'audio',
      en: 'Error generating audio',
      fr: 'Erreur lors de la génération audio',
      es: 'Error al generar audio',
      de: 'Fehler bei der Audiogenerierung'
    }
  };

  // Usa la lingua corrente o fallback a italiano
  const currentLang = language && translations.play[language] ? language : 'it';

  return (
    <div className="mt-4">
      <audio ref={audioRef} className="hidden" />
      
      {error ? (
        <div className="text-red-500 text-sm flex items-center">
          <FiLoader className="mr-2" />
          {translations.error[currentLang]}
        </div>
      ) : (
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex items-center justify-center px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          aria-label={translations.play[currentLang]}
        >
          {isLoading ? (
            <>
              <FiLoader className="animate-spin mr-2" />
              <span>{translations.loading[currentLang]}</span>
            </>
          ) : (
            <>
              {isPlaying ? <FiPause className="mr-2" /> : <FiPlay className="mr-2" />}
              <span>{translations.play[currentLang]}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}