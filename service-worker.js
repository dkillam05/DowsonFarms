// === Bump on every release ===
const CACHE_VERSION = 'df-v10.6-fresh';

const CORE = [
  './',
  './index.html',
  './login.html',
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

// Install (cache everything; do NOT skipWaiting so the banner can appear)
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(PRECACHE)));
});

// Activate: purge old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

// Strategies
async function networkFirst(req) {
  try {
    const res = await fetch(new Request(req, { cache: 'no-store' }));
    const cache = await caches.open(CACHE_VERSION);
    cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    throw new Error('Offline and not cached');
  }
}
async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(req);
  const cache = await caches.open(CACHE_VERSION);
  cache.put(req, res.clone());
  return res;
}

// Fetch
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Direct login navigations through network-first
  if (req.mode === 'navigate' && /\/login\.html?$/.test(url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }

  // App HTML navigations → always fetch latest index
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(new Request('./index.html', { cache: 'reload' })));
    return;
  }

  // Core files network-first
  if (CORE.includes(url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Everything else cache-first
  event.respondWith(cacheFirst(req));
});

// Promote waiting SW when app asks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});