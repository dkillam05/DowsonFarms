// Dowson Farms Service Worker — cache tied to sw.js?v=<APP.version>

const VERSION = (() => {
  try {
    const u = new URL(self.registration?.scriptURL || self.location.href);
    return new URLSearchParams(u.search).get('v') || 'v0';
  } catch { return 'v0'; }
})();

const CACHE_NAME = `df-cache-${VERSION}`;
const CORE_ASSETS = [
  // Keep paths relative to the site root. Add/remove as needed.
  './',
  './index.html',
  './app.js',
  './styles.css',
  './login.html',
  './icons/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: precache core with the versioned cache name
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: clear ANY older versioned caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategy:
// - HTML/doc requests → network-first (keeps login/index fresh)
// - Static assets (js/css/png/etc) → cache-first
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const accept = req.headers.get('accept') || '';

  // HTML: try network first, fall back to cache
  if (accept.includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Non-HTML: cache-first
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});