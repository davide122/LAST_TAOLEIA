'use client';

import { useEffect, useRef, useState } from 'react';

// Mappa dei fonemi e delle espressioni per il lip sync
const EXPRESSION_MAP = {
  // Espressioni base
  'neutral': {
    frames: [0, 1, 2],
    weight: 1.0
  },
  'happy': {
    frames: [3, 4, 5],
    weight: 0.8
  },
  'thinking': {
    frames: [6, 7, 8],
    weight: 0.6
  },
  
  // Fonemi principali con espressioni
  'a': {
    frames: [9, 10, 11],
    weight: 1.0,
    expression: 'happy'
  },
  'e': {
    frames: [12, 13, 14],
    weight: 0.9,
    expression: 'neutral'
  },
  'i': {
    frames: [15, 16, 17],
    weight: 0.8,
    expression: 'thinking'
  },
  'o': {
    frames: [18, 19, 20],
    weight: 1.0,
    expression: 'happy'
  },
  'u': {
    frames: [21, 22, 23],
    weight: 0.7,
    expression: 'neutral'
  },
  
  // Consonanti con espressioni
  'b': {
    frames: [24, 25],
    weight: 0.8,
    expression: 'neutral'
  },
  'p': {
    frames: [26, 27],
    weight: 0.9,
    expression: 'happy'
  },
  'm': {
    frames: [28, 29],
    weight: 0.7,
    expression: 'thinking'
  }
};

export default function VideoPlayer({ 
  videoUrl, 
  isPlaying,
  onPlaybackChange, 
  className,
  isMuted = true,
  onMuteToggle
}) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLooping, setIsLooping] = useState(true);
  const lastPlayTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Inizializzazione dell'analizzatore audio
  const initAudioAnalysis = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }
  };

  // Funzione per ottenere l'energia audio
  const getAudioEnergy = () => {
    if (!analyserRef.current) return 0;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calcola l'energia media
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return average / 128.0; // Normalizza tra 0 e 1
  };

  // Funzione per determinare l'espressione e il fonema corrente
  const getCurrentExpression = (time) => {
    // Simula un pattern di espressioni naturali
    const expressions = ['neutral', 'happy', 'thinking'];
    const baseIndex = Math.floor(time * 0.5) % expressions.length; // Cambia ogni 2 secondi
    
    // Aggiungi variazioni naturali
    const variation = Math.sin(time * 2) * 0.3; // Variazione sinusoidale
    const weight = 0.7 + variation; // Peso tra 0.4 e 1.0
    
    return {
      expression: expressions[baseIndex],
      weight: weight
    };
  };

  // Funzione per ottenere i frame con interpolazione
  const getFramesWithInterpolation = (currentPhoneme, nextPhoneme, progress) => {
    const currentFrames = EXPRESSION_MAP[currentPhoneme]?.frames || EXPRESSION_MAP.neutral.frames;
    const nextFrames = EXPRESSION_MAP[nextPhoneme]?.frames || EXPRESSION_MAP.neutral.frames;
    
    // Interpolazione tra i frame
    const currentFrame = currentFrames[Math.floor(progress * currentFrames.length)];
    const nextFrame = nextFrames[Math.floor(progress * nextFrames.length)];
    
    return Math.floor(currentFrame + (nextFrame - currentFrame) * progress);
  };

  // Gestione della riproduzione
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      // Riprendi da dove eravamo rimasti
      if (lastPlayTimeRef.current > 0) {
        video.currentTime = lastPlayTimeRef.current;
      }
      video.play().catch(console.error);
    } else {
      // Salva la posizione corrente
      lastPlayTimeRef.current = video.currentTime;
      video.pause();
    }
  }, [isPlaying]);

  // Gestione del loop del video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (isLooping && isPlaying) {
        video.currentTime = 0;
        video.play().catch(console.error);
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [isLooping, isPlaying]);

  // Gestione degli errori
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = (e) => {
      console.error('Video error:', e);
      setError('Errore nel caricamento del video');
    };

    video.addEventListener('error', handleError);
    return () => video.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="relative w-full h-full">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <p className="text-white">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        className={className}
        playsInline
        muted={isMuted}
        loop={isLooping}
        preload="auto"
      />
      
      {/* Pulsante muto integrato nel player */}
      {onMuteToggle && (
        <button 
          onClick={onMuteToggle}
          className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-sm transition-all duration-200 shadow-lg z-50"
          style={{ zIndex: 100 }}
          aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
          title={isMuted ? 'Attiva audio' : 'Disattiva audio'}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
