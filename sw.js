
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
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('gsoc-finder-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
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
