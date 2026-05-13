'use client';

import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Controlla se è iOS
    const checkIOSDevice = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Controlla se l'app è già installata
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             window.navigator.standalone === true;
    };

    setIsIOS(checkIOSDevice());
    setIsStandalone(checkStandalone());

    // Mostra il pulsante dopo 10 secondi solo se non è già installata
    const timer = setTimeout(() => {
      if (!checkStandalone() && 
          localStorage.getItem('pwaInstallPromptDismissed') !== 'true') {
        setShowInstallPrompt(true);
      }
    }, 10000); // 10 secondi

    // Intercetta l'evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Previeni la visualizzazione automatica del prompt
      e.preventDefault();
      // Salva l'evento per usarlo più tardi
      setDeferredPrompt(e);
    };

    // Aggiungi l'event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Nascondi il pulsante se l'app viene installata
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      console.log('App installata con successo!');
    });

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Funzione per mostrare il prompt di installazione
  const handleInstallClick = async () => {
    if (isIOS) {
      // Mostra istruzioni per iOS
      alert('Per installare questa app su iOS:\n\n1. Tocca l\'icona di condivisione nella barra degli strumenti del browser\n2. Scorri e tocca "Aggiungi a Home"\n3. Tocca "Aggiungi" per confermare');
      return;
    }
    
    if (!deferredPrompt) {
      console.log('Nessun prompt di installazione disponibile');
      return;
    }

    // Mostra il prompt di installazione
    deferredPrompt.prompt();

    // Attendi che l'utente risponda al prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Scelta dell'utente: ${outcome}`);

    // Resetta il prompt salvato - può essere usato solo una volta
    setDeferredPrompt(null);
    
    // Nascondi il pulsante dopo il tentativo di installazione
    setShowInstallPrompt(false);
  };
  
  // Funzione per chiudere il prompt
  const handleCloseClick = () => {
    setShowInstallPrompt(false);
    // Salva la preferenza dell'utente in localStorage
    localStorage.setItem('pwaInstallPromptDismissed', 'true');
  };

  // Non mostrare nulla se non è il momento o se l'app è già installata
  if (!showInstallPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-fade-in-up">
      <div className="bg-[#0a3b3b]/95 backdrop-blur-lg text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3" onClick={handleInstallClick}>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold">{isIOS ? 'Aggiungi a Home' : 'Installa Taoleia'}</div>
            <div className="text-[10px] opacity-70">{isIOS ? 'Tocca condividi e "Aggiungi a Home"' : 'Per un\'esperienza app completa'}</div>
          </div>
        </div>
        <button 
          onClick={handleCloseClick}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Chiudi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}