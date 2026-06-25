const CACHE_NAME = 'gsoc-finder-v4';
const CRITICAL_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'src/styles.css',
  'src/js/org.js',
  'src/js/app.js',
  'src/js/githubAnalyzer.js',
  'src/js/skillExtractor.js',
  'src/js/recommender.js',
  'src/js/recommendation-ui.js',
  'src/components/footer.html',
  'src/js/footer.js',
  'src/assets/icon-512.png'
];

const OPTIONAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Install critical assets first
      await cache.addAll(CRITICAL_ASSETS);

      // Try to cache optional assets individually, catching errors so they don't break install
      await Promise.all(
        OPTIONAL_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.status === 200 || response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[ServiceWorker] Failed to precache optional asset:', url, err);
          }
        })
      );
    }).then(() => globalThis.skipWaiting())
  );
});

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Install critical assets first
      await cache.addAll(CRITICAL_ASSETS);

      // Try to cache optional assets individually, catching errors so they don't break install
      await Promise.all(
        OPTIONAL_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.status === 200 || response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[ServiceWorker] Failed to precache optional asset:', url, err);
          }
        })
      );
    }).then(() => globalThis.skipWaiting())
  );
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => globalThis.clients.claim())
  );
});

globalThis.addEventListener('fetch', (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return; // Ignore unparseable URLs
  }
  if (event.request.method && event.request.method !== 'GET') return;
  if (url.protocol && url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Network-First for API calls and data fetches.
  // /api/github keys stay query-sensitive (each repo slug differs).
  // /data/issues.json is fetched with ?v=<timestamp> busters in app.js;
  // normalise to the canonical path so every bust hits the same cache entry
  // and the offline fallback actually works.
  if (url.pathname.includes('/api/github') || url.pathname.includes('/data/issues.json')) {
    const cacheKey = url.pathname.includes('/data/issues.json')
      ? new Request(url.origin + url.pathname)  // strip query string
      : event.request;                           // keep query for GitHub API

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy));
          }
          return response;
        })
        .catch(() => caches.match(cacheKey).then((res) => res || new Response('{"error":"offline"}', {
          status: 503, headers: { 'Content-Type': 'application/json' }
        })))
    );
  } else {
    // Stale-While-Revalidate for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('index.html').then((r) => r || new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333}h1{font-size:1.5rem;text-align:center;padding:2rem}</style></head><body><h1>You are offline.<br>Some content may not be available.</h1></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            ));
          }
          return caches.match(event.request).then((r) => r || new Response('{"error":"offline"}', {
            status: 503, headers: { 'Content-Type': 'application/json' }
          }));
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
