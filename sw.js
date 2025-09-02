// basic offline-first service worker
const CACHE = 'lane-runner-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then(networkRes => {
      if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
        cache.put(req, networkRes.clone());
      }
      return networkRes;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
