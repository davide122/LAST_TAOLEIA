import { useRef, useState, useEffect } from 'react';

export function useAudioManager() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const currentAudioRef = useRef(null);
  const audioElementRef = useRef(null);
  const realtimeCtxRef = useRef(null);
  const realtimeGainRef = useRef(null);
  const realtimeNextTimeRef = useRef(0);
  const realtimeSourcesRef = useRef([]);
  
  // Carica le preferenze audio salvate quando il componente viene montato
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAudioPreference = localStorage.getItem('taoleia-audio-enabled');
      if (savedAudioPreference !== null) {
        setIsAudioEnabled(savedAudioPreference === 'true');
      }
    }
  }, []);

  const stopRealtimeAudio = () => {
    const ctx = realtimeCtxRef.current;
    if (ctx) {
      try {
        for (const src of realtimeSourcesRef.current) {
          try { src.stop(0); } catch {}
        }
      } catch {}
      realtimeSourcesRef.current = [];
      realtimeNextTimeRef.current = 0;
      realtimeGainRef.current = null;
      realtimeCtxRef.current = null;
      try { ctx.close(); } catch {}
    }
  };

  const stopCurrentAudio = () => {
    stopRealtimeAudio();
    const audio = currentAudioRef.current;
    if (!audio) return;

    const src = audio.src;
    audio.pause();
    if (src && src.startsWith('blob:')) {
      URL.revokeObjectURL(src);
    }
    audio.src = '';
    if (typeof audio.load === 'function') {
      audio.load();
    }
    currentAudioRef.current = null;
    audioElementRef.current = null;
    setIsPlaying(false);
  };

  const startRealtimePcmStream = async () => {
    if (!isAudioEnabled) return false;
    stopCurrentAudio();

    if (typeof window === 'undefined') return false;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return false;

    const ctx = new AudioContextCtor({ sampleRate: 48000 });
    realtimeCtxRef.current = ctx;
    realtimeNextTimeRef.current = ctx.currentTime + 0.04;

    const gain = ctx.createGain();
    gain.gain.value = 1;
    realtimeGainRef.current = gain;

    const dest = ctx.createMediaStreamDestination();
    gain.connect(dest);

    const audio = new Audio();
    audio.autoplay = true;
    audio.playsInline = true;
    audio.srcObject = dest.stream;
    currentAudioRef.current = audio;
    audioElementRef.current = audio;

    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('play', () => setIsPlaying(true));

    try {
      await ctx.resume();
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }

    return true;
  };

  const pushRealtimePcmChunk = (base64Audio, sampleRate = 24000) => {
    const ctx = realtimeCtxRef.current;
    const gain = realtimeGainRef.current;
    if (!ctx || !gain || !base64Audio) return;

    let bytes;
    try {
      const binStr = atob(base64Audio);
      bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    } catch {
      return;
    }

    if (bytes.byteLength < 2) return;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const frameCount = Math.floor(view.byteLength / 2);
    const floats = new Float32Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
      const s = view.getInt16(i * 2, true);
      floats[i] = s / 32768;
    }

    const buffer = ctx.createBuffer(1, floats.length, sampleRate);
    buffer.copyToChannel(floats, 0);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);

    const startAt = Math.max(ctx.currentTime + 0.015, realtimeNextTimeRef.current || ctx.currentTime);
    try {
      src.start(startAt);
    } catch {
      return;
    }
    realtimeNextTimeRef.current = startAt + buffer.duration;
    realtimeSourcesRef.current.push(src);
    src.onended = () => {
      realtimeSourcesRef.current = realtimeSourcesRef.current.filter(s => s !== src);
    };
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
    const ctx = realtimeCtxRef.current;
    if (ctx) {
      if (isPlaying) {
        ctx.suspend().catch(() => {});
        setIsPlaying(false);
      } else {
        ctx.resume().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

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
    startRealtimePcmStream,
    pushRealtimePcmChunk,
    togglePlayPause,
    isPlaying,
    audioElementRef,
    isAudioEnabled,
    toggleAudioEnabled
  };
}
