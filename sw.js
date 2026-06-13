const CACHE_NAME = 'gsoc-finder-20260509130802';

// Basic caching for offline resilience
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      './',
      'index.html',
      'manifest.json'
    ]))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return new Response(
        JSON.stringify({ error: 'You are offline' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    })
  );
});
