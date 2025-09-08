// === Bump this on every release to bust the cache ===
const CACHE_VERSION = 'df-v8.0-fresh';

// Build a base path that works on GitHub Pages and root hosting
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/?$/, '/');
function join(p) { return (p === '' ? SCOPE_PATH : SCOPE_PATH + p); }

// Precache lists (use pathnames)
const CORE = [
  '',                // the scope root (for "/")
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest'
].map(join);

const ASSETS = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/logo.png'
].map(join);

const PRECACHE = [...CORE, ...ASSETS];

// Install (no skipWaiting)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
});

// Activate: clear old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

// Helpers
async function networkFirst(request) {
  try {
    const fresh = await fetch(new Request(request, { cache: 'no-store' }));
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, fresh.clone());
    return fresh;
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

  // Only same-origin GET
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  const path = url.pathname;

  // Navigation → index (network-first)
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(join('index.html')));
    return;
  }

  // Core files → network-first
  const isCore =
    path === join('').slice(0, -1) || // scope root
    path === join('index.html') ||
    path === join('app.js') ||
    path === join('styles.css') ||
    path === join('manifest.webmanifest');

  if (isCore) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Everything else → cache-first
  event.respondWith(cacheFirst(req));
});

// Promote waiting SW when the app asks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});