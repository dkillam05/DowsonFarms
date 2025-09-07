// === Bump this on every release to bust the cache ===
const CACHE_VERSION = 'df-v6.5-fresh';

const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest'
];

const ASSETS = [
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo.png'
];

const PRECACHE = [...CORE, ...ASSETS];

// Install: cache assets (do NOT skipWaiting here)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  // no self.skipWaiting();
});

// Activate: remove old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

// Fetch: same-origin GETs cache-first, then network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const res = await fetch(request);
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, res.clone());
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});

// Message: app tells us to activate the waiting SW now
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});