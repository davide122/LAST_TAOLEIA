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
  className 
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
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <p className="text-white">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        className={className}
        playsInline
        muted
        loop={isLooping}
        preload="auto"
       
      />
    </div>
  );
}
