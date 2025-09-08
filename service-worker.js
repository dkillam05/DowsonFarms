// UI-only build; minimal SW for fresh assets
const CACHE_VERSION = 'df-v9.3';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
  })());
  self.clients.claim();
});

async function networkFirst(req){
  try{
    const fresh = await fetch(new Request(req, {cache:'no-store'}));
    const cache = await caches.open(CACHE_VERSION);
    cache.put(req, fresh.clone());
    return fresh;
  }catch{
    const cached = await caches.match(req, {ignoreSearch:true});
    if (cached) return cached;
    throw new Error('Offline and not cached.');
  }
}
async function cacheFirst(req){
  const cached = await caches.match(req, {ignoreSearch:true});
  if (cached) return cached;
  const res = await fetch(req);
  const cache = await caches.open(CACHE_VERSION);
  cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst('./index.html'));
    return;
  }
  if (CORE.includes(url.pathname) || CORE.includes('.'+url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(cacheFirst(req));
});