// Dowson Farms Service Worker — v12.2.11
const CACHE_NAME = 'dowsonfarms-v12.2.11';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/login.html',
  '/icons/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for html, cache-first for static
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Always try network first for HTML (so login.html & index.html stay fresh)
  if (req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});