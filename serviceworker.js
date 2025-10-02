// Dowson Farms — minimal app-shell service worker for GitHub Pages scope /DowsonFarms/
const CACHE = 'df-shell-v1';
const APP_SHELL = [
  '/DowsonFarms/index.html',
  '/DowsonFarms/assets/css/theme.css',
  '/DowsonFarms/assets/css/header.css',
  '/DowsonFarms/assets/css/drawer.css',
  '/DowsonFarms/assets/data/menus.js',
  '/DowsonFarms/assets/data/drawer-menus.js',
  '/DowsonFarms/assets/data/footer-links.js',
  '/DowsonFarms/js/header.js',
  '/DowsonFarms/js/drawer.js',
  '/DowsonFarms/js/footer.js',
  '/DowsonFarms/js/version.js',
  '/DowsonFarms/assets/icons/icon-192.png',
  '/DowsonFarms/assets/icons/icon-512.png',
  '/DowsonFarms/assets/icons/icon-512-maskable.png'
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