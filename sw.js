/* Offline support for the GitHub Pages copy. Pages and data you open are kept; the app shell and data are
   refreshed from the network when online (network first), book pictures are served from the cache (cache first).
   The cache name changes with every deploy, so an update never mixes old pictures with new positions. */
const V = 'ae-20261031154540';
const SHELL = ['./', 'index.html', 'app.js', 'theme.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'data/index.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;           // fonts and anything else: browser default
  const img = /\/img\/|\/sim\/transformers\/(img|az|bk|gate)\//.test(u.pathname);
  e.respondWith(img
    ? caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(k => k.put(e.request, c)); } return res; }))
    : fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(k => k.put(e.request, c)); } return res; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
