// servicework.js
// Single-source version: read APP_VERSION from version.js
importScripts('./version.js'); // exposes global APP_VERSION

// Name cache with the app version so bumping APP_VERSION invalidates old cache
const CACHE_NAME = `dowson-pwa-${APP_VERSION}`;

// Core assets to precache (add more pages/assets here if you want them offline)
const ASSETS = [
  "./",
  "./index.html",
  "./theme.css",
  "./core.js",
  "./manifest.webmanifest",
  "./version.js",

  // Icons
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // activate updated SW immediately
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim(); // control open pages ASAP
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GETs
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Never intercept the worker itself
  if (url.pathname.endsWith("servicework.js")) return;

  // Offline-friendly: for navigations, serve index.html from cache as fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Cache-first for static assets; network fallback; then cache the fresh copy
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
