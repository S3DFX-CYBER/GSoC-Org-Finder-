/* global BUILD_CACHE_VERSION */
const CACHE_VERSION = (typeof BUILD_CACHE_VERSION !== 'undefined') ? BUILD_CACHE_VERSION : 'v' + new Date().toISOString().slice(0,10).replaceAll('-', '');

// Cache naming
const STATIC_CACHE_NAME = `gsoc-finder-static-${CACHE_VERSION}`;

// Cache expiration: 7 days
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Critical assets to precache (loaded in index.html order)
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'offline.html',
  'src/styles.css',
  'src/js/app.js',
  'src/js/org.js',
  'agent/scripts/orgs.js',
  'src/js/githubAnalyzer.js',
  'src/js/skillExtractor.js',
  'src/js/recommender.js',
  'src/js/recommendation-ui.js',
  'src/assets/icon-512.png'
];

// Install: precache all critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        STATIC_ASSETS.map(url =>
          fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
            throw new Error(`Failed: ${url}`);
          }).catch(err => {
            console.warn('Precache failed for:', url, err.message);
          })
        )
      );
      return cache;
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that don't match current version
          if (cacheName.startsWith('gsoc-finder-') && !cacheName.includes(CACHE_VERSION)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => globalThis.clients.claim())
  );
});

// Check if cache is expired
async function isCacheExpired(cache, request) {
  const cachedResponse = await cache.match(request);
  if (!cachedResponse) return true;

  const dateHeader = cachedResponse.headers.get('date');
  if (!dateHeader) return true;

  const cachedTime = new Date(dateHeader).getTime();
  const age = Date.now() - cachedTime;
  return age > MAX_AGE_MS;
}

// Stale-while-revalidate: serve cached immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchAndCache = async () => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok && request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (_) {
      // Return cached if available
      if (cachedResponse) return cachedResponse;
      // For navigation requests without cache, show offline page
      if (request.mode === 'navigate') {
        const offlinePage = await caches.match('offline.html');
        return offlinePage || new Response('Offline', { status: 503 });
      }
      return new Response('Offline', { status: 503 });
    }
  };

  if (cachedResponse) {
    // Immediately return cached, then update in background
    fetchAndCache();
    return cachedResponse;
  }

  return fetchAndCache();
}

// Cache-first: check expiration, revalidate if stale
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    if (!(await isCacheExpired(cache, request))) {
      return cachedResponse;
    }
    // Expired - try to update in background
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
      return cachedResponse;
    } catch (_) {
      // Return stale cache if network fails
      return cachedResponse;
    }
  }

  // No cache or expired - fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (e) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Handle all fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin (except API)
  if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) return;

  // API: stale-while-revalidate for instant feel with background updates
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Static assets: cache-first with expiration
  if (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font' ||
      request.url.includes('/src/') ||
      request.url.includes('/agent/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation (HTML): stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});
