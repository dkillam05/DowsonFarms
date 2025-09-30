const CACHE_NAME = "dowsonfarms-cache-v1";
const CORE_ASSETS = [
  "index.html",
  "assets/css/theme.css",
  "assets/data/menus.js",
  "js/core.js",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});