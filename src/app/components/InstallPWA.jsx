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
    <div className="install-pwa-container">
      <button 
        onClick={handleInstallClick}
        className="install-pwa-button"
        aria-label="Installa l'app"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{marginRight: '8px'}}>
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        {isIOS ? 'Installa su iOS' : 'Installa l\'app'}
      </button>
      <button 
        onClick={handleCloseClick}
        className="install-pwa-close"
        aria-label="Chiudi"
      >
        ×
      </button>
    </div>
  );
}