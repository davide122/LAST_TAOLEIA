'use client';

import { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';

export default function CentralAudioPlayer({ audioRef, isPlaying, onPlayPause }) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progressRef = useRef(null);

  // Aggiorna il progresso e la durata quando l'audio cambia
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioRef]);

  // Formatta il tempo in mm:ss
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Gestisce il click sulla barra di progresso
  const handleProgressClick = (e) => {
    if (!audioRef?.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * audioRef.current.duration;
    
    audioRef.current.currentTime = newTime;
    setProgress(clickPosition * 100);
  };

  // Avanza di 10 secondi
  const handleForward = () => {
    if (!audioRef?.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
  };

  // Torna indietro di 10 secondi
  const handleBackward = () => {
    if (!audioRef?.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };

  return (
    <div className="central-audio-player">
      <div className="audio-controls">
        <button 
          className="audio-control-button" 
          onClick={handleBackward}
          aria-label="Indietro di 10 secondi"
          disabled={!audioRef?.current}
        >
          <FiSkipBack />
        </button>
        
        <button 
          className="audio-control-button play-pause" 
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
          disabled={!audioRef?.current}
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
        </button>
        
        <button 
          className="audio-control-button" 
          onClick={handleForward}
          aria-label="Avanti di 10 secondi"
          disabled={!audioRef?.current}
        >
          <FiSkipForward />
        </button>
      </div>
      
      <div className="audio-progress-container">
        <div 
          ref={progressRef}
          className="audio-progress-bar" 
          onClick={handleProgressClick}
        >
          <div 
            className="audio-progress" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="audio-time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}