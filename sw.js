const CACHE_NAME = 'granago-v1767276075';

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
  "./js/panzoom.min.js",
  "./images/Logo192x192.png",
  "./images/Logo512x512.png",
  "./images/mapa_zbe.webp",
  "./fonts/remixicon.woff2",
  "./data/metro/paradas.json",
  "./data/metro/colores.json",
  "./data/metro/rutas.json",
  "./data/metro/horarios.json",
  "./data/urbano/paradas.json",
  "./data/urbano/colores.json",
  "./data/urbano/rutas.json",
  "./data/urbano/horarios.json",
  "./data/interurbano/paradas.json",
  "./data/interurbano/colores.json",
  "./data/interurbano/rutas.json",
  "./data/interurbano/horarios.json",
  "./data/poi_final.geojson",
  "./data/camaras_granada.kml",
  "./data/aparcamiento_limitado_granada.kml",
  "./data/zonas_restringidas.kml",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
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

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
