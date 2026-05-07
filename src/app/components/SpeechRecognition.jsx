import { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { speechLanguages } from '../config/languages';

export default function SpeechRecognition({ 
  currentLanguage, 
  onTranscriptChange, 
  disabled = false 
}) {
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    console.log('Initializing speech recognition with language:', speechLanguages[currentLanguage]);
    
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

        let silenceTimer;
        const SILENCE_THRESHOLD = 1500;
        let isAutoStopped = false;

        rec.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
          isAutoStopped = false;
        };
        
        rec.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
          }
        };
        
        rec.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
          }
        };
        
        rec.onresult = (event) => {
          console.log('Got speech result');
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          onTranscriptChange(transcript);

          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }
          silenceTimer = setTimeout(() => {
            if (rec && isListening && !isAutoStopped) {
              console.log('Auto-stopping speech recognition due to silence');
              isAutoStopped = true;
              rec.stop();
            }
          }, SILENCE_THRESHOLD);
        };

        rec.onspeechend = () => {
          console.log('Speech ended');
          if (rec && isListening && !isAutoStopped) {
            setTimeout(() => {
              isAutoStopped = true;
              rec.stop();
            }, 1000);
          }
        };

        return rec;
      } catch (error) {
        console.error('Error creating speech recognition instance:', error);
        return null;
      }
    };
    
    // Cleanup previous instance
    if (recRef.current) {
      try {
        recRef.current.stop();
        console.log('Stopped previous recognition instance');
      } catch (e) {
        console.log('Error stopping previous recognition:', e);
      }
      recRef.current = null;
    }
    
    // Create new instance
    recRef.current = createRecognitionInstance();
    
    if (recRef.current) {
      console.log('Speech recognition successfully initialized with language:', speechLanguages[currentLanguage]);
    }
    
    // Cleanup function
    return () => {
      if (recRef.current) {
        try {
          recRef.current.stop();
          console.log('Speech recognition stopped during cleanup');
        } catch (e) {
          console.log('Error stopping recognition during cleanup:', e);
        }
        recRef.current = null;
      }
    };
  }, [currentLanguage, onTranscriptChange]);

  const toggleListening = () => {
    try {
      if (isListening) {
        console.log('Stopping speech recognition');
        if (recRef.current) {
          recRef.current.stop();
        } else {
          console.warn('No speech recognition instance to stop');
          setIsListening(false);
        }
      } else {
        console.log('Starting speech recognition');
        if (!recRef.current) {
          console.warn('Speech recognition not initialized, reinitializing...');
          if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            try {
              const rec = new window.webkitSpeechRecognition();
              rec.continuous = false;
              rec.interimResults = true;
              rec.lang = speechLanguages[currentLanguage];
              
              rec.onstart = () => {
                console.log('Speech recognition started (reinitialized)');
                setIsListening(true);
              };
              
              rec.onend = () => {
                console.log('Speech recognition ended (reinitialized)');
                setIsListening(false);
              };
              
              rec.onerror = (event) => {
                console.error('Speech recognition error (reinitialized):', event.error);
                setIsListening(false);
              };
              
              rec.onresult = (event) => {
                console.log('Got speech result (reinitialized)');
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                  transcript += event.results[i][0].transcript;
                }
                onTranscriptChange(transcript);
              };
              
              recRef.current = rec;
              console.log('Successfully reinitialized speech recognition with language:', speechLanguages[currentLanguage]);
            } catch (initError) {
              console.error('Error reinitializing speech recognition:', initError);
              setIsListening(false);
              return;
            }
          } else {
            console.error('Speech recognition not available in this browser');
            setIsListening(false);
            return;
          }
        }
        
        try {
          if (recRef.current) {
            recRef.current.start();
          } else {
            console.error('Failed to start speech recognition: instance not available');
            setIsListening(false);
          }
        } catch (startError) {
          console.error('Error starting speech recognition:', startError);
          setIsListening(false);
        }
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
      setIsListening(false);
    }
  };

  return (
    <button
      onClick={toggleListening}
      className={`mic-button ${isListening ? 'bg-red-500' : 'bg-gray-500'} p-2 rounded-full`}
      disabled={disabled}
    >
      <MicrophoneIcon className="h-6 w-6 text-white" />
    </button>
  );
} 