/* /serviceworker.js  (ROOT) — lean, stable, no update-button hooks */

// Try to read the app version for cache scoping; fall back to "v0"
try { importScripts('./js/version.js'); } catch (e) {}
const SW_VERSION    = (typeof self !== 'undefined' && (self.DF_VERSION || self.APP_VERSION)) || 'v0';
const CACHE_PREFIX  = 'df-cache';
const STATIC_CACHE  = `${CACHE_PREFIX}-static-${SW_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-rt-${SW_VERSION}`;

// Keep this list small & deterministic.
// (Everything else is fetched on demand under the runtime cache.)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/theme.css',
  './js/version.js',
  './js/core.js',
  './js/ui-nav.js',
  './js/ui-subnav.js',
  './assets/data/menus.js',
  // Icons
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

/* ---------- Helpers ---------- */
function isHTML(req) {
  return req.mode === 'navigate' ||
         req.destination === 'document' ||
         (req.headers.get('accept') || '').includes('text/html');
}
function isStatic(req) {
  const d = req.destination;
  return ['style','script','worker','font'].includes(d) ||
         req.url.includes('/assets/css/') ||
         req.url.includes('/assets/data/') ||
         req.url.includes('/js/');
}
function isImage(req) {
  return req.destination === 'image' ||
         /\.(png|jpe?g|gif|webp|svg)$/i.test(new URL(req.url).pathname);
}

/* ---------- Install ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS))
  );
  // Activate new SW immediately (but we do NOT message the page)
  self.skipWaiting();
});

/* ---------- Activate ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Clean old cache buckets
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(CACHE_PREFIX) && ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
        .map((k) => caches.delete(k))
    );
    // Take control of open pages
    await self.clients.claim();
    // No postMessage to clients — stay quiet to avoid any app-side reactions
  })());
});

/* ---------- Fetch ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  if (isHTML(req))   { event.respondWith(htmlNetworkFirst(req)); return; }
  if (isStatic(req)) { event.respondWith(staticCacheFirst(req)); return; }
  if (isImage(req))  { event.respondWith(imageStaleWhileRevalidate(req)); return; }

  // Default: cache-then-network fallback
  event.respondWith(
    caches.match(req).then((res) => res || fetch(req))
  );
});

/* ---------- Messages (kept minimal, optional) ---------- */
// We keep this so a future admin tool can call SKIP_WAITING explicitly,
// but nothing in the app is wired to do that now.
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ---------- Strategies ---------- */
async function htmlNetworkFirst(req) {
  try {
    // Always prefer fresh HTML so navigation reflects latest app shell
    const fresh = await fetch(req, { cache: 'no-store' });
    const rt = await caches.open(RUNTIME_CACHE);
    rt.put(req, fresh.clone());
    return fresh;
  } catch {
    // Offline fallback
    const cached = await caches.match(req);
    if (cached) return cached;
    const home = await caches.match('./index.html');
    return home || new Response('<!doctype html><h1>Offline</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function staticCacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  try {
    const st = await caches.open(STATIC_CACHE);
    st.put(req, res.clone());
  } catch (_) {}
  return res;
}

async function imageStaleWhileRevalidate(req) {
  const rt = await caches.open(RUNTIME_CACHE);
  const cached = await rt.match(req);
  const fetchPromise = fetch(req)
    .then((res) => { rt.put(req, res.clone()); return res; })
    .catch(() => cached);
  return cached || fetchPromise;
}