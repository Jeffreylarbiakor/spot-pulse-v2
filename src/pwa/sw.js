// Service worker — stub for M0. Full caching strategy lands in M4.
const CACHE = 'spot-pulse-v2-shell-v1';
const SHELL = ['/', '/src/styles/tokens.css', '/src/styles/components.css', '/src/main.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
