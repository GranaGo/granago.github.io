/* ==========================================================================
   SERVICE WORKER - GRANÁGO (WORKBOX FINAL)
   ========================================================================== */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_VERSION = 'v2.5'; // Subimos versión

if (workbox) {
  console.log(`[SW] Workbox activo - Versión ${CACHE_VERSION}`);

  workbox.core.setCacheNameDetails({
    prefix: 'granago',
    suffix: CACHE_VERSION
  });

  // Forzar activación inmediata
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // -------------------------------------------------------------------------
  // 1. FILTRO DE SEGURIDAD (La clave para arreglar el error de Adsense)
  // -------------------------------------------------------------------------
  // Esta función decide qué cacheamos. Si no es nuestro, lo ignoramos.
  const matchCallback = ({url, request}) => {
    // Si el dominio no es el nuestro (ej: google ads, tailwind cdn), NO cachear.
    if (url.origin !== self.location.origin) {
      return false; 
    }
    // Si es nuestro, cacheamos documentos, scripts, estilos y manifest
    return request.destination === 'document' ||
           request.destination === 'script' ||
           request.destination === 'style' ||
           request.destination === 'manifest';
  };

  workbox.routing.registerRoute(
    matchCallback,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'granago-core',
    })
  );

  // -------------------------------------------------------------------------
  // 2. IMÁGENES (Solo las nuestras)
  // -------------------------------------------------------------------------
  workbox.routing.registerRoute(
    ({request, url}) => {
      // Ignorar imágenes externas (píxeles de rastreo de google, etc)
      if (url.origin !== self.location.origin) return false;
      return request.destination === 'image';
    },
    new workbox.strategies.CacheFirst({
      cacheName: 'granago-img',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Días
        }),
      ],
    })
  );

  // -------------------------------------------------------------------------
  // 3. EXCEPCIÓN: Fuentes de Google (Estas son seguras)
  // -------------------------------------------------------------------------
  workbox.routing.registerRoute(
    ({url}) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts',
    })
  );

} else {
  console.log(`[SW] Error al cargar Workbox`);
}