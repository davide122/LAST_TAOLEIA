// Nome della cache
const CACHE_NAME = 'taoleia-cache-v1';

// Risorse da mettere in cache durante l'installazione
const STATIC_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/parla.mp4',
  '/sd.mp4',
  '/sfondo.png'
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Gestione delle richieste di rete
self.addEventListener('fetch', (event) => {
  // Ignora le richieste API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Restituisci la risorsa dalla cache se disponibile
        if (response) {
          return response;
        }

        // Altrimenti, fai la richiesta alla rete
        return fetch(event.request)
          .then((response) => {
            // Controlla se la risposta è valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta perché il body può essere consumato solo una volta
            const responseToCache = response.clone();

            // Aggiungi la risposta alla cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Se la richiesta fallisce (offline), mostra la pagina offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Sincronizzazione in background quando la connessione viene ripristinata
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Funzione per sincronizzare i messaggi in background
async function syncMessages() {
  try {
    const messagesQueue = await getMessagesQueue();
    
    if (messagesQueue.length === 0) return;
    
    for (const message of messagesQueue) {
      try {
        // Invia il messaggio al server
        await fetch('/api/taoleia-agent-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
        
        // Rimuovi il messaggio dalla coda dopo l'invio riuscito
        await removeMessageFromQueue(message.id);
      } catch (error) {
        console.error('Errore durante la sincronizzazione del messaggio:', error);
      }
    }
  } catch (error) {
    console.error('Errore durante la sincronizzazione dei messaggi:', error);
  }
}

// Funzioni di utilità per gestire la coda dei messaggi in IndexedDB
async function getMessagesQueue() {
  // Implementazione per recuperare i messaggi da IndexedDB
  return [];
}

async function removeMessageFromQueue(messageId) {
  // Implementazione per rimuovere un messaggio da IndexedDB
}