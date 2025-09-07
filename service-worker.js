// Bump CACHE_VERSION on any deploy to force updates.
const CACHE_VERSION = 'df-v1.0.0';
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

// Cache-first for same-origin, network fallback; pass-through for cross-origin APIs.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET and same-origin.
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const res = await fetch(request);
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, res.clone());
      return res;
    } catch (err) {
      // Optional: return fallback page/image if desired
      return cached || Response.error();
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
