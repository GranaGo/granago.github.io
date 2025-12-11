/* ==========================================================================
   SERVICE WORKER - GRANÁGO
   ==========================================================================
   Gestiona el almacenamiento en caché (Cache API), la instalación de la PWA
   y el funcionamiento offline.
   ========================================================================== */

// --- CONFIGURACIÓN Y CONSTANTES ---

const CACHE_VERSION = 'v2.1';
const CACHE_NAME = "GranáGo-" + CACHE_VERSION;
// Lista de recursos críticos para el funcionamiento offline
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/main.js",
  "./js/transporte.js",
  // Imágenes e Iconos
  "./imagenes/Logo.ico",
  "./imagenes/Logo192x192.png",
  "./imagenes/Logo512x512.png",
  "./imagenes/Fondo.webp",
  "./imagenes/Transporte.webp",
  "./imagenes/ZBE.webp",
  "./imagenes/ORA.webp",
  "./imagenes/Eventos.webp",
  "./imagenes/zbeMapa.webp",
  "./imagenes/cocheAparcado.webp",
  "./imagenes/paypal.svg",
  "./imagenes/lugarInteres.webp",
  "./imagenes/infoTransporte.webp",
  "./imagenes/Logo.png",
  "./imagenes/Logo.webp"
];

/* ==========================================================================
   1. EVENTO INSTALL (INSTALACIÓN)
   ==========================================================================
   Se dispara cuando el navegador detecta un SW nuevo o actualizado.
   Aquí precargamos los recursos estáticos.
   ========================================================================== */
self.addEventListener("install", (event) => {
  
  // ESTRATEGIA DE ACTUALIZACIÓN INMEDIATA:
  // skipWaiting() fuerza al SW "en espera" a activarse inmediatamente,
  // sin esperar a que el usuario cierre todas las pestañas de la app.
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Abriendo caché e instalando recursos...");
      return cache.addAll(urlsToCache);
    })
  );
});

/* ==========================================================================
   2. EVENTO ACTIVATE (ACTIVACIÓN)
   ==========================================================================
   Se dispara una vez que el SW se ha instalado y toma el control.
   Ideal para limpiar cachés antiguas.
   ========================================================================== */
self.addEventListener("activate", (event) => {
  
  // CONTROL DE CLIENTES:
  // clients.claim() permite que el SW tome control de las páginas abiertas
  // inmediatamente, sin necesidad de recargarlas.
  event.waitUntil(self.clients.claim());
});

/* ==========================================================================
   3. EVENTO FETCH (INTERCEPTACIÓN DE RED)
   ==========================================================================
   Intercepta las peticiones HTTP para servir archivos desde la caché
   o ir a la red si no están disponibles.
   ========================================================================== */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // ESTRATEGIA: Cache First (Primero Caché, luego Red)
      // 1. Si el recurso está en caché, lo devolvemos (velocidad/offline).
      if (response) {
        return response;
      }
      // 2. Si no está en caché, hacemos la petición a internet.
      return fetch(event.request);
    })
  );
});

/* ==========================================================================
   4. EVENTOS DE MENSAJERÍA
   ==========================================================================
   Escucha mensajes enviados desde el script principal (main.js/index.html).
   ========================================================================== */
self.addEventListener("message", (event) => {
  // Permite forzar el skipWaiting desde la interfaz de usuario si fuera necesario
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});