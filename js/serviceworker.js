/* Dowson Farms — Service Worker (root/serviceworker.js)
   Works with repo structure:
   - assets/css/theme.css
   - assets/data/menus.js
   - assets/icons/...
   - js/core.js, js/version.js, js/ui-nav.js, js/ui-subnav.js
*/

const CACHE_PREFIX = 'df-cache';
const CACHE_VERSION = 'v3';               // bump this when you change static assets
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime`;
const STATIC_CACHE  = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Core “app shell” to precache for instant paint
const STATIC_ASSETS = [
  // Root
  './',
  './index.html',
  './manifest.webmanifest',

  // CSS
  './assets/css/theme.css',

  // JS
  './js/core.js',
  './js/version.js',
  './js/ui-nav.js',
  './js/ui-subnav.js',

  // Data
  './assets/data/menus.js',

  // Icons / PWA
  './assets/icons/icon-192.png',
  './assets/icons/maskable-512.png'
];

// Utility: request classifier
function isHTML(req) {
  return req.mode === 'navigate' ||
         (req.destination === 'document') ||
         (req.headers.get('accept') || '').includes('text/html');
}
function isStaticAsset(req) {
  const d = req.destination;
  return ['style','script','worker','font'].includes(d) ||
         req.url.includes('/assets/css/') ||
         req.url.includes('/assets/data/') ||
         req.url.includes('/js/');
}
function isImage(req) {
  return req.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(new URL(req.url).pathname);
}

/* Install: precache the core shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* Activate: clean up old versions */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith(CACHE_PREFIX) && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* Fetch strategy matrix:
   - HTML/navigation: network-first, fallback to cache, then to a tiny fallback
   - Static assets (css/js/data): cache-first, fallback to network
   - Images: stale-while-revalidate
   - Everything else: pass-through
*/
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  if (isHTML(req)) {
    event.respondWith(htmlNetworkFirst(req));
    return;
  }

  if (isStaticAsset(req)) {
    event.respondWith(staticCacheFirst(req));
    return;
  }

  if (isImage(req)) {
    event.respondWith(imageStaleWhileRevalidate(req));
    return;
  }

  // default: try cache, then network
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});

/* --- Strategies --- */

async function htmlNetworkFirst(req) {
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;

    // final fallback: cached home (works for offline direct loads)
    const home = await caches.match('./index.html');
    return home || new Response('<!doctype html><title>Offline</title><h1>Offline</h1>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function staticCacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  const res = await fetch(req);
  const cache = await caches.open(STATIC_CACHE);
  cache.put(req, res.clone());
  return res;
}

async function imageStaleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req).then(res => {
    cache.put(req, res.clone());
    return res;
  }).catch(() => cached);

  return cached || fetchPromise;
}