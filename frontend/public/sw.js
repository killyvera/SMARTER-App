const CACHE_NAME = 'smarter-app-v1';
const STATIC_CACHE = 'smarter-app-static-v1';
const API_CACHE = 'smarter-app-api-v1';

// Recursos estáticos a cachear
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Cacheando recursos estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            console.log('Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia: Cache First para estáticos, Network First para API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Recursos estáticos: Cache First
  if (
    request.method === 'GET' &&
    (url.origin === location.origin) &&
    (url.pathname.startsWith('/_next/static') ||
      url.pathname.startsWith('/static') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.woff2'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // API calls: Network First
  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({ error: 'Sin conexión y sin cache' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // HTML: Network First con fallback a cache
  if (request.method === 'GET' && request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/').then((indexResponse) => {
              return indexResponse || new Response('Sin conexión', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' },
              });
            });
          });
        })
    );
    return;
  }

  // Por defecto: Network only
  event.respondWith(fetch(request));
});


