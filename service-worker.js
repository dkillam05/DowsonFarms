/* Dowson Farms SW — v12.x — single-source version via ?v= */
const VER = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE = `df-cache-${VER}`;

// Cache strategy: network-first for HTML; cache-first for static
const CORE = [
  './', 'index.html', 'styles.css', 'app.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/logo.png'
];

self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{})));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('df-cache-') && k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    // Notify pages that this version is active
    const all = await self.clients.matchAll({includeUncontrolled:true, type:'window'});
    all.forEach(c=>c.postMessage({type:'SW_ACTIVE', version:VER}));
  })());
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);

  // HTML: network-first (falls back to cache)
  if (req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html')){
    e.respondWith((async ()=>{
      try{
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      }catch{
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) || cache.match('index.html');
      }
    })());
    return;
  }

  // Static: cache-first
  e.respondWith((async ()=>{
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req).catch(()=>null);
    if (res && res.ok) cache.put(req, res.clone());
    return res || new Response('', {status:504});
  })());
});

// Allow page to tell the SW to activate immediately
self.addEventListener('message', (e)=>{
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});