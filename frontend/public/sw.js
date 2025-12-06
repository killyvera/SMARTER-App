// Versión del service worker - se actualiza cuando cambia el archivo
// En producción, esto debería cambiar en cada deploy
const SW_VERSION = 'v2'; // Incrementar este número cuando haya cambios importantes
const BUILD_TIMESTAMP = Date.now().toString();
const APP_VERSION = `${SW_VERSION}-${BUILD_TIMESTAMP}`;

const CACHE_NAME = `smarter-app-${APP_VERSION}`;
const STATIC_CACHE = `smarter-app-static-${APP_VERSION}`;
const API_CACHE = `smarter-app-api-${APP_VERSION}`;

// Detectar si estamos en desarrollo
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Recursos estáticos a cachear (solo en producción)
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  if (IS_DEV) {
    // En desarrollo, solo instalar sin cachear
    console.log('Service Worker: Modo desarrollo - saltando cache inicial');
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Cacheando recursos estáticos');
      // Cachear recursos uno por uno para manejar errores individualmente
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn(`Service Worker: No se pudo cachear ${url} - ${response.status}`);
            })
            .catch((error) => {
              console.warn(`Service Worker: Error al cachear ${url}:`, error.message);
            })
        )
      );
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
            // Eliminar todos los caches antiguos que no coincidan con la versión actual
            const isOldCache = (
              cacheName.startsWith('smarter-app-') || 
              cacheName.startsWith('smarter-app-static-') ||
              cacheName.startsWith('smarter-app-api-')
            ) && !cacheName.includes(APP_VERSION);
            
            return isOldCache;
          })
          .map((cacheName) => {
            console.log('Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Notificar a todos los clientes que el service worker está activo
  return self.clients.claim().then(() => {
    // Enviar mensaje a todos los clientes para que sepan que hay una nueva versión
    return self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version: APP_VERSION,
        });
      });
    });
  });
});

// Escuchar mensajes del cliente para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Función helper para verificar si es un recurso de Next.js
function isNextJsResource(url) {
  return url.pathname.startsWith('/_next/') || 
         url.pathname.startsWith('/static/') ||
         url.searchParams.has('v'); // Next.js agrega ?v=timestamp a los recursos
}

// Estrategia: Cache First para estáticos, Network First para API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // En desarrollo, no cachear recursos de Next.js
  if (IS_DEV && isNextJsResource(url)) {
    event.respondWith(fetch(request).catch(() => {
      // Si falla, devolver respuesta vacía para evitar errores
      return new Response('', {
        status: 200,
        headers: {
          'Content-Type': url.pathname.endsWith('.css') ? 'text/css' : 
                         url.pathname.endsWith('.js') ? 'application/javascript' : 
                         'text/plain'
        }
      });
    }));
    return;
  }

  // Recursos estáticos: Cache First (solo en producción)
  if (
    !IS_DEV &&
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
        return fetch(request)
          .then((response) => {
            // Solo cachear si la respuesta es exitosa
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseToCache).catch((error) => {
                  // Silenciar errores de cache en desarrollo
                  if (!IS_DEV) {
                    console.warn('Error al cachear recurso:', request.url, error);
                  }
                });
              });
            }
            return response;
          })
          .catch((error) => {
            // Si falla el fetch, intentar del cache
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Si no hay cache, devolver respuesta vacía para evitar errores
              return new Response('', {
                status: 200,
                headers: {
                  'Content-Type': request.url.endsWith('.css') ? 'text/css' : 
                                 request.url.endsWith('.js') ? 'application/javascript' : 
                                 'text/plain'
                }
              });
            });
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
          // Solo cachear respuestas exitosas
          if (response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache).catch(() => {
                // Silenciar errores de cache
              });
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
          // Solo cachear respuestas exitosas
          if (response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(() => {
                // Silenciar errores de cache
              });
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
  event.respondWith(
    fetch(request).catch(() => {
      // Si falla, devolver respuesta vacía para evitar errores
      return new Response('', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
