/* Dowson Farms SW v11.0.0 — simple & safe */

const CACHE_VERSION = 'df-v11.0.1';
const SHELL_URLS = [
  '/', '/index.html',
  '/styles.css?v=11.0.0',
  '/app.js?v=11.0.0',
  '/icons/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    try {
      await cache.addAll(SHELL_URLS);
    } catch (e) { /* ignore offline install errors */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE_VERSION ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // HTML: network-first (so router + latest shell always wins)
  if (req.destination === 'document' || req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, net.clone());
        return net;
      } catch (e) {
        const cache = await caches.open(CACHE_VERSION);
        const cached = await cache.match('/index.html');
        return cached || new Response('<!doctype html><title>Offline</title>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // Assets: stale-while-revalidate
  if (['script','style','image','font'].includes(req.destination)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req);
      const fetchAndUpdate = fetch(req).then(res => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await fetchAndUpdate) || new Response('', { status: 504 });
    })());
    return;
  }
});