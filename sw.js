const CACHE_NAME = 'granago-v1770567559';

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./css/leaflet.css",
  "./css/remixicon.css",
  "./js/main.js",
  "./js/leaflet.js",
  "./js/leaflet.markercluster.js",
  "./js/leaflet-omnivore.min.js",
  "./js/html2canvas.min.js",
  "./images/logo.png",
  "./images/logo512.png",
  "./images/logo192.png",
  "./fonts/remixicon.woff2",
  "./images/gifs/cat.gif",
  "./images/gifs/rat.gif",
  "./images/gifs/seal.gif",
  "./images/gifs/pepo.gif",
  "./images/gifs/top.gif",
  "./images/gifs/homer.gif",
  "./images/gifs/racoon.gif",
  "./images/gifs/dog.gif"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-cargando App Shell y Datos...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Borrando cache antigua:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});