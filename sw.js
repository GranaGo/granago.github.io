/* ===============================================================
   GRANÁGO - SERVICE WORKER (SIN WORKBOX) - API + CACHE BUSTING
   =============================================================== */

const CACHE_VERSION = 'v5.2'; // Tu script update-cache-version lo actualizará
const STATIC_CACHE = `granago-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `granago-dynamic-${CACHE_VERSION}`;
const API_CACHE = `granago-api-${CACHE_VERSION}`;

// Archivos esenciales (editorializa con los tuyos)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/styles.css",
  "/js/main.js",
  "/js/transporte.js",
  "/imagenes/Logo192x192.png",
  "/imagenes/Logo512x512.png",
  "/imagenes/cocheAparcado.webp",
  "/imagenes/Eventos.webp",
  "/imagenes/Fondo.webp",
  "/imagenes/infoTransporte.webp",
  "/imagenes/Logo.ico",
  "/imagenes/Logo.png",
  "/imagenes/Logo.webp",
  "/imagenes/lugarInteres.webp",
  "/imagenes/ORA.webp",
  "/imagenes/paypal.svg",
  "/imagenes/Transporte.webp",
  "/imagenes/ZBE.webp",
  "/imagenes/zbeMapa.webp",
  "/imagenes/gasolina.webp",
  "/imagenes/parking.webp",
  "/README.md",
];

/* ===============================================================
   INSTALL
   =============================================================== */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

/* ===============================================================
   ACTIVATE
   Eliminar versiones antiguas
   =============================================================== */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.includes(CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

/* ===============================================================
   FETCH
   Estrategias según tipo de recurso
   =============================================================== */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo GET
  if (req.method !== "GET") return;

  // 1. URLs de datos en tiempo real (Movilidad Granada, Metro, Gasolineras, CorsProxy, OSRM)
  // Aplicamos Network First para la frescura de los datos.
  if (
    url.hostname.includes("corsproxy.io") || // Tu proxy principal
    url.hostname.includes("minetur.gob.es") || // Gasolineras (si no usas proxy)
    url.hostname.includes("movilidadgranada.com") || // Cortes, Parkings (si no usas proxy)
    url.hostname.includes("project-osrm.org") || // Rutas (importante Network First)
    url.hostname.includes("mianfg.me") // Tu API Backend
  ) {
    // Usamos Network With Cache Fallback (o Network Only si prefieres no cachear APIs)
    return event.respondWith(networkWithCacheFallback(req));
  }

  // 2. Archivos estáticos del frontend
  if (STATIC_ASSETS.includes(url.pathname)) {
    return event.respondWith(cacheFirst(req, STATIC_CACHE));
  }

  // 3. Google Translate. Debemos dejar que la red lo gestione.
  if (url.hostname.includes("translate.google.com")) {
    return; // Dejamos que vaya a la red (Network Only)
  }

  // 4. Otros recursos: documentos, vistas, scripts… (El fallback general)
  return event.respondWith(networkWithCacheFallback(req));
});

/* ===============================================================
   Estrategia: Cache First (recursos estáticos)
   =============================================================== */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    return caches.match("/index.html");
  }
}

/* ===============================================================
   Estrategia: Network First + fallback cache (para páginas)
   =============================================================== */
async function networkWithCacheFallback(request, cacheName = DYNAMIC_CACHE) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(cacheName);
    // Solo cacheamos si la respuesta es exitosa (ej. 200 OK)
    if (fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    // Si falla, devuelve la caché O la página principal como último recurso
    return cached || caches.match("/index.html");
  }
}

/* ===============================================================
   Estrategia API: Network → Cache (stale-while-revalidate)
   =============================================================== */
async function apiNetworkStaleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);

  // Obtener respuesta en caché (si existe)
  const cached = await cache.match(request);

  // Intentar obtener la versión más reciente
  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch((err) => null);

  // Si hay cache → devolvemos cache y actualizamos por detrás
  if (cached) return cached;

  // Si no hay cache → esperar la red
  return fetchPromise.then((res) => res || new Response("[]"));
}
