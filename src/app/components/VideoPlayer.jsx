'use client';

import { useEffect, useRef, useState } from 'react';

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;

export default function VideoPlayer({ 
  videoUrl, 
  isPlaying,
  onPlaybackChange, 
  className,
  isMuted = true,
  onMuteToggle,
  lipSyncAudioRef,
  lipSyncActive = false
}) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLooping, setIsLooping] = useState(true);
  const lastPlayTimeRef = useRef(0);
  const mouthRef = useRef(null);
  const lipSyncAudioContextRef = useRef(null);
  const lipSyncAnalyserRef = useRef(null);
  const lipSyncSourceRef = useRef(null);
  const lipSyncRafRef = useRef(null);
  const lipSyncPrevRef = useRef({ open: 0, width: 0.5, round: 0.2, intensity: 0, v: 'A' });

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

  useEffect(() => {
    const mount = mouthRef.current;
    const audioEl = lipSyncAudioRef?.current;

    const stop = () => {
      if (lipSyncRafRef.current) {
        cancelAnimationFrame(lipSyncRafRef.current);
        lipSyncRafRef.current = null;
      }
      if (lipSyncSourceRef.current) {
        try { lipSyncSourceRef.current.disconnect(); } catch {}
        lipSyncSourceRef.current = null;
      }
      if (lipSyncAnalyserRef.current) {
        try { lipSyncAnalyserRef.current.disconnect(); } catch {}
        lipSyncAnalyserRef.current = null;
      }
      if (mount) {
        mount.style.setProperty('--mouth-open', '0');
        mount.style.setProperty('--mouth-width', '0.5');
        mount.style.setProperty('--mouth-round', '0.2');
        mount.style.setProperty('--mouth-intensity', '0');
        mount.dataset.viseme = 'A';
      }
    };

    if (!lipSyncActive || !audioEl || !mount) {
      stop();
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) return;

        if (!lipSyncAudioContextRef.current) {
          lipSyncAudioContextRef.current = new AudioContextCtor();
        }
        const ctx = lipSyncAudioContextRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        if (!lipSyncAnalyserRef.current) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.65;
          lipSyncAnalyserRef.current = analyser;
        }

        if (lipSyncSourceRef.current) {
          try { lipSyncSourceRef.current.disconnect(); } catch {}
          lipSyncSourceRef.current = null;
        }

        const source = ctx.createMediaElementSource(audioEl);
        lipSyncSourceRef.current = source;
        source.connect(lipSyncAnalyserRef.current);
        lipSyncAnalyserRef.current.connect(ctx.destination);

        const data = new Uint8Array(lipSyncAnalyserRef.current.frequencyBinCount);
        const smoothing = 0.25;

        const tick = () => {
          if (cancelled) return;
          lipSyncAnalyserRef.current.getByteFrequencyData(data);

          let sum = 0;
          let sub = 0, low = 0, mid = 0, high = 0, veryHigh = 0;
          const n = data.length;
          for (let i = 0; i < n; i++) {
            const v = data[i] / 255;
            sum += v;
            if (i < 4) sub += v;
            else if (i < 10) low += v;
            else if (i < 26) mid += v;
            else if (i < 50) high += v;
            else veryHigh += v;
          }
          const energy = sum / n;

          const targetOpen = clamp01((energy - 0.03) / 0.33);
          const targetRound = clamp01((low - high + 0.15) / 0.55);
          const targetWidth = clamp01((mid - low + 0.15) / 0.55);
          const targetIntensity = clamp01(energy);

          let simple = 'C';
          if (energy < 0.04) simple = 'A';
          else if (targetOpen < 0.18) simple = 'B';
          else if (targetRound > 0.68) simple = targetOpen < 0.38 ? 'F' : 'E';
          else if (targetOpen > 0.78) simple = 'D';
          else if (targetWidth > 0.66) simple = 'C';

          const prev = lipSyncPrevRef.current;
          const next = {
            open: lerp(prev.open, targetOpen, smoothing),
            width: lerp(prev.width, targetWidth, smoothing),
            round: lerp(prev.round, targetRound, smoothing),
            intensity: lerp(prev.intensity, targetIntensity, smoothing),
            v: simple
          };
          lipSyncPrevRef.current = next;

          mount.style.setProperty('--mouth-open', next.open.toFixed(3));
          mount.style.setProperty('--mouth-width', next.width.toFixed(3));
          mount.style.setProperty('--mouth-round', next.round.toFixed(3));
          mount.style.setProperty('--mouth-intensity', next.intensity.toFixed(3));
          mount.dataset.viseme = next.v;

          lipSyncRafRef.current = requestAnimationFrame(tick);
        };

        lipSyncRafRef.current = requestAnimationFrame(tick);
      } catch {
        stop();
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [lipSyncActive, lipSyncAudioRef]);

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

      <div
        ref={mouthRef}
        className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
        style={{
          width: '38%',
          maxWidth: 160,
          opacity: lipSyncActive ? 0.92 : 0,
          transition: 'opacity 160ms ease',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))'
        }}
      >
        <svg viewBox="0 0 120 80" width="100%" height="100%" aria-hidden="true">
          <g
            style={{
              transformOrigin: '60px 40px',
              transform: 'scaleX(calc(0.9 + var(--mouth-width) * 0.35 - var(--mouth-round) * 0.12)) scaleY(calc(0.22 + var(--mouth-open) * 0.95))'
            }}
          >
            <ellipse cx="60" cy="44" rx="34" ry="10" fill="rgba(180, 60, 70, 0.95)" />
            <ellipse
              cx="60"
              cy="46"
              rx="28"
              ry="6"
              fill="rgba(40, 12, 12, 0.95)"
              style={{
                transformOrigin: '60px 46px',
                transform: 'scaleY(calc(0.25 + var(--mouth-open) * 1.2))'
              }}
            />
          </g>
        </svg>
      </div>
      
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
