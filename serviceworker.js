// Farm Vista — minimal app-shell service worker for GitHub Pages scope /FarmVista/
const CACHE = 'df-shell-v1';
const APP_SHELL = [
  '/FarmVista/index.html',
  '/FarmVista/assets/css/theme.css',
  '/FarmVista/assets/css/header.css',
  '/FarmVista/assets/css/drawer.css',
  '/FarmVista/assets/data/menus.js',
  '/FarmVista/assets/data/drawer-menus.js',
  '/FarmVista/assets/data/footer-links.js',
  '/FarmVista/js/header.js',
  '/FarmVista/js/drawer.js',
  '/FarmVista/js/footer.js',
  '/FarmVista/js/version.js',
  '/FarmVista/assets/icons/icon-192.png',
  '/FarmVista/assets/icons/icon-512.png',
  '/FarmVista/assets/icons/icon-512-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (APP_SHELL.some(p => req.url.includes(p))) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
  } else {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});