/* ─── KidsAPP Service Worker v2 ─── */
const CACHE = 'kidsapp-v2';   // ← 版本號升為 v2，強制清除舊快取
const SHELL = ['/KidsAPP/', '/KidsAPP/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com')
  ) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(response => {
          if (response.ok && e.request.method === 'GET' && url.startsWith(self.location.origin)) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/KidsAPP/index.html'));
    })
  );
});
