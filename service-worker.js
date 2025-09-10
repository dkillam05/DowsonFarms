/* =========================================================
   Dowson Farms PWA — Service Worker
   Version: v11.0.0
   Notes:
   - Precache only the static shell (NO app.js/styles.css)
   - Navigations → network-first for latest shell
   - Versioned (?v=...) and app.js/styles.css → network-first
   - Everything else (icons/images/etc.) → cache-first
   - Supports SKIP_WAITING message for instant updates
   ========================================================= */

// Bump this on every release
const CACHE_VERSION = 'df-v11.0.0';

// App shell core (keep minimal)
const CORE = [
  './',
  './index.html',
  './login.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo.png'
];

/* ---------------- Install / Activate ---------------- */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE))
  );
  // Immediate takeover allowed so users don’t need to close tabs
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : null))
    );
  })());
  self.clients.claim();
});

/* ---------------- Cache Strategies ---------------- */

async function networkFirst(req) {
  try {
    // cache: 'reload' bypasses HTTP cache to truly check network
    const fresh = await fetch(new Request(req, { cache: 'reload' }));
    const cache = await caches.open(CACHE_VERSION);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req, { ignoreSearch: false });
    if (cached) return cached;
    throw new Error('Offline and not cached');
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: false });
  if (cached) return cached;
  const res = await fetch(req);
  const cache = await caches.open(CACHE_VERSION);
  cache.put(req, res.clone());
  return res;
}

/* ---------------- Routing ---------------- */

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GETs
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // 1) Navigations: always get the newest app shell (index.html)
  if (req.mode === 'navigate') {
    event.respondWith(
      networkFirst(new Request('./index.html', { cache: 'reload' }))
    );
    return;
  }

  // 2) Versioned assets (?v=) or main bundles → network-first
  const isVersioned = url.searchParams.has('v');
  const isAppAsset = /\/(app\.js|styles\.css)$/.test(url.pathname);
  if (isVersioned || isAppAsset) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) Everything else (icons/images/etc.) → cache-first
  event.respondWith(cacheFirst(req));
});

/* ---------------- Messages ---------------- */

// Promote waiting SW when the app asks
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});