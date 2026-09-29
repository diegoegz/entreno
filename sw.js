// Service worker: permite abrir la app sin señal. Red primero (para recibir actualizaciones), caché si no hay red.
const CACHE = 'entreno-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // el script de Google no se cachea
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // si la red tarda más de 3 s (señal mala del gimnasio) se usa la copia local
      const res = await Promise.race([fetch(e.request), new Promise((_, rej) => setTimeout(() => rej('timeout'), 3000))]);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || (await cache.match('./index.html'));
    }
  })());
});
