/*
 * Cradlen Admin service worker (hand-rolled, bundler-agnostic).
 *
 * Caching strategy:
 *   - Hashed static assets (/_next/static, icons, images)  -> cache-first
 *   - Page navigations                                     -> network-first, fall back to cache, then /offline
 *   - Everything authenticated/dynamic (/api/*) and non-GET -> bypass the SW entirely (always network)
 *
 * We deliberately never cache /api/* responses: this is an auth-gated admin
 * dashboard and serving stale account/payment data offline would be both
 * misleading and a security risk.
 */

const VERSION = 'v1';
const CACHE = `cradlen-admin-${VERSION}`;
const OFFLINE_URL = '/offline';

// Minimal app-shell core pre-cached on install.
const CORE_ASSETS = [
  OFFLINE_URL,
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Use { cache: 'reload' } so install never seeds from the HTTP cache.
      await Promise.all(
        CORE_ASSETS.map((url) =>
          cache
            .add(new Request(url, { cache: 'reload' }))
            .catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Lets the page tell a waiting worker to take over immediately (update flow).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/.test(
      url.pathname,
    )
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever touch same-origin GET requests.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache authenticated / dynamic API traffic.
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for hashed/static assets.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // Network-first for navigations, with cached shell then /offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
          return res;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return offline || Response.error();
        }
      })(),
    );
  }
});
