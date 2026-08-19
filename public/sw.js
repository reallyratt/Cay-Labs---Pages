// Official PWABuilder Offline Service Worker with Full App Shell & Widget Support
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE_NAME = 'pwabuilder-pages-v3';
const offlineFallbackPage = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-512-maskable.png',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/widgets/note-widget.json',
  '/widgets/note-widget-data.json'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Precache essential assets and offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell & offline fallback');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate and clean previous caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Enable Navigation Preload if supported
if (self.workbox && workbox.navigationPreload && workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Fetch handler: Navigation Preload + Stale-While-Revalidate + Cache Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests and http/https schemes
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  // Navigation (HTML Pages)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) return preloadResp;

        const networkResp = await fetch(req);
        if (networkResp && networkResp.status === 200) {
          const copy = networkResp.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, copy);
        }
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResp = await cache.match(req) || await cache.match('/index.html') || await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
    return;
  }

  // Static Media & Icons (Cache-First)
  if (
    req.destination === 'image' ||
    req.destination === 'font' ||
    req.url.endsWith('.png') ||
    req.url.endsWith('.jpg') ||
    req.url.endsWith('.svg') ||
    req.url.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResp;
        });
      })
    );
    return;
  }

  // Scripts, Stylesheets, and other assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const copy = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResp;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// PWA Widgets event handlers (for Android / Windows PWA Widgets)
self.addEventListener('widgetinstall', (event) => {
  event.waitUntil(renderWidget(event.widget));
});

self.addEventListener('widgetresume', (event) => {
  event.waitUntil(renderWidget(event.widget));
});

self.addEventListener('widgetclick', (event) => {
  if (event.action === 'openNote') {
    event.waitUntil(clients.openWindow(event.data?.noteUrl || '/'));
  } else if (event.action === 'newNote') {
    event.waitUntil(clients.openWindow('/?action=new'));
  }
});

async function renderWidget(widget) {
  if (!widget) return;
  try {
    const templateResponse = await caches.match('/widgets/note-widget.json') || await fetch('/widgets/note-widget.json');
    const template = await templateResponse.text();
    const dataResponse = await caches.match('/widgets/note-widget-data.json') || await fetch('/widgets/note-widget-data.json');
    const data = await dataResponse.text();

    await self.widgets.updateByTag(widget.definition.tag, {
      template,
      data
    });
  } catch (err) {
    console.warn('[SW] Widget render notice:', err);
  }
}
