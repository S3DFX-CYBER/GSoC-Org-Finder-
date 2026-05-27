const CACHE_NAME = 'gsoc-finder-v1';

const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'src/styles.css',
  'src/js/app.js',
  'agent/scripts/orgs.js',
  'src/js/githubAnalyzer.js',
  'src/js/skillExtractor.js',
  'src/js/recommender.js',
  'src/js/recommendation-ui.js',
  'src/assets/og-image.jpeg',
  'src/assets/icon-192.png',
  'src/assets/icon-512.png',
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  globalThis.skipWaiting();
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('gsoc-finder-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  globalThis.clients.claim();
});

globalThis.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(globalThis.location.origin)) return;

  // Never cache /api/ routes — always hit the network
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response?.ok || response.type === 'opaque') {
          return response;
        }
        const url = new URL(event.request.url);
        if (!url.search) {
          const cloned = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
          );
        }
        return response;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('index.html');
      }
    })
  );
});