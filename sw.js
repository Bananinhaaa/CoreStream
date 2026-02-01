
const CACHE_NAME = 'corestream-v5';

// Estratégia de Cache: Network First para garantir dados novos, fallbacks para offline.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Não cacheia vídeos nem chamadas de API externas
  if (
    request.method !== 'GET' ||
    url.pathname.endsWith('.mp4') ||
    url.hostname.includes('google') ||
    url.hostname.includes('supabase')
  ) {
    return;
  }

  // Network First, fallback to cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Se for uma navegação e não tiver cache, serve o index
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
