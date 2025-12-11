/* ===============================================================
   GRANÁGO - SERVICE WORKER (SIN WORKBOX) - API + CACHE BUSTING
   =============================================================== */

const CACHE_VERSION = 'v2.9'; // Tu script update-cache-version lo actualizará
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
];

/* ===============================================================
   INSTALL
   =============================================================== */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
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

/* ===============================================================
   FETCH
   Estrategias según tipo de recurso
   =============================================================== */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo GET
  if (req.method !== "GET") return;

  // 1. APIs de tu backend o externas confiables
  if (url.pathname.includes("/api/") || url.pathname.includes("/ProxyAPI")) {
    return event.respondWith(apiNetworkStaleWhileRevalidate(req));
  }

  // 2. Archivos estáticos del frontend
  if (STATIC_ASSETS.includes(url.pathname)) {
    return event.respondWith(cacheFirst(req, STATIC_CACHE));
  }

  // 3. Otros recursos: documentos, vistas, scripts…
  return event.respondWith(networkWithCacheFallback(req));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
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
    return caches.match("/offline.html");
  }
}

/* ===============================================================
   Estrategia: Network First + fallback cache (para páginas)
   =============================================================== */
async function networkWithCacheFallback(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
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
