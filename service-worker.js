// === Bump on every release ===
const CACHE_VERSION = 'df-v10.13.2-hot';

// Precache only the static shell (DO NOT include app.js/styles.css)
const CORE = [
  './',
  './index.html',
  './login.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(CORE)));
  // We allow immediate takeover so users don't have to close all tabs
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

// ---------- Strategies ----------
async function networkFirst(req) {
  try {
    // cache: 'reload' forces a fresh request and bypasses HTTP cache
    const res = await fetch(new Request(req, { cache: 'reload' }));
    const cache = await caches.open(CACHE_VERSION);
    cache.put(req, res.clone());
    return res;
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

// ---------- Routing ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // 1) Navigations: always get the newest app shell
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(new Request('./index.html', { cache: 'reload' })));
    return;
  }

  // 2) Versioned assets or our main bundles => network-first
  //    (anything with ?v= OR exactly app.js/styles.css)
  const isVersioned = url.searchParams.has('v');
  const isAppAsset = /\/(app\.js|styles\.css)$/.test(url.pathname);
  if (isVersioned || isAppAsset) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) Everything else (icons/images/etc) => cache-first
  event.respondWith(cacheFirst(req));
});

// Promote waiting SW when app asks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});