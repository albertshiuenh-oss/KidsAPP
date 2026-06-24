/* ─── KidsAPP Service Worker ─── */
const CACHE = 'kidsapp-v1';
const SHELL = ['/KidsAPP/', '/KidsAPP/index.html'];

/* Install: cache the app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

/* Activate: purge old caches */
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

/* Fetch: network-first for Firebase calls, cache-first for the app shell */
self.addEventListener('fetch', e => {
  const url = e.request.url;

  /* Always go to network for Firebase / Google APIs */
  if (
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com')
  ) {
    return; /* let browser handle it normally */
  }

  /* App shell: cache-first, fall back to network, then to cached index.html */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(response => {
          if (
            response.ok &&
            e.request.method === 'GET' &&
            url.startsWith(self.location.origin)
          ) {
            const copy = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/KidsAPP/index.html'));
    })
  );
});
