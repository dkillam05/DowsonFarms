// === Bump this on every release to bust the cache ===
const CACHE_VERSION = 'df-v7.3-fresh';

// Build paths
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

// Install (no skipWaiting)
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE)));
});

// Activate: clear old caches, take control
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

// Helpers
async function networkFirst(request) {
  try {
    const res = await fetch(new Request(request, { cache: 'no-store' }));
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw e;
  }
}
async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(request);
  const cache = await caches.open(CACHE_VERSION);
  cache.put(request, res.clone());
  return res;
}

// Fetch routing
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Navigation → index (network-first)
  if (req.mode === 'navigate') {
    const indexReq = new Request('./index.html', { cache: 'reload' });
    event.respondWith(networkFirst(indexReq));
    return;
  }
  // Core files → network-first
  if (CORE.includes(url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }
  // Everything else → cache-first
  event.respondWith(cacheFirst(req));
});

// Promote waiting SW when app asks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});