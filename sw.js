/* ==========================================================================
   SERVICE WORKER - GRANÁGO (WORKBOX + ADS FIX)
   ========================================================================== */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// MANTENER ESTO EXACTO para tu script update-cache-version.js
const CACHE_VERSION = 'v2.5';

if (workbox) {
  console.log(`[SW] Workbox activo - ${CACHE_VERSION}`);

  // Configuración de nombres de caché
  workbox.core.setCacheNameDetails({
    prefix: 'granago-app',
    suffix: CACHE_VERSION
  });

  // Activar inmediatamente
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // 1. REGLA PRINCIPAL: HTML, JS, CSS, JSON
  // SOLUCIÓN AL ERROR: Solo cacheamos archivos de NUESTRO dominio.
  // Ignoramos Google Ads (googlesyndication) y scripts externos.
  workbox.routing.registerRoute(
    ({request, url}) => {
      // Si el archivo no viene de mi propio servidor, LO IGNORO.
      if (url.origin !== self.location.origin) return false;

      return request.destination === 'document' ||
             request.destination === 'script' ||
             request.destination === 'style' ||
             request.destination === 'manifest';
    },
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'core-assets',
    })
  );

  // 2. REGLA IMÁGENES
  workbox.routing.registerRoute(
    ({request, url}) => {
      // Solo imágenes propias (evita cachear píxeles de rastreo externos)
      if (url.origin !== self.location.origin) return false;
      return request.destination === 'image';
    },
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
        }),
      ],
    })
  );

  // 3. EXCEPCIÓN: Fuentes de Google (Estas SÍ queremos cachearlas)
  // Son seguras y no dan el error de los anuncios.
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts',
    })
  );

} else {
  console.log(`[SW] Error cargando Workbox`);
}