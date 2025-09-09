// Service Worker — Dowson Farms v10.14.7 (fresh filename to force install)
const CACHE = 'df-cache-v10.14.7';

// Precache core assets (use relative paths for GitHub Pages project sites)
const PRECACHE = [
  './',
  './index.html?v=10.14.7',
  './app.js?v=10.14.7',
  './styles.css?v=10500',
  './manifest.webmanifest',
  './icons/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: false })
      .then((cached) => cached || fetch(event.request))
  );
});
