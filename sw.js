
const CACHE_NAME = 'corestream-v3';
const STATIC_ASSETS = [
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Adiciona recursos individualmente para que a falha de um não interrompa o registro
      return Promise.allSettled(
        STATIC_ASSETS.map(asset => cache.add(asset))
      );
    })
  );
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
  const url = new URL(event.request.url);

  // CRÍTICO: Ignorar interceptação para APIs externas e arquivos de mídia pesados
  // Isso garante que chamadas ao Gemini e Google Services nunca fiquem presas em cache
  if (
    url.hostname.includes('googleapis') || 
    url.hostname.includes('google') || 
    url.hostname.includes('gstatic') ||
    url.pathname.endsWith('.mp4')
  ) {
    return; // Deixa o navegador processar a requisição de rede padrão
  }

  // Estratégia Stale-While-Revalidate para arquivos da Interface do Usuário
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
      }).catch(() => cachedResponse); // Fallback silencioso para o cache em caso de erro de rede

      return cachedResponse || fetchPromise;
    })
  );
});
