// ===== Dowson Farms PWA — Service Worker (v6.11) =====
const CACHE_VERSION = 'df-v6.15-fresh';

// Build correct base path (works on GitHub Pages like /USERNAME/REPO/)
var SW_URL = new URL(self.location.href);
var BASE_PATH = SW_URL.pathname.replace(/service-worker\.js$/, '');

// Core files (network-first)
var CORE = [
  'index.html',
  'app.js',
  'styles.css',
  'manifest.webmanifest'
].map(function(p){ return BASE_PATH + p; });

// Static assets (cache-first)
var ASSETS = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/logo.png'
].map(function(p){ return BASE_PATH + p; });

var PRECACHE = CORE.concat(ASSETS);

// Install: precache latest
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){ return cache.addAll(PRECACHE); })
  );
  // No skipWaiting; app will request it via banner button.
});

// Activate: purge old caches and claim
self.addEventListener('activate', function(event) {
  event.waitUntil((async function(){
    var keys = await caches.keys();
    await Promise.all(keys.map(function(k){ if (k !== CACHE_VERSION) return caches.delete(k); }));
  })());
  self.clients.claim();
});

// Helpers
async function networkFirst(request) {
  try {
    var fresh = await fetch(new Request(request, { cache: 'no-store' }));
    var cache = await caches.open(CACHE_VERSION);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    var cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}
async function cacheFirst(request) {
  var cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  var res = await fetch(request);
  var cache = await caches.open(CACHE_VERSION);
  cache.put(request, res.clone());
  return res;
}

// Fetch
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = new URL(req.url);

  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    var indexReq = new Request(BASE_PATH + 'index.html', { cache: 'reload' });
    event.respondWith(networkFirst(indexReq));
    return;
  }

  if (CORE.indexOf(url.pathname) !== -1) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

// Message from app to activate waiting worker
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});