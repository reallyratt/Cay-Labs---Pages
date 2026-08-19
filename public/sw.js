// Service Worker for Pages (Offline PWA + Android / Windows Widgets)
const CACHE_NAME = 'pages-app-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-512-maskable.png',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/widgets/note-widget.json',
  '/widgets/note-widget-data.json'
];

// Install: Cache app shell & static assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for app assets, Cache-First for static icons, Network-First with Cache fallback for navigation
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Skip non-GET and chrome-extension requests
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  // Navigation requests (HTML documents)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Static images, icons, and fonts -> Cache First
  if (
    req.destination === 'image' ||
    req.destination === 'font' ||
    req.url.includes('.png') ||
    req.url.includes('.svg') ||
    req.url.includes('.jpg') ||
    req.url.includes('.woff2')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // General assets (JS, CSS, JSON) -> Stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// PWA Widget lifecycle event handlers (for Android / Windows PWA Widgets)
self.addEventListener('widgetinstall', (event) => {
  event.waitUntil(renderWidget(event.widget));
});

self.addEventListener('widgetresume', (event) => {
  event.waitUntil(renderWidget(event.widget));
});

self.addEventListener('widgetclick', (event) => {
  if (event.action === 'openNote') {
    event.waitUntil(
      clients.openWindow(event.data?.noteUrl || '/')
    );
  } else if (event.action === 'newNote') {
    event.waitUntil(
      clients.openWindow('/?action=new')
    );
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
