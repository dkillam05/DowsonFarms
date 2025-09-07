// === Bump this on every release to bust the cache ===
const CACHE_VERSION = 'df-v6.5-fresh';

// Build correct base path (works on GitHub Pages like /USERNAME/REPO/)
const SW_URL = new URL(self.location.href);
const BASE_PATH = SW_URL.pathname.replace(/service-worker\.js$/, '');

// Paths we always want to keep fresh
const CORE = [
  'index.html',
  'login.html',      // login page
  'app.js',
  'login.js',        // login logic
  'styles.css',
  'manifest.webmanifest'
].map(p => BASE_PATH + p);

// Static assets that rarely change
const ASSETS = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/logo.png'
].map(p => BASE_PATH + p);

const PRECACHE = [...CORE, ...ASSETS];

// ----- Install: precache latest files (do NOT skipWaiting here)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  // keep the new SW in "waiting" so your UI can prompt refresh
});

// ----- Activate: clean old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

// Helper: network-first fetch with cache fallback (for HTML/JS/CSS/manifest)
async function networkFirst(request) {
  try {
    const fresh = await fetch(new Request(request, { cache: 'no-store' }));
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

// Helper: cache-first with network fallback (for icons, etc.)
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

  // 1) Navigation requests (HTML): always deliver latest index/login HTML
  if (req.mode === 'navigate') {
    const isLogin = url.pathname.endsWith('login.html');
    const htmlReq = new Request(BASE_PATH + (isLogin ? 'login.html' : 'index.html'), { cache: 'reload' });
    event.respondWith(networkFirst(htmlReq));
    return;
  }

  // 2) Core files (JS/CSS/manifest): network-first
  if (CORE.includes(url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) Everything else (icons/images): cache-first
  event.respondWith(cacheFirst(req));
});

// ----- Message: app tells us to activate waiting SW now (when user taps Refresh)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});