/* /serviceworker.js (ROOT)
   Uses /js/version.js to derive cache version
   Expects repo structure:
   - assets/css/theme.css
   - assets/data/menus.js
   - assets/icons/...
   - js/core.js, js/version.js, js/ui-nav.js, js/ui-subnav.js
*/

// 1) Pull the version from the same file the pages use
// NOTE: version.js defines window.DF_VERSION; on SW we read self.DF_VERSION.
try { importScripts('./js/version.js'); } catch (e) { /* ignore */ }

// ⚠️ IMPORTANT: prefer DF_VERSION, but fall back to APP_VERSION if present.
const SW_VERSION    = (self.DF_VERSION || self.APP_VERSION || 'v0'); // e.g. v8.0.2
const CACHE_PREFIX  = 'df-cache';
const STATIC_CACHE  = `${CACHE_PREFIX}-static-${SW_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-rt-${SW_VERSION}`;

// 2) App shell to precache
const STATIC_ASSETS = [
  // root
  './',
  './index.html',
  './manifest.webmanifest',

  // styles
  './assets/css/theme.css',

  // scripts
  './js/version.js',
  './js/core.js',
  './js/ui-nav.js',
  './js/ui-subnav.js',

  // data
  './assets/data/menus.js',

  // icons
  './assets/icons/icon-192.png',
  './assets/icons/maskable-512.png',
];

// Helpers
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

// 3) Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  // We’ll activate immediately so pages don’t wait
  self.skipWaiting();
});

// 4) Activate: drop old versions and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => k.startsWith(CACHE_PREFIX) && ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map(k => caches.delete(k))
      );
      await self.clients.claim();
      // Let open pages know we’re active (optional hook your page listens for)
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        try { client.postMessage({ type: 'DF_SW_ACTIVATED' }); } catch (_) {}
      }
    })()
  );
});

// 5) Fetch strategies
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // same-origin only
  if (url.origin !== self.location.origin) return;

  if (isHTML(req)) {
    event.respondWith(htmlNetworkFirst(req));
    return;
  }
  if (isStatic(req)) {
    event.respondWith(staticCacheFirst(req));
    return;
  }
  if (isImage(req)) {
    event.respondWith(imageStaleWhileRevalidate(req));
    return;
  }

  // default
  event.respondWith(caches.match(req).then(res => res || fetch(req)));
});

// Optional: allow page to force activation even if skipWaiting wasn’t called.
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- strategies ---
async function htmlNetworkFirst(req) {
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    const rt = await caches.open(RUNTIME_CACHE);
    rt.put(req, fresh.clone());
    return fresh;
  } catch {
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
  const st = await caches.open(STATIC_CACHE);
  st.put(req, res.clone());
  return res;
}

async function imageStaleWhileRevalidate(req) {
  const rt = await caches.open(RUNTIME_CACHE);
  const cached = await rt.match(req);
  const fetchPromise = fetch(req).then(res => {
    rt.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}