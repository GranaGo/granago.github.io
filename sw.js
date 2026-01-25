const CACHE_NAME = 'granago-v1769341291';

const palos = ["clubs", "diamonds", "hearts", "spades"];
const valores = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "jack",
  "queen",
  "king",
  "ace",
];
const cartasAssets = [];

palos.forEach((palo) => {
  valores.forEach((valor) => {
    cartasAssets.push(`./images/CartasSVG/${valor}_of_${palo}.svg`);
  });
});

cartasAssets.push("./images/CartasSVG/traseraCartas.svg");

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
  "./images/Logo.png",
  "./images/Logo192x192.png",
  "./images/Logo512x512.png",
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
  "./data/radares.json",
  "./data/palabras.json",
  "./data/trivial.json",
  "./data/taxi_granada.kml",
  "./data/parkings.csv",
  "./data/encadenadas.json",
  "./data/zbe.geojson",
  "./data/velocidad.json",
  "./data/carrilbici.kml",
  "./data/parkingbici.kml",
  "./data/espprovincias.json",
  "./data/municipiosgranada.json",
  "./data/paisesmundo.json",
  ...cartasAssets,
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
              cache.put(event.request, networkResponse.clone());
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
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
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