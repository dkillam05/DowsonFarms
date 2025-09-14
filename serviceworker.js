// service-worker.js
// Minimal app-shell cache for GitHub Pages / project sites
const CACHE_VERSION = "v1.0.0";            // bump to force refresh
const CACHE_NAME = `dowson-pwa-${CACHE_VERSION}`;

// If your site lives at dkillam05.github.io/DowsonFarms, keep these paths relative ("./").
// If you later move to a custom domain at the root, these still work.
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./version.js",           // if you’re using the version-in-footer setup
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
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
  // Only handle same-origin GET requests
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // Don’t cache the worker itself
  if (req.url.endsWith("service-worker.js")) return;

  // Cache-first with network fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Put a copy in cache for next time (basic/static assets)
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached); // last resort
    })
  );
});

