// service-worker.js
// Minimal cache for GitHub Pages project site: /DowsonFarms/
const CACHE_VERSION = "v1.0.2"; // <- bump to force updates
const CACHE_NAME = `dowson-pwa-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./version.js",                 // keep if you use version-in-footer
  // Icons (new paths)
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GET requests
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Don't intercept the worker itself
  if (req.url.endsWith("service-worker.js")) return;

  // Cache-first with network fallback, then cache the response
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});

