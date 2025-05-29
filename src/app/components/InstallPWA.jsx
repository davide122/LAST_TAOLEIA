'use client';

import { useState, useEffect } from 'react';

export default function InstallPWA() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Mostra il pulsante dopo 10 secondi
    const timer = setTimeout(() => {
      setShowInstallPrompt(true);
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

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Funzione per mostrare il prompt di installazione
  const handleInstallClick = async () => {
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

  // Non mostrare nulla se non è il momento o se l'app è già installata
  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="install-pwa-container">
      <button 
        onClick={handleInstallClick}
        className="install-pwa-button"
        aria-label="Installa l'app"
      >
        Installa l'app
      </button>
    </div>
  );
}