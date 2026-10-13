// DigQuest offline support. Change the version number whenever you want phones to drop the old saved copy.
const CACHE = 'digquest-v1';

// Pages saved on first visit. A missing file is skipped, so nothing breaks.
const CORE = [
  '/',
  '/index.html',
  '/secret.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(CORE.map(url => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // leave Google Maps etc. alone

  // Pages: try the internet first so you always see the latest version, fall back to the saved copy.
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/secret.html')))
    );
    return;
  }

  // Everything else (PDF reports, images, CSS): use the saved copy if there is one, otherwise fetch and save it.
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
