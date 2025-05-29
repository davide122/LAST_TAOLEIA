/**
 * Taoleia - Main JavaScript File
 * Contiene funzionalità comuni per l'applicazione PWA
 */

// Controlla se il browser supporta il service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration.scope);
      })
      .catch(error => {
        console.error('Errore durante la registrazione del Service Worker:', error);
      });
  });
}

// Gestione degli eventi di installazione PWA
let deferredPrompt;
const pwaInstallContainer = document.querySelector('.pwa-install-container');

window.addEventListener('beforeinstallprompt', (e) => {
  // Previeni la visualizzazione automatica del prompt
  e.preventDefault();
  // Salva l'evento per poterlo attivare più tardi
  deferredPrompt = e;
  
  // Mostra il pulsante di installazione dopo 10 secondi
  setTimeout(() => {
    if (pwaInstallContainer) {
      pwaInstallContainer.classList.add('show');
    }
  }, 10000);
});

// Funzione per installare la PWA quando l'utente clicca sul pulsante
function installPWA() {
  if (!deferredPrompt) {
    return;
  }
  
  // Mostra il prompt di installazione
  deferredPrompt.prompt();
  
  // Attendi che l'utente risponda al prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('Utente ha accettato l\'installazione della PWA');
      // Nascondi il pulsante di installazione
      if (pwaInstallContainer) {
        pwaInstallContainer.classList.remove('show');
      }
    } else {
      console.log('Utente ha rifiutato l\'installazione della PWA');
    }
    // Resetta la variabile deferredPrompt
    deferredPrompt = null;
  });
}

// Funzione per chiudere il prompt di installazione
function closePWAPrompt() {
  if (pwaInstallContainer) {
    pwaInstallContainer.classList.remove('show');
  }
}

// Controlla lo stato della connessione
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  document.body.classList.toggle('offline', !isOnline);
  
  // Puoi aggiungere qui altre azioni da eseguire quando cambia lo stato della connessione
  if (isOnline) {
    console.log('Connessione ripristinata');
    // Sincronizza i dati se necessario
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-messages');
      });
    }
  } else {
    console.log('Connessione persa');
    // Mostra un messaggio all'utente
  }
}

// Aggiungi listener per gli eventi online e offline
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Controlla lo stato iniziale della connessione
updateOnlineStatus();

// Esporta le funzioni per l'uso in altri file
window.taoleiaPWA = {
  installPWA,
  closePWAPrompt,
  updateOnlineStatus
};