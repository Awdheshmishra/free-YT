const CACHE_NAME = 'infinity-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/infinity-192.png',
  '/icons/infinity-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('infinity-shell-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PRECACHE_APP') return;
  event.waitUntil((async () => {
    const response = await fetch('/index.html');
    if (!response.ok) throw new Error(`Could not cache the app shell (${response.status}).`);
    const html = await response.text();
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/index.html', new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }));

    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
      .map((match) => match[1]);
    await Promise.all(assets.map(async (asset) => {
      const assetResponse = await fetch(asset);
      if (!assetResponse.ok) throw new Error(`Could not cache app asset ${asset} (${assetResponse.status}).`);
      await cache.put(asset, assetResponse);
    }));
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedPage = await caches.match('/index.html');
        if (cachedPage) return cachedPage;
        throw new Error('Infinity is not available offline yet.');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
