/* Dowson Farms — service-worker.js (v11.0.3 RESET)
   Purpose: delete ALL old caches and stop intercepting requests so the app
   always loads the freshest index.html/app.js from GitHub Pages.
   Later we can add back a simple, clean cache strategy on top of this.
*/

const SW_VERSION = 'v11.0.3-reset';

// Delete every cache on install, then activate immediately
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => caches.delete(n)));
  })());
  self.skipWaiting();
});

// Claim control and also re-delete caches on activate (belt + suspenders)
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => caches.delete(n)));
    try { await self.clients.claim(); } catch {}
  })());
});

// No fetch handler = no interception = always network-controlled.
// (This is deliberate for the reset.)