/* service-worker.js — Dowson Farms (clean SW)
   Strategy:
   - Derive version from registration URL (?v=11.0.x) for cache-busting
   - Precache core app shell (index.html, app.js, styles.css, icons, manifest)
   - Navigation requests → always return index.html (SPA fallback, prevents 404)
   - Static assets (js/css/img/webmanifest) → cache-first with network update
   - Runtime GETs to same-origin (e.g., JSON) → network-first with fallback
   - Skip Waiting support via postMessage({type:'SKIP_WAITING'})
*/

(() => {
  'use strict';

  // ---------- Version & cache names ----------
  const version = (() => {
    try {
      const url = new URL(self.registration?.scriptURL || self.location.href);
      return (url.searchParams.get('v') || '0').trim();
    } catch {
      return '0';
    }
  })();

  const CACHE_PREFIX = 'df-app';
  const STATIC_CACHE = `${CACHE_PREFIX}-static-v${version}`;
  const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v${version}`;

  // Paths to precache (adjust if your filenames differ)
  // Keep paths relative to SW scope root.
  const PRECACHE_URLS = [
    '/',                     // helps when hosted at site root
    'index.html',
    'login.html',            // shim that redirects to #/login
    'app.js',
    'styles.css',
    'manifest.webmanifest',
    'icons/logo.png',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/apple-touch-icon.png'
  ];

  // ---------- Helpers ----------
  const isNavigation = (request) =>
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
     request.headers.get('accept') &&
     request.headers.get('accept').includes('text/html'));

  const isStaticAsset = (request) => {
    if (request.method !== 'GET') return false;
    try {
      const u = new URL(request.url);
      if (u.origin !== self.location.origin) return false;
      // Treat common static types as cache-first
      return /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|webmanifest|json|txt)$/i.test(u.pathname);
    } catch {
      return false;
    }
  };

  // ---------- Install: precache core shell ----------
  self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        await cache.addAll(PRECACHE_URLS.map((p) => new Request(p, { cache: 'reload' })));
      } catch (e) {
        // Best-effort: some paths (like '/') may fail on subpath hosting; ignore
      }
      // Activate immediately on first load of this version
      await self.skipWaiting();
    })());
  });

  // ---------- Activate: cleanup old caches & take control ----------
  self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
      const names = await caches.keys();
      const keep = new Set([STATIC_CACHE, RUNTIME_CACHE]);
      await Promise.all(
        names.map((n) => (keep.has(n) ? Promise.resolve() : caches.delete(n)))
      );
      await self.clients.claim();
    })());
  });

  // ---------- Message: support SKIP_WAITING ----------
  self.addEventListener('message', (event) => {
    if (!event?.data || typeof event.data !== 'object') return;
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // ---------- Fetch handler ----------
  self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignore non-GET requests
    if (request.method !== 'GET') return;

    // 1) SPA navigation: always serve index.html (cached, then network)
    if (isNavigation(request)) {
      event.respondWith(handleNavigation(request));
      return;
    }

    // 2) Static same-origin assets → cache-first
    if (isStaticAsset(request)) {
      event.respondWith(cacheFirst(request));
      return;
    }

    // 3) Same-origin runtime GET → network-first with runtime cache
    try {
      const url = new URL(request.url);
      if (url.origin === self.location.origin) {
        event.respondWith(networkFirst(request));
      }
      // else: let the request pass through (CDN, APIs, etc.)
    } catch {
      // If URL parsing fails, just let it pass through
    }
  });

  // ---------- Strategies ----------
  async function handleNavigation(request) {
    // Serve the app shell (index.html). Try cache, then network, then a minimal fallback.
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match('index.html');
    if (cached) return cached;

    try {
      const fresh = await fetch('index.html', { cache: 'reload' });
      cache.put('index.html', fresh.clone());
      return fresh;
    } catch {
      return new Response(
        '<!doctype html><title>Offline</title><h1>Offline</h1><p>The app shell is not cached yet.</p>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
      );
    }
  }

  async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;

    try {
      const response = await fetch(request);
      // Only cache ok, same-origin, basic responses
      if (response && response.status === 200 && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    } catch (e) {
      // Last-resort fallback for images/icons: return a 1x1 transparent png
      if (/\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i.test(request.url)) {
        return new Response(
          new Uint8Array([
            // tiny 1x1 transparent PNG
            137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,12,73,68,65,84,8,153,99,0,1,0,0,5,0,1,13,10,42,186,0,0,0,0,73,69,78,68,174,66,96,130
          ]),
          { headers: { 'Content-Type': 'image/png' } }
        );
      }
      throw e;
    }
  }

  async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.status === 200) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch {
      const cached = await cache.match(request, { ignoreVary: true });
      if (cached) return cached;
      // As a last resort, try static cache (in case it was precached)
      const fallback = await caches.match(request, { ignoreVary: true });
      if (fallback) return fallback;
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  }
})();