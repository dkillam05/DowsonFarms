// === Bump this on EVERY release to bust the SW cache ===
const CACHE_VERSION = 'df-v9.7-fresh';

// Build paths (works on root or GitHub Pages subpaths)
const SW_URL = new URL(self.location.href);
const BASE_PATH = SW_URL.pathname.replace(/service-worker\.js$/, '');

const CORE = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest'
].map(p => BASE_PATH + p);

const ASSETS = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/logo.png'
].map(p => BASE_PATH + p);

const PRECACHE = [...CORE, ...ASSETS];

// ----- Install: cache latest files (do NOT call skipWaiting here)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
});

// ----- Activate: purge old caches and take control
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

// ----- Fetch routing
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only same-origin GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // 1) Navigations → always fetch latest index (network-first)
  if (req.mode === 'navigate') {
    const indexReq = new Request(BASE_PATH + 'index.html', { cache: 'reload' });
    event.respondWith(networkFirst(indexReq));
    return;
  }

  // 2) Core files → network-first so updates land immediately
  if (CORE.includes(url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) Everything else (icons/images) → cache-first
  event.respondWith(cacheFirst(req));
});

// ----- Promote waiting SW when app asks (user taps Refresh banner)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});