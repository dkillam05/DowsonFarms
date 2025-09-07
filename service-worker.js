// === Bump this on every release to bust the cache ===
const CACHE_VERSION = 'df-v3.4';

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

// Install: precache core assets (DO NOT skipWaiting here)
// We want updates to enter "waiting" so the UI banner can prompt refresh.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  // no self.skipWaiting();
});

// Activate: clean old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : Promise.resolve()))
    );
  })());
  self.clients.claim();
});

// Fetch: cache-first for same-origin GET; network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const res = await fetch(request);
      // Cache the new response for next time
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, res.clone());
      return res;
    } catch (err) {
      // Optional: return a fallback page/image here if desired
      return cached || Response.error();
    }
  })());
});

// Message: app tells us to activate the waiting SW now (when user taps Refresh)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});