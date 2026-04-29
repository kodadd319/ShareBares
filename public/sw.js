const CACHE_NAME = 'sharebares-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Skip cross-origin requests and Firebase Auth related paths
  if (!url.startsWith(self.location.origin) || 
      url.includes('/__/auth') || 
      url.includes('firebase') ||
      url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
