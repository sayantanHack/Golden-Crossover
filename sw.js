// ============================================================
//  SERVICE WORKER — Golden Crossover PWA
// ============================================================

const CACHE_NAME = 'gc-nifty-v1';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH (Cache-first for assets, network-first for API) ────
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Skip external API calls
  if (url.includes('allorigins') || url.includes('yahoo')) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// ── PUSH NOTIFICATIONS ───────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: '📈 Golden Crossover Alert', body: 'Check the app!' };
  try { data = event.data.json(); } catch(e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192.png',
      badge:   '/icon-96.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/' },
    })
  );
});

// ── NOTIFICATION CLICK ───────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(wins => {
      const existing = wins.find(w => w.url === url && 'focus' in w);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ── BACKGROUND SYNC (for offline crossover checks) ──────────
self.addEventListener('sync', event => {
  if (event.tag === 'check-crossovers') {
    event.waitUntil(checkCrossoversInBackground());
  }
});

async function checkCrossoversInBackground() {
  // Lightweight background check — can be extended
  console.log('[SW] Background crossover sync triggered');
}