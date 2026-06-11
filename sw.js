// ═══════════════════════════════════════════════════════
//  sw.js — Service Worker
//  Cache dos arquivos estáticos para uso offline
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'futura-estoque-v1';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/config.js',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

// Instala e faz cache dos arquivos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// Limpa caches antigos ao ativar nova versão
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: network first, fallback para cache
self.addEventListener('fetch', e => {
  // Não intercepta chamadas para o GAS (sempre precisa de rede)
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza o cache com a resposta mais recente
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
