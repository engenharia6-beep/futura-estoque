// ═══════════════════════════════════════════════════════
//  sw.js — Service Worker
//  Cache dos arquivos estáticos para uso offline
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'futura-estoque-v2';
const STATIC_FILES = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './icon-192.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .catch(() => {}) // não trava se algum arquivo falhar
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('fonts.googleapis.com')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
