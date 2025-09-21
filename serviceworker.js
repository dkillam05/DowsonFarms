/* Dowson Farms — Service Worker (root/serviceworker.js)
   Controls the whole site. Designed for GitHub Pages paths.
   Folder layout:
   - assets/css/theme.css
   - assets/data/menus.js
   - assets/icons/...
   - js/core.js, js/version.js, js/ui-nav.js, js/ui-subnav.js
*/

const CACHE_PREFIX  = 'df-cache';
const CACHE_VERSION = 'v4'; // bump to force a fresh cache after changes
const STATIC_CACHE  = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime`;

// Build absolute URLs relative to this SW’s scope (works under /<repo>/ on GH Pages)
const toURL = (p) => new URL(p, self.registration.scope).toString();

const STATIC_ASSETS = [
  './',                       // repo root
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

  // Icons
  './assets/icons/icon-192.png',
  './assets/icons/maskable-512.png'
].map(toURL);

// Classifiers
function isHTML(req) {
  return req.mode === 'navigate' ||
         req.destination === 'document' ||
         (req.headers.get('accept') || '').includes('text/html');
}
function isStaticAsset(req) {
  const d = req.destination;
  return ['style','script','worker','font'].includes(d) ||
         /\/assets\/css\/|\/assets\/data\/|\/js\//.test(new URL(req.url).pathname);
}
function isImage(req) {
  const url = new URL(req.url).pathname;
  return req.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
}

/* Install: precache app shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* Activate: clear old caches */
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

/* Fetch routing */
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

  event.respondWith(caches.match(req).then(res => res || fetch(req)));
});

/* Strategies */
async function htmlNetworkFirst(req) {
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;

    // Fallback to cached home (use absolute URL)
    const home = await caches.match(toURL('./index.html'));
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

  const fetchPromise = fetch(req)
    .then(res => { cache.put(req, res.clone()); return res; })
    .catch(() => cached);

  return cached || fetchPromise;
}
