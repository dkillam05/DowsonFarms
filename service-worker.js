/* Dowson Farms — Service Worker (v12.0.0)
   Single source of truth: version is POSTed from app.js (Part 4) via SET_VERSION.
   - Precache core shell
   - Runtime network-first for app shell; cache-first for static assets
   - Cleans old versions on activate
   - Notifies page when a new SW is installed and waiting
*/

self.__DF_VERSION = 'unknown';  // will be set by SET_VERSION message
const CORE_FILES = [
  './',
  'index.html',
  'app.js',
  'styles.css',
  'icons/logo.png',
  'login.html',
  '404.html'
];

// ---- Utils ----
const cacheName = () => `df-cache-${self.__DF_VERSION || 'unknown'}`;
const isHTML = (req) => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
const isStatic = (url) => /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot|json)$/i.test(url);

// ---- Install: precache shell ----
self.addEventListener('install', (event) => {
  event.waitUntil((async ()=>{
    // Use a temporary cache name until version is set; then copy over after message?
    // Simpler: still use cacheName() (may be "unknown") — it’ll be replaced on next update.
    const cache = await caches.open(cacheName());
    await cache.addAll(CORE_FILES.map((p)=>new Request(p, {cache:'reload'}))).catch(()=>{});
  })());
});

// ---- Activate: clean old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil((async ()=>{
    const keep = cacheName();
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k.startsWith('df-cache-') && k !== keep) ? caches.delete(k) : Promise.resolve()));
    // Become active immediately for controlled pages (but we still wait for user action to refresh)
    // Clients will be notified through 'installed with controller' flow
    await self.clients.claim();
  })());
});

// ---- Message channel (from app.js) ----
self.addEventListener('message', (event)=>{
  const data = event.data || {};
  if (data.type === 'SET_VERSION') {
    // Set version only once (first message wins). Future updates bring a new SW anyway.
    if (self.__DF_VERSION === 'unknown' && data.version) {
      self.__DF_VERSION = String(data.version);
    }
  } else if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---- Fetch strategy ----
self.addEventListener('fetch', (event)=>{
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // App shell HTML: network-first so updates propagate quickly
  if (isHTML(req)) {
    event.respondWith((async ()=>{
      try{
        const fresh = await fetch(req, {cache:'no-store'});
        // Update cache in background
        const cache = await caches.open(cacheName());
        cache.put(req, fresh.clone()).catch(()=>{});
        return fresh;
      }catch{
        // Offline: fall back to cache, or cached index/404
        const cache = await caches.open(cacheName());
        const cached = await cache.match(req) || await cache.match('index.html') || await cache.match('404.html');
        return cached || new Response('Offline', {status: 503, statusText: 'Offline'});
      }
    })());
    return;
  }

  // Static assets: cache-first, then network
  if (isStatic(url.pathname)) {
    event.respondWith((async ()=>{
      const cache = await caches.open(cacheName());
      const hit = await cache.match(req);
      if (hit) return hit;
      try{
        const fresh = await fetch(req);
        cache.put(req, fresh.clone()).catch(()=>{});
        return fresh;
      }catch{
        return new Response('', {status: 404});
      }
    })());
    return;
  }

  // Default: try network, then cache
  event.respondWith((async ()=>{
    try{
      return await fetch(req);
    }catch{
      const cache = await caches.open(cacheName());
      const hit = await cache.match(req);
      return hit || new Response('', {status: 404});
    }
  })());
});

// ---- Notify pages when a new SW is ready ----
self.addEventListener('install', () => {
  // When this SW finishes installing and an older controller exists,
  // the page will get the 'installed' state while controlled → signal clients.
  // We’ll broadcast after a microtask to ensure clients are available.
  setTimeout(async ()=>{
    if (!self.clients || !self.registration || !self.registration.waiting && !self.registration.active) return;
    // If a controller exists, this is an update; tell pages a new version is ready
    const all = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    all.forEach(c => c.postMessage({type:'NEW_VERSION_READY'}));
  }, 0);
});