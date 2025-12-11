/* ==========================================================================
   SERVICE WORKER - GRANÁGO (WORKBOX + AUTO-VERSION)
   ========================================================================== */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// ESTA LÍNEA ES CLAVE: Tu script 'update-cache-version.js' busca esto.
// No la borres ni cambies el formato.
const CACHE_VERSION = 'v2.3';

if (workbox) {
  console.log(`[SW] Workbox cargado - Versión: ${CACHE_VERSION}`);

  // Configuración global de nombres de caché usando tu versión
  workbox.core.setCacheNameDetails({
    prefix: 'granago',
    suffix: CACHE_VERSION, // Aquí usamos la versión automática
    precache: 'precache',
    runtime: 'runtime'
  });

  // Forzar actualización inmediata
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // 1. Caché para HTML, CSS, JS, JSON (StaleWhileRevalidate)
  workbox.routing.registerRoute(
    ({request}) => 
      request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'manifest',
    new workbox.strategies.StaleWhileRevalidate()
  );

  // 2. Caché para Imágenes (CacheFirst con caducidad)
  // Si una falla (404), NO rompe la instalación.
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
        }),
      ],
    })
  );

  // 3. Caché para Fuentes de Google
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate()
  );

} else {
  console.log(`[SW] Fallo al cargar Workbox`);
}