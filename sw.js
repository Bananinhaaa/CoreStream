
const CACHE_NAME = 'corestream-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  'https://cdn.tailwindcss.com'
];

// Instalação: Cacheia o App Shell (essencial para PWA)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('CoreStream: Cacheando App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
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

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora chamadas de API externas e vídeos pesados para evitar erros de cache
  if (
    url.hostname.includes('googleapis') || 
    url.hostname.includes('google') || 
    url.hostname.includes('gstatic') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.includes('/api/')
  ) {
    return;
  }

  // ESTRATÉGIA CRÍTICA PARA PWA NO IOS: 
  // Se for uma navegação (abrir o app ou dar refresh), serve o index.html do cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Para outros arquivos (scripts, estilos, imagens), usa Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
