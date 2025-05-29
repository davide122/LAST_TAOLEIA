// Nome della cache
const CACHE_NAME = 'taoleia-cache-v2';
const STATIC_CACHE = 'taoleia-static-v2';
const DYNAMIC_CACHE = 'taoleia-dynamic-v2';
const OFFLINE_URL = '/offline.html';

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
  '/sfondo.png',
  '/site.webmanifest',
  '/robots.txt',
  '/css/main.css',
  '/js/main.js'
];

// Risorse che vogliamo precaricare ma che non sono critiche
const PRECACHE_RESOURCES = [
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installazione');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('[Service Worker] Precaricamento risorse statiche');
          return cache.addAll(STATIC_RESOURCES);
        }),
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          console.log('[Service Worker] Precaricamento risorse dinamiche');
          // Precarica alcune risorse ma non bloccare l'installazione se falliscono
          PRECACHE_RESOURCES.forEach(url => {
            fetch(url).then(response => {
              if (response.ok) {
                cache.put(url, response);
              }
            }).catch(() => {
              console.log('[Service Worker] Impossibile precaricare:', url);
            });
          });
          return Promise.resolve();
        })
    ])
    .then(() => {
      console.log('[Service Worker] Installazione completata');
      return self.skipWaiting();
    })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Attivazione');
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Eliminazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Attivazione completata');
      return self.clients.claim();
    })
  );
});

// Gestione delle richieste di rete
self.addEventListener('fetch', (event) => {
  // Ignora le richieste API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Strategia per le richieste di navigazione (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[Service Worker] Fallback alla pagina offline per navigazione');
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Strategia Cache First per risorse statiche
  if (isStaticAsset(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              console.log('[Service Worker] Risorsa statica non disponibile offline');
              // Potremmo restituire un placeholder o un'immagine di fallback
            });
        })
    );
    return;
  }

  // Strategia Network First con fallback alla cache per altre risorse
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        console.log('[Service Worker] Fallback alla cache per:', event.request.url);
        return caches.match(event.request);
      })
  );
});

// Funzione per verificare se una risorsa è statica
function isStaticAsset(url) {
  const staticExtensions = [
    '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.mp4', '.webm'
  ];
  
  return staticExtensions.some(ext => url.endsWith(ext)) || 
         STATIC_RESOURCES.some(resource => url.endsWith(resource));
}

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