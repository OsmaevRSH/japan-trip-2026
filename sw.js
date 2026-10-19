// Service worker «Япония 2026». Версия кэша = хэш сборки; собран 2026-10-19T11:36:35.069Z.
// Свои файлы: отдаём из кэша и параллельно обновляем из сети (stale-while-revalidate).
// Google Fonts: CSS — так же, файлы шрифтов — из кэша (они неизменяемые).
'use strict';
const VERSION = "f1ffea1af8e1";
const CACHE = 'jp26-' + VERSION;
const FONTS = 'jp26-fonts';
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-512-maskable.png"];
const INDEX = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('jp26-') && k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const okToCache = (res) => res && (res.ok || res.type === 'opaque');

function staleWhileRevalidate(event, cacheName, request, key, ignoreSearch) {
  return caches.open(cacheName).then((cache) =>
    cache.match(key, { ignoreSearch }).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (okToCache(res)) return cache.put(key, res.clone()).then(() => res, () => res);
          return res;
        })
        .catch(() => hit || Response.error());
      if (hit) {
        event.waitUntil(network.catch(() => {}));
        return hit;
      }
      return network;
    })
  );
}

function cacheFirst(cacheName, request) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (okToCache(res)) cache.put(request, res.clone());
      return res;
    }))
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (!url.href.startsWith(self.registration.scope)) return;
    if (req.mode === 'navigate') {
      event.respondWith(staleWhileRevalidate(event, CACHE, req, INDEX, true));
    } else {
      event.respondWith(staleWhileRevalidate(event, CACHE, req, req, true));
    }
    return;
  }
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(FONTS, req));
  } else if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(event, FONTS, req, req, false));
  }
});
