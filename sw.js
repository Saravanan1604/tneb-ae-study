/* Offline support for the GitHub Pages copy. Pages and data you open are kept; the app shell and data are
   refreshed from the network when online (network first), book pictures are served from the cache (cache first).
   The cache name changes with every deploy. On an update, every saved file whose content is unchanged (same hash in
   data/files.json) is carried over to the new cache, so an offline save survives updates and only changed files are
   fetched again; pictures never mix old positions with new ones. */
const V = 'ae-20261031202037';
const SHELL = ['./', 'index.html', 'app.js', 'theme.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'data/index.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
const listOf = r => r ? r.clone().json().then(j => new Map(j.f.map(x => [x[0], x[2]]))).catch(() => null) : null;
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const olds = (await caches.keys()).filter(k => k !== V && k.startsWith('ae-'));
    const cur = await caches.open(V);
    let now = null;
    try { const r = await fetch('data/files.json', { cache: 'no-store' }); if (r.ok) { now = await listOf(r); await cur.put('data/files.json', r); } } catch (err) {}
    for (const k of olds) {
      const old = await caches.open(k);
      const was = now && await listOf(await old.match('data/files.json'));
      if (was) {
        for (const [p, h] of now) {
          if (was.get(p) !== h || await cur.match(p)) continue;
          const r = await old.match(p); if (r) await cur.put(p, r);
        }
      }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;           // fonts and anything else: browser default
  const img = /\/img\/|\/sim\/transformers\/(img|az|bk|gate)\//.test(u.pathname);
  e.respondWith(img
    ? caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(k => k.put(e.request, c)); } return res; }))
    : fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(k => k.put(e.request, c)); } return res; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
