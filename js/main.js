/**
 * GRANÁGO - MAIN LOGIC
 * Optimizado: Estructura, rendimiento de renderizado y seguridad de datos.
 */

// ======================================================================
// 1. CONFIGURACIÓN E IMPORTACIONES GLOBALES
// ======================================================================
const API_BASE_URL = "https://movgr.apis.mianfg.me";

import {
  // Asegura que las variables globales estén disponibles
  ORA_DATA,
  METRO_NAMES,
  dUrb,
  dInt,
  dMet,
  ALL_ROUTES,
  ALL_SCHEDULES,
  ICONS,
  POI_DATA,
  POI_LAYERS_CONFIG,
} from "./transporte.js"; // Asegura que las variables globales estén disponibles

// ==========================================
// 2. VARIABLES DE ESTADO Y DATOS ESTÁTICOS
// ==========================================

// 2.1. BASE DE DATOS ESTÁTICA (ORA, COLORES Y TRANSPORTE)
// ------------------------------------------
// Variable global para almacenar el idioma (asume 'es' por defecto)
let currentLanguage = "es";

// 2.2. VARIABLES DE ESTADO DE MAPAS Y NAVEGACIÓN
// ------------------------------------------
// Variables para la navegación en Puntos de Interés
let puntosUserMarker = null; // Marcador del usuario en mapPuntos
let puntosRouteControl = null; // Control de ruta (línea azul)
let navigationWatchId = null; // ID del watchPosition para detectar llegada
const ARRIVAL_THRESHOLD = 30; // Distancia en metros para considerar "llegada"
let cocheWatchId = null; // Para guardar el ID del rastreo del GPS

let mapPuntos = null;
let puntosLayerControl = null;
let puntosLayerGroups = {}; // Guardará { 'hotel': L.LayerGroup, 'parque': L.LayerGroup, ... }

// Variables para gestionar la ubicación del usuario
let userMarker = null;
let userAccuracyCircle = null;
let userLocationLatLng = null; // Guardará la última posición conocida

// Variables de estado para el mapa de Transporte
let mapTransporte = null;
let layers = {
  urbano: null,
  inter: null,
  metro: null,
};

// Variables de estado para Cortes de Tráfico
let mapCortes = null;
let cortesLayerGroup = null; // Grupo de capas para limpiar marcadores fácilmente
let allCortesEventos = []; // Aquí guardaremos todos los eventos descargados

// Variables de estado para el mapa de Mi Coche
let mapCoche = null;
let cocheMarker = null;
let rutaControl = null; // Para guardar la referencia a la ruta dibujada
let userCurrentMarker = null; // Nuevo marcador para la ubicación actual

// Variables de estado para Búsqueda en Mapa de Transporte
let currentMapSearchTerm = "";

// Variables de estado para el Módulo de Información de Transporte
let mapInfoTransporte = null;
let currentInfoLine = null;
let currentInfoMode = null;

// 2.3. DATOS ESTÁTICOS Y CONSTANTES
// ------------------------------------------
// NOTA: Para no sobrecargar la respuesta, he dejado solo los primeros y últimos elementos de los arrays de datos de parada de transporte.
// En un entorno de desarrollo real, se incluiría la totalidad de los arrays dUrb, dInt y dMet.

// SVG Icons (extraídos del index.html para reutilizarlos)
const SVG_ICONS = {
  bus: '<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-9-11c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v4H6V6z"/></svg>',
  metro:
    '<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
  lupa: '<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
  pin: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>',
};

// SVG Icons para favoritos
const SICONS = {
  starSolid:
    '<path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
  starOutline:
    '<path fill="none" stroke="currentColor" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.85L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
};

// Mensaje de Error
const UNAVAILABLE_MESSAGE = "Servicio no disponible actualmente.";

// Mensajes de Confirmación (Multi-idioma)
const CONFIRM_MESSAGES = {
  es: "¿Seguro que quieres borrar la ubicación del coche?",
  en: "Are you sure you want to delete the car's location?",
};

// 2.4. DEFINICIÓN DE SERVICIOS DEL HOME
// ------------------------------------------

const HOME_SERVICES = [
  {
    id: "transporte",
    title: "TRANSPORTE EN TIEMPO REAL",
    desc: "Autobuses urbanos y Metro.",
    img: "imagenes/Transporte.webp",
    alt: "Bus Metro",
    fallback: "Bus+Metro",
  },
  {
    id: "zbe",
    title: "ZONA DE BAJAS EMISIONES",
    desc: "Plano, límites y normativa.",
    img: "imagenes/ZBE.webp",
    alt: "ZBE Granada",
    fallback: "ZBE+Granada",
  },
  {
    id: "ora",
    title: "PARKING ORA",
    desc: "Zonas de Estacionamiento Limitado.",
    img: "imagenes/ORA.webp",
    alt: "ORA Zona Azul",
    fallback: "ORA+Zona+Azul",
  },
  {
    id: "cortes",
    title: "CORTES Y EVENTOS",
    desc: "Mapa con cortes actualizados.",
    img: "imagenes/Eventos.webp",
    alt: "Obras Trafico",
    fallback: "Obras+Trafico",
  },
  {
    id: "coche",
    title: "¿DÓNDE HAS APARCADO?",
    desc: "Guarda la ubicación de tu coche y encuéntralo fácilmente.",
    img: "imagenes/cocheAparcado.webp",
    alt: "Icono de Coche para Aparcamiento",
    fallback: "Aparcar+Coche",
  },
  {
    id: "puntos",
    title: "LUGARES DE INTERÉS",
    desc: "Hoteles, aparcamientos, museos y más.",
    img: "imagenes/lugarInteres.webp",
    alt: "Lugares Interes",
    fallback: "Lugares+Interes",
  },
  {
    id: "info-transporte",
    title: "INFORMACIÓN TRANSPORTE",
    desc: "Rutas, horarios y tarifas detalladas.",
    img: "imagenes/infoTransporte.webp",
    alt: "Información de Transporte",
    fallback: "Info+Transporte",
  },
  {
    id: "gasolineras",
    title: "BUSCADOR DE GASOLINERAS",
    desc: "Localiza la más barata y sus precios en tiempo real.",
    img: "imagenes/gasolina.webp", // Asegúrate de tener una imagen
    alt: "Icono de Surtidor de Gasolina",
    fallback: "Gasolineras+Precios",
  },
];

// ======================================================================
// 3. UTILIDADES GENERALES Y COMPONENTES (UI/HELPERS)
// ======================================================================

// 3.1. GENERACIÓN DINÁMICA DEL HOME
// ------------------------------------------
function renderHomeGrid() {
  const container = document.getElementById("home-grid");
  if (!container) return;

  const html = HOME_SERVICES.map((service) => {
    // Lógica para diferenciar el estilo de la tarjeta "Coche" vs las normales
    let imgContainerClass, imgClass;

    if (service.isSpecial) {
      // Estilo especial Coche (Fondo azul, imagen contenida)
      imgContainerClass =
        "h-32 w-full overflow-hidden bg-blue-50 flex items-center justify-center group-hover:scale-110 transition duration-500";
      imgClass = "h-full w-auto object-contain p-4";
    } else {
      // Estilo estándar (Imagen cover completa)
      imgContainerClass = "h-32 w-full overflow-hidden";
      imgClass =
        "h-full w-full object-cover group-hover:scale-110 transition duration-500";
    }

    return `
        <div onclick="navigateTo('${service.id}')" 
             class="service-card bg-white border border-gray-200 rounded-[1.25rem] cursor-pointer flex flex-col overflow-hidden shadow-lg group text-center">
            <div class="${imgContainerClass}">
                <img 
                    src="${service.img}" 
                    loading="lazy" 
                    alt="${service.alt}"
                    class="${imgClass}"
                    onerror="this.src='https://via.placeholder.com/400x300?text=${service.fallback}'"
                />
            </div>
            <div class="p-4">
                <p class="font-extrabold text-lg leading-tight">${service.title}</p>
                <p class="text-xs text-gray-500 mt-1">${service.desc}</p>
            </div>
        </div>
        `;
  }).join("");

  container.innerHTML = html;
}

// 3.2. FACTORÍA Y UTILS DE MAPAS
// ------------------------------------------
/**
 * FACTORÍA DE MAPAS (Mejorada con ResizeObserver)
 */
function createBaseMap(elementId, center = [37.1773, -3.5986], zoom = 13) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  // 1. Inicializar mapa
  const map = L.map(elementId).setView(center, zoom);

  // 2. Capa base
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // 3. Control de Zoom
  if (map.zoomControl) map.zoomControl.remove();
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // 4. RESIZEOBSERVER (La Magia)
  // Detecta cuando el contenedor cambia de tamaño o se hace visible
  // y fuerza a Leaflet a recalcular sus dimensiones.
  const observer = new ResizeObserver(() => {
    map.invalidateSize();
  });
  observer.observe(element);

  // Guardamos la referencia del observer en el mapa por si necesitamos desconectarlo (opcional, pero limpio)
  map._resizeObserver = observer;

  return map;
}

/**
 * UTILIDAD: Añadir botón de "Mi Ubicación" genérico
 * @param {Object} map - Instancia del mapa Leaflet
 * @param {Function} onClickCallback - Qué hacer al pulsar
 */
function addLocationControl(map, onClickCallback) {
  const LocationControl = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create(
        "div",
        "leaflet-bar leaflet-control leaflet-control-custom"
      );
      // Estilos inline para asegurar consistencia
      Object.assign(container.style, {
        backgroundColor: "white",
        width: "34px",
        height: "34px",
        borderRadius: "4px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: "0 1px 5px rgba(0,0,0,0.65)",
      });
      container.title = "Centrar en mi ubicación";
      // Icono SVG reutilizado
      container.innerHTML =
        '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style="color: #1f2937;"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>';

      container.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        onClickCallback();
      };
      return container;
    },
  });

  new LocationControl({ position: "bottomleft" }).addTo(map);
}

// 3.3. UTILIDADES DE CÓMPUTO Y FORMATO
// ------------------------------------------
// Función auxiliar para obtener color (Sustituir la existente)
function getRouteColorFromStaticData(lineName, mode = "urbano") {
  // CORRECCIÓN ESPECÍFICA PARA 111 y 121
  // Si es Interurbano, forzamos el color VERDE TEAL del Consorcio
  if (mode === "interurbano" && (lineName === "111" || lineName === "121")) {
    return "#999999"; // Color Teal/Verde Consorcio
  }
  // Si es Urbano, forzamos el color GRIS OSCURO de los Búhos
  if (mode === "urbano" && (lineName === "111" || lineName === "121")) {
    return "#525252"; // Color Gris Búho
  }

  // Búsqueda estándar para el resto
  const dataset = mode === "interurbano" ? dInt : dUrb;

  for (const stop of dataset) {
    if (stop.routes && stop.routes.length > 0) {
      const route = stop.routes.find((r) => r.name === lineName);
      if (route) {
        return route.color;
      }
    }
  }
  // Color por defecto si no encuentra nada
  return mode === "urbano" ? "#ef4444" : "#3b82f6";
}

function getContrastColor(hex) {
  // Convierte HEX a RGB
  const bigint = parseInt(hex.substring(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // Calcula el brillo (Luminance)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Devuelve negro o blanco según el brillo
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// Función auxiliar para hacer scroll a una sección
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    // En móviles, queremos que el elemento quede cerca de la parte superior
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 3.4. UTILS DE MARCADORES (ICONOS)
// ------------------------------------------
function createCustomUserIcon(color = "#1e40af", shadow = false) {
  // Icono para la ubicación actual del usuario (círculo azul con punto blanco)
  const shadowStyle = shadow
    ? "filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"
    : "";
  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" style="${shadowStyle}">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="#ffffff"/>
    </svg>`;

  return L.divIcon({
    className: "user-location-pin",
    html: svgHtml,
    iconSize: [30, 30],
    iconAnchor: [15, 15], // Centrado
    popupAnchor: [0, -15],
  });
}

function createCustomCarIcon(color = "#dc2626", shadow = true) {
  // Icono para el coche guardado (pin rojo)
  const shadowStyle = shadow
    ? "filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));"
    : "";
  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" style="${shadowStyle}">
        <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
    </svg>`;

  return L.divIcon({
    className: "car-location-pin",
    html: svgHtml,
    iconSize: [36, 36],
    iconAnchor: [18, 36], // Parte inferior del pin
    popupAnchor: [0, -34],
  });
}

// ======================================================================
// 4. GESTIÓN DE VISTAS Y NAVEGACIÓN (Lógica Principal)
// ======================================================================

// 4.1. FUNCIÓN DE NAVEGACIÓN PRINCIPAL
// ------------------------------------------
if (!window.history.state) {
  window.history.replaceState({ view: "home" }, "Home", " ");
}

window.navigateTo = function (viewId, addToHistory = true) {
  if (typeof detenerNavegacion === "function") {
    detenerNavegacion();
  }
  // 2. NUEVO: DETENER RASTREO GPS DE 'COCHE' SI SALIMOS DE ESA VISTA
  if (viewId !== "coche" && cocheWatchId !== null) {
    navigator.geolocation.clearWatch(cocheWatchId);
    cocheWatchId = null;
    console.log("GPS Coche detenido");
  }

  // 3. NUEVO: DETENER RASTREO GPS DE 'PUNTOS' SI SALIMOS DE ESA VISTA
  if (viewId !== "puntos" && mapPuntos) {
    mapPuntos.stopLocate(); // Función de Leaflet para parar el watch
    console.log("GPS Puntos detenido");
  }

  // Ocultar todas las vistas
  document.querySelectorAll(".view-section").forEach((el) => {
    el.classList.remove("active");
    if (addToHistory) window.scrollTo(0, 0);
  });
  // Mostrar la seleccionada
  const view = document.getElementById(viewId + "-view");
  if (view) view.classList.add("active");

  // Scroll top
  window.scrollTo(0, 0);

  // 3. GESTIÓN DEL HISTORIAL (La magia para el botón atrás)
  if (addToHistory) {
    if (viewId === "home") {
      // Si vamos a HOME, limpiamos la URL
      window.history.pushState({ view: "home" }, "Home", " ");
    } else {
      // Si vamos a una SECCIÓN, añadimos el hash (ej: #transporte)
      window.history.pushState({ view: viewId }, "", `#${viewId}`);
    }
  }
  // Cargas perezosas (Lazy Load)
  if (viewId === "transporte") {
    const select = document.getElementById("metro-stop-select");
    if (select && select.options.length <= 1) loadMetroStops();
    initTransporteMap(); // Inicializar/Actualizar mapa de transporte
    // TRUCO CLAVE: Forzar recálculo de tamaño tras una pequeña pausa
    setTimeout(() => {
      if (mapTransporte) {
        mapTransporte.invalidateSize();
        // Reajustar la vista a todas las paradas si es necesario
        //const activeStops = [...dUrb, ...dMet]; // Tus datos globales
        //if (activeStops.length > 0) {
        //const bounds = new L.featureGroup(
        // activeStops.map((s) => L.marker([s.stop_lat, s.stop_lon]))
        // ).getBounds();
        // mapTransporte.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        // }
        if (layers.urbano || layers.metro) {
          // Esto asegura que si ya cargó datos, se centre bien
        }
      }
    }, 200); // 200ms de retraso
  }
  if (viewId === "ora") {
    renderOraStreets();
  }
  if (viewId === "cortes") {
    initCortesMap();
  }
  if (viewId === "coche") {
    initCocheMap();
    setTimeout(() => {
      if (mapCoche) mapCoche.invalidateSize();
    }, 200);
  }
  if (viewId === "puntos") {
    initPuntosMap();
    setTimeout(() => {
      if (mapPuntos) mapPuntos.invalidateSize();
    }, 200);
  }
  if (viewId === "info-transporte") {
    renderInfoTransporteMenu();
  }
  if (viewId === "gasolineras") {
    initGasolinerasMap();
    setTimeout(() => {
      if (mapGasolineras) mapGasolineras.invalidateSize();
    }, 200);
  }
};

// 4.2. GESTIÓN DE HISTORIAL (popstate)
// ------------------------------------------
window.addEventListener("popstate", function (event) {
  // A. GESTIÓN DE MODALES (Cerrar si están abiertos)
  const readmeModal = document.getElementById("readme-modal");
  const zbeModal = document.getElementById("zbe-modal");
  const confirmModal = document.getElementById("custom-confirm-modal");

  if (readmeModal && !readmeModal.classList.contains("hidden")) {
    hideReadmeModalVisuals();
    return;
  }
  if (zbeModal && !zbeModal.classList.contains("hidden")) {
    if (typeof closeZbeModal === "function") closeZbeModal();
    else zbeModal.classList.add("hidden");
    return;
  }
  if (confirmModal && !confirmModal.classList.contains("hidden")) {
    confirmModal.classList.add("hidden");
    return;
  }

  // B. GESTIÓN INTELIGENTE DE 'INFORMACIÓN TRANSPORTE'
  if (event.state && event.state.view === "info-transporte") {
    // Aseguramos que la vista principal está activa
    navigateTo("info-transporte", false); // false = no añadir otro estado

    const sub = event.state.subview;
    const mode = event.state.mode;

    // 1. Restaurar MODO y LÍNEA si existen en el estado
    if (mode) {
      currentInfoMode = mode;
      if (typeof event.state.lineIndex !== "undefined") {
        const routesData =
          mode === "urbano" ? ALL_ROUTES.urbano : ALL_ROUTES.interurbano;
        if (mode === "metro") {
          currentInfoLine = {
            name: "1",
            long_name: "Albolote - Armilla",
            color: "#10b981",
          };
        } else {
          currentInfoLine = routesData[event.state.lineIndex];
        }
      }
    }

    // 2. Decidir qué renderizar según el sub-nivel
    if (sub === "detail") {
      // Estamos en Tarifas, Mapa, etc. -> Renderizar Línea + Detalle
      // Primero pintamos la línea
      const container = document.getElementById("info-content-container");

      // Header
      const headerHtml = `
            <div class="flex items-center gap-3 mb-4">
                <button onclick="window.history.back()" class="text-gray-500 hover:text-blue-600 font-bold text-sm">← Volver a Líneas</button>
                <span class="text-gray-300">|</span>
                <span class="font-bold text-gray-700">Línea ${currentInfoLine.name}</span>
            </div>`;

      container.innerHTML = headerHtml + renderInfoOptionsHTML(currentInfoLine);

      // Luego activamos el detalle sin pushear historial
      activateInfoOption(event.state.detailType, false);
    } else if (sub === "line") {
      // Estamos viendo una Línea específica -> Renderizar menú de esa línea
      // selectInfoLine maneja el renderizado completo
      if (mode === "metro") {
        // El metro es especial, renderizamos su menú directo
        selectInfoMode("metro", false);
      } else {
        selectInfoLine(mode, event.state.lineIndex, false);
      }
    } else if (sub === "mode") {
      // Estamos viendo la lista de buses (Urbano/Inter) -> Renderizar lista
      selectInfoMode(mode, false);
    } else {
      // Nivel base -> Menú principal
      renderInfoTransporteMenu();
    }
    return;
  }

  // C. GESTIÓN DE VISTAS ESTÁNDAR
  if (event.state && event.state.view) {
    navigateTo(event.state.view, false);

    // === NUEVA LÓGICA: Restaurar el subview de ORA ===
    if (event.state.view === "ora" && event.state.subview) {
      // Ejecutamos la función de switch para asegurar que se pinte el mapa correcto
      setTimeout(() => switchOraMap(event.state.subview), 200);
    }
    // ===============================================
  } else {
    // Si no hay estado, vamos a Home
    navigateTo("home", false);
  }
});

// ======================================================================
// 5. MÓDULO: MAPA ZBE (Zoom y Pan con Eventos)
// ======================================================================

let modalState = {
  scale: 0.25,
  pX: 0,
  pY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  initialDist: 0,
  initialScale: 0.25,
};
let isTicking = false;

window.openZbeModal = function () {
  const modal = document.getElementById("zbe-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  requestAnimationFrame(() => modal.classList.remove("opacity-0"));
  resetModalState();
};

window.closeZbeModal = function () {
  const modal = document.getElementById("zbe-modal");
  if (!modal) return;
  modal.classList.add("opacity-0");
  setTimeout(() => modal.classList.add("hidden"), 300);
};

function resetModalState() {
  modalState = {
    ...modalState,
    scale: 0.5,
    pX: 0,
    pY: 0,
    isDragging: false,
    initialScale: 0.5,
  };
  requestUpdate();
}

function requestUpdate() {
  if (!isTicking) {
    requestAnimationFrame(updateModalTransform);
    isTicking = true;
  }
}

function updateModalTransform() {
  const modalImg = document.getElementById("zbe-modal-img");
  if (modalImg) {
    modalImg.style.transform = `translate3d(${modalState.pX}px, ${modalState.pY}px, 0) scale(${modalState.scale})`;
  }
  isTicking = false;
}

// Lógica de Event Listeners (se configura en DOMContentLoaded)

// ======================================================================
// 6. MÓDULO: GESTIÓN DE FAVORITOS (BUS Y METRO)
// ======================================================================

function getFavorites(type) {
  const key = type === "bus" ? "fav_bus" : "fav_metro";
  return JSON.parse(localStorage.getItem(key)) || [];
}

window.toggleFavorite = function (type, id, name) {
  const key = type === "bus" ? "fav_bus" : "fav_metro";
  let favs = getFavorites(type);
  const exists = favs.find((f) => f.id === id);

  if (exists) {
    favs = favs.filter((f) => f.id !== id);
  } else {
    favs.push({ id, name });
  }

  localStorage.setItem(key, JSON.stringify(favs));

  renderFavorites(type);

  // Actualizar icono visualmente si el elemento existe actualmente
  const btnIcon = document.getElementById(`fav-btn-icon-${type}`);
  if (btnIcon) {
    updateStarIcon(btnIcon, !exists);
  }
};

function updateStarIcon(element, isFav) {
  element.innerHTML = isFav ? SICONS.starSolid : SICONS.starOutline;
  if (isFav) {
    element.classList.add("text-yellow-400");
    element.classList.remove("text-gray-400");
  } else {
    element.classList.add("text-gray-400");
    element.classList.remove("text-yellow-400");
  }
}

window.renderFavorites = function (type) {
  const container = document.getElementById(
    type === "bus" ? "bus-favorites" : "metro-favorites"
  );
  if (!container) return;

  const favs = getFavorites(type);
  container.innerHTML = "";

  const baseClass =
    "cursor-pointer text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 transition-all shadow-sm border max-w-full";
  const colorClass =
    type === "bus"
      ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-100"
      : "bg-green-50 text-green-700 hover:bg-green-100 border-green-100";

  favs.forEach((fav) => {
    const btn = document.createElement("div");
    btn.className = `${baseClass} ${colorClass}`;
    btn.innerHTML = `<span>★ <span class="notranslate">${fav.name}</span></span>`;

    btn.onclick = () => {
      if (type === "bus") {
        document.getElementById("stop-code").value = fav.id;
        searchStop();
      } else {
        document.getElementById("metro-stop-select").value = fav.id;
        searchMetroStop();
      }
    };
    container.appendChild(btn);
  });
};

// ======================================================================
// 7. MÓDULO: BUSQUEDA TRANSPORTE (API)
// ======================================================================

// 7.1. BÚSQUEDA BUS (Con validación de existencia estricta)
// ------------------------------------------
window.searchStop = async function () {
  const stopCode = document.getElementById("stop-code").value.trim();
  const resEl = document.getElementById("bus-results");

  if (!stopCode) {
    resEl.innerHTML =
      '<p class="text-red-500 mt-2 text-center text-sm">Introduce código.</p>';
    return;
  }

  // Spinner de carga
  resEl.innerHTML =
    '<div class="text-center py-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div></div>';

  // 1. INTENTO DE RECUPERAR NOMBRE LOCAL (OFFLINE)
  const paradaLocal = dUrb.find((p) => p.stop_code === stopCode);

  // Inicializamos nombreParada solo si existe en local. Si no, lo dejamos null de momento.
  let nombreParada = paradaLocal ? paradaLocal.stop_name : null;
  let listContent = "";

  try {
    const res = await fetch(`${API_BASE_URL}/bus/llegadas/${stopCode}`);

    // --- NUEVA LÓGICA DE VALIDACIÓN ---
    // Si la API dice explícitamente que no existe (404) Y no la tenemos en local
    if (res.status === 404 && !paradaLocal) {
      resEl.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div class="text-3xl mb-2">🚫</div>
                <p class="text-red-600 font-bold text-sm mb-1">Parada no encontrada</p>
                <p class="text-gray-600 text-xs">El código <b>${stopCode}</b> no existe en el sistema.</p>
            </div>`;
      return; // IMPORTANTE: Detenemos aquí. No se pinta tarjeta ni botón de favoritos.
    }
    // ----------------------------------

    if (!res.ok) throw new Error("Error de red o servicio");
    const data = await res.json();

    // 2. Si la API responde correctamente, actualizamos el nombre (prioridad sobre local)
    if (data.parada?.nombre) {
      nombreParada = data.parada.nombre;
    } else if (!nombreParada) {
      // Si la API devuelve 200 OK pero sin nombre, y no teníamos local, usamos genérico
      nombreParada = `Parada ${stopCode}`;
    }

    if (!data?.proximos?.length) {
      listContent = `<div class="p-4 text-center text-gray-500 text-sm">Sin estimaciones.</div>`;
    } else {
      listContent =
        `<ul class="px-3 pb-1 w-full">` +
        data.proximos
          .map((p) => {
            const line = METRO_NAMES[p.linea?.id] || p.linea?.id || "?";
            const time =
              p.minutos === 0
                ? '<span class="text-red-600 font-black animate-pulse whitespace-nowrap">LLEGANDO</span>'
                : `<span class="text-blue-600 font-bold whitespace-nowrap">${p.minutos} min</span>`;

            const routeColor = getRouteColorFromStaticData(line);
            const textColor = getContrastColor(routeColor);

            const regexRedundancy = new RegExp(
              `^(L[íi]nea\\s+)?${line}\\s*[-]?\\s*`,
              "i"
            );
            const destinoClean = p.destino.replace(regexRedundancy, "").trim();

            return `
          <li class="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 w-full max-w-full">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span style="background-color: ${routeColor}; color: ${textColor};" class="text-xs font-bold px-2 py-1 rounded min-w-[2.5rem] text-center shadow-sm shrink-0 notranslate">
                      ${line} </span>
                  <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-700 text-sm leading-snug break-words notranslate">${destinoClean}</p>
                  </div>
              </div>
              <div class="ml-3 shrink-0 text-right">${time}</div>
          </li>`;
          })
          .join("") +
        `</ul>`;
    }
  } catch (e) {
    // Si hay error de red/servidor (fetch falló) y NO tenemos la parada en local
    // no podemos mostrar la tarjeta porque no tenemos ni el nombre ni la certeza de que existe.
    if (!nombreParada) {
      const currentHour = new Date().getHours();
      const isNightTime = currentHour >= 0 && currentHour < 7;
      const errorIcon = isNightTime ? "🌙" : "⚠️";

      // Mostramos solo mensaje de error, sin tarjeta ni favoritos
      resEl.innerHTML = `<div class="p-4 text-center text-red-500 text-sm font-bold flex flex-col items-center justify-center h-20">
                    <span style="font-size: 1.2em;">${errorIcon} ${UNAVAILABLE_MESSAGE}</span>
                   </div>`;
      return;
    }

    // Si hay error pero SI tenemos datos locales (nombreParada existe), mostramos la tarjeta
    // con el mensaje de error dentro, permitiendo añadir a favoritos.
    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 0 && currentHour < 7;
    const errorIcon = isNightTime ? "🌙" : "⚠️";

    listContent = `<div class="p-4 text-center text-red-500 text-sm font-bold flex flex-col items-center justify-center h-20">
                    <span style="font-size: 1.2em;">${errorIcon} ${UNAVAILABLE_MESSAGE}</span>
                   </div>`;
  }

  // --- RENDERIZADO FINAL (Solo llega aquí si existe en Local o en API) ---

  // Calculamos estado de favoritos
  const isFav = getFavorites("bus").some((f) => f.id === stopCode);
  const starClass = isFav ? "text-yellow-400" : "text-gray-400";
  const starIcon = isFav ? SICONS.starSolid : SICONS.starOutline;

  // Construimos la tarjeta completa
  resEl.innerHTML = `
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm w-full max-w-full">
        <div class="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-100 max-w-full">
            <div class="flex-1 min-w-0 pr-2">
                <p class="font-bold text-gray-700 text-xs uppercase tracking-wide leading-tight break-words notranslate">
                    ${nombreParada}
                </p>
            </div>
            <button onclick="toggleFavorite('bus', '${stopCode}', '${nombreParada}')" class="p-1 hover:bg-gray-200 rounded-full transition shrink-0">
                <svg id="fav-btn-icon-bus" class="w-6 h-6 ${starClass}" viewBox="0 0 24 24">${starIcon}</svg>
            </button>
        </div>
        ${listContent}
    </div>`;
};

// 7.2. BÚSQUEDA METRO (Con favoritos en error)
// ------------------------------------------
window.searchMetroStop = async function () {
  const select = document.getElementById("metro-stop-select");
  const resEl = document.getElementById("metro-results");
  const stopId = select.value;

  if (!stopId) return;

  // Obtenemos el nombre del select directamente (siempre disponible)
  const nombreParada = select.options[select.selectedIndex].text;

  // Spinner
  resEl.innerHTML =
    '<div class="text-center py-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>';

  let listContent = "";

  try {
    const res = await fetch(`${API_BASE_URL}/metro/llegadas/${stopId}`);
    if (!res.ok) throw new Error("Error API");
    const data = await res.json();

    if (!data?.proximos?.length) {
      listContent = `<div class="p-4 bg-gray-50 text-center text-sm text-gray-500">Sin trenes próximos.</div>`;
    } else {
      listContent =
        `<ul class="p-3 w-full">` +
        data.proximos
          .map(
            (p) => `
            <li class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 w-full max-w-full">
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-700 text-sm leading-snug break-words">
                        Hacia <span class="notranslate">${p.direccion}</span>
                    </p>
                </div>
                ${
                  p.minutos === 0
                    ? '<span class="text-red-600 font-black shrink-0 ml-2">LLEGANDO</span>'
                    : `<span class="text-green-600 font-bold shrink-0 ml-2">${p.minutos} min</span>`
                }
            </li>`
          )
          .join("") +
        `</ul>`;
    }
  } catch (e) {
    // --- LÓGICA DE MODO NOCHE ---
    const currentHour = new Date().getHours();

    // Si son entre las 00:00 y las 06:59
    const isNightTime = currentHour >= 0 && currentHour < 7;

    // Cambiamos el icono y un poco el estilo si es de noche
    const errorIcon = isNightTime ? "🌙" : "⚠️";
    // Opcional: Si es de noche usamos un azul oscuro en vez de rojo, o lo dejamos rojo.
    // Aquí lo dejo rojo pero con la luna.

    listContent = `<div class="p-4 text-center text-red-500 text-sm font-bold flex flex-col items-center justify-center h-20">
                    <span style="font-size: 1.2em;">${errorIcon} ${UNAVAILABLE_MESSAGE}</span>
                   </div>`;
  }

  // --- RENDERIZADO FINAL ---

  const isFav = getFavorites("metro").some((f) => f.id === stopId);
  const starClass = isFav ? "text-yellow-400" : "text-gray-400";
  const starIcon = isFav ? SICONS.starSolid : SICONS.starOutline;

  resEl.innerHTML = `
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden w-full max-w-full">
        <div class="bg-green-50 p-2 flex justify-between items-center border-b border-green-100 max-w-full">
            <div class="flex-1 min-w-0 pr-2">
                <p class="font-bold text-green-800 text-xs uppercase leading-tight break-words notranslate">${nombreParada}</p>
            </div>
            <button onclick="toggleFavorite('metro', '${stopId}', '${nombreParada}')" class="p-1 hover:bg-white/50 rounded-full transition shrink-0">
                <svg id="fav-btn-icon-metro" class="w-6 h-6 ${starClass}" viewBox="0 0 24 24">${starIcon}</svg>
            </button>
        </div>
        ${listContent}
    </div>`;
};

// 7.3. CARGA DE PARADAS DE METRO (ASÍNCRONA)
// ------------------------------------------
async function loadMetroStops() {
  try {
    const select = document.getElementById("metro-stop-select");
    if (select && select.options.length > 1) return; // Ya cargado

    const stops = await (await fetch(`${API_BASE_URL}/metro/paradas`)).json();
    if (select) {
      select.classList.add("notranslate");
      select.innerHTML =
        '<option value="">Selecciona parada...</option>' +
        stops
          .map((s) => `<option value="${s.id}">${s.nombre}</option>`)
          .join("");
    }
  } catch (e) {
    console.error("Error stops", e);
  }
}

// ======================================================================
// 8. MÓDULO: MAPA DE TRANSPORTE Y BÚSQUEDA (Leaflet)
// ======================================================================

// 8.1. FUNCIONES DE MARCADORES Y POPUPS
// ------------------------------------------
function makeIcon(type) {
  let iconClass, svgHtml;

  if (type === "metro") {
    iconClass = "pin-metro";
    svgHtml = SVG_ICONS.metro;
  } else if (type === "inter") {
    iconClass = "pin-inter";
    svgHtml = SVG_ICONS.bus;
  } else {
    iconClass = "pin-urbano";
    svgHtml = SVG_ICONS.bus;
  }

  return L.divIcon({
    className: `${iconClass} pin-icon-custom`,
    html: svgHtml,
    iconSize: [45, 45],
    iconAnchor: [22.5, 45],
    popupAnchor: [0, -45],
  });
}

function bindData(data, type) {
  const markers = [];
  data.forEach((s) => {
    const isBus = type === "urbano" || type === "inter";
    const stopName = s.stop_name;
    const stopCode = s.stop_code || "";

    // 1. Generar HTML de las Líneas (Badges)
    let lineasHtml = "";
    if (isBus && s.routes && s.routes.length) {
      const badges = s.routes
        .map(
          (r) =>
            `<span class="line-badge-popup notranslate" style="background-color: ${
              r.color
            }; color: ${getContrastColor(r.color)};">
                ${r.name}
             </span>`
        )
        .join("");

      // Contenedor flexible para las líneas
      lineasHtml = `<div class="popup-lines-container">${badges}</div>`;
    }

    // 2. Generar el Botón de Acción
    let buttonHtml = "";

    if (type === "urbano") {
      // FIX: Usamos la nueva función global pasando el código de parada
      buttonHtml = `
        <button onclick="window.verTiemposBus('${stopCode}')" class="popup-btn btn-urbano">
            <span>Ver Tiempos</span> ${SVG_ICONS.lupa}
        </button>`;
    } else if (type === "metro") {
      // FIX: Usamos la nueva función global pasando el nombre de parada
      // Nota: Escapamos las comillas simples del nombre por si acaso (ej: O'Donnel)
      const safeName = stopName.replace(/'/g, "\\'");
      buttonHtml = `
        <button onclick="window.verTiemposMetro('${safeName}')" class="popup-btn btn-metro">
            <span>Ver Tiempos</span> ${SVG_ICONS.lupa}
        </button>`;
    }

    // 3. Ensamblar la Tarjeta (HTML Estructurado)
    // Usamos clases CSS que definiremos abajo para dar estilo
    const finalContent = `
        <div class="custom-popup-card">
            <div class="popup-header">
                <h3 class="notranslate">${stopName}</h3>
                ${
                  stopCode ? `<span class="popup-code">#${stopCode}</span>` : ""
                }
            </div>

            ${
              lineasHtml
                ? `<div class="popup-body"><p class="label">Líneas:</p>${lineasHtml}</div>`
                : ""
            }

            ${buttonHtml ? `<div class="popup-footer">${buttonHtml}</div>` : ""}
        </div>
        <p class="stop-id" style="display: none;">ID: ${s.stop_id}</p>
    `;

    // Crear marcador
    markers.push(
      L.marker([s.stop_lat, s.stop_lon], { icon: makeIcon(type) }).bindPopup(
        finalContent,
        {
          className: "clean-leaflet-popup",
          minWidth: 420, // Aumentado de 260 a 340
          maxWidth: 540, // Aumentado de 300 a 450
        }
      )
    );
  });
  return L.layerGroup(markers);
}

// 8.2. MANEJO DE UBICACIÓN DEL USUARIO
// ------------------------------------------
function handleLocationSuccess(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const accuracy = pos.coords.accuracy;

  userLocationLatLng = L.latLng(lat, lon);

  // Limpiar marcadores y círculos anteriores
  if (userMarker) {
    userMarker.remove();
  }
  if (userAccuracyCircle) {
    userAccuracyCircle.remove();
  }

  // Crear el marcador del usuario
  const customIcon = createCustomUserIcon();
  userMarker = L.marker(userLocationLatLng, { icon: customIcon })
    .addTo(mapTransporte)
    .bindPopup("Estás aquí. Precisión: " + accuracy.toFixed(0) + " metros.")
    .openPopup();

  // Crear círculo de precisión
  userAccuracyCircle = L.circle(userLocationLatLng, {
    radius: accuracy,
    color: "#1e40af", // Blue-700
    fillColor: "#60a5fa", // Blue-400
    fillOpacity: 0.2,
  }).addTo(mapTransporte);

  // CLAVE: Animación suave. Al terminar ('moveend'), cargamos los marcadores.
  mapTransporte.flyTo(userLocationLatLng, 16, {
    duration: 1.5, // Animación un poco más lenta para dar fluidez
    easeLinearity: 0.25,
  });

  // Suscribirse una sola vez al fin del movimiento para cargar los buses
  mapTransporte.once("moveend", () => {
    // Pequeño delay extra para asegurar que el navegador recuperó aliento
    setTimeout(renderizarCapasDiferidas, 100);
  });
}

function handleLocationError(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);

  // Añadimos alertas visuales para saber qué pasa en el móvil
  if (err.code === 1) {
    alert(
      "❌ Permiso denegado. Ve a Ajustes > Privacidad > Localización y activa Safari/Chrome."
    );
  } else if (err.code === 2) {
    alert("⚠️ Ubicación no disponible. ¿Tienes el GPS encendido?");
  } else if (err.code === 3) {
    // Si es timeout, no alertamos siempre, pero es bueno saberlo
    console.log("Tiempo de espera agotado, intentando con menor precisión...");
  }
}

function centerMapOnUser() {
  if (userLocationLatLng && mapTransporte) {
    mapTransporte.flyTo(userLocationLatLng, 16);
  }
}

// ======================================================================
// OPTIMIZACIÓN: Variables para controlar si ya se cargaron los marcadores
// ======================================================================
let markersLoaded = false;

// Función auxiliar para pintar las capas SOLO cuando sea necesario
function renderizarCapasDiferidas() {
  if (markersLoaded || !mapTransporte) return;

  // Añadimos las capas ahora que el mapa está quieto
  if (layers.urbano) layers.urbano.addTo(mapTransporte);
  if (layers.metro) layers.metro.addTo(mapTransporte);

  // Restauramos estado visual de botones
  document.getElementById("btnUrbano").classList.add("active-layer");
  document.getElementById("btnUrbano").classList.remove("inactive-layer");
  document.getElementById("btnMetro").classList.add("active-layer");
  document.getElementById("btnMetro").classList.remove("inactive-layer");
  document.getElementById("btnInter").classList.add("inactive-layer");
  document.getElementById("btnInter").classList.remove("active-layer");

  markersLoaded = true;
  console.log("✅ Marcadores renderizados tras la animación.");
}

// 8.3. INICIALIZACIÓN DEL MAPA DE TRANSPORTE
// ------------------------------------------
window.initTransporteMap = function () {
  const mapElement = document.getElementById("map-transporte");
  if (!mapElement) return;

  if (!mapTransporte) {
    // 1. Crear Mapa base (ligero)
    mapTransporte = createBaseMap("map-transporte", [37.177, -3.598], 13);

    // 2. Preparar datos en memoria (bindData es rápido, addTo es lento)
    // NO los añadimos al mapa todavía (.addTo)
    layers.urbano = bindData(dUrb, "urbano");
    layers.inter = bindData(dInt, "inter");
    layers.metro = bindData(dMet, "metro");

    // 3. Añadir control de ubicación
    addLocationControl(mapTransporte, () => {
      if (userLocationLatLng) {
        centerMapOnUser();
      } else if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          handleLocationError,
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      }
    });

    // 4. Iniciar Geolocalización
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleLocationSuccess(pos);
          // Si el GPS responde rápido, handleLocationSuccess se encarga de pintar capas al terminar el zoom.
        },
        (err) => {
          handleLocationError(err);
          // Si falla el GPS, cargamos las capas inmediatamente para no dejar el mapa vacío
          renderizarCapasDiferidas();
          // Y centramos en vista general
          const activeStops = [...dUrb, ...dMet];
          if (activeStops.length > 0) {
            const bounds = new L.featureGroup(
              activeStops.map((s) => L.marker([s.stop_lat, s.stop_lon]))
            ).getBounds();
            mapTransporte.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // Fallback si no hay soporte GPS
      renderizarCapasDiferidas();
    }

    // 5. Fallback de seguridad: Si por alguna razón el evento 'moveend' no salta
    // (ej: el usuario ya estaba en la posición exacta y no hubo animación),
    // forzamos la carga a los 2 segundos.
    setTimeout(renderizarCapasDiferidas, 2000);
  } else {
    setTimeout(() => {
      mapTransporte.invalidateSize();
    }, 200);
  }
};

// 8.4. LÓGICA DE FILTRADO Y MANEJO DE CAPAS (CORRECCIÓN)
// --------------------------------------------------------
// Ayudante para filtrar arrays de objetos de paradas
function filterArrayByString(dataArray, term) {
  if (!term) return dataArray; // Si no hay texto, devuelve todo
  return dataArray.filter((stop) => {
    const name = stop.stop_name ? stop.stop_name.toLowerCase() : "";
    return name.includes(term);
  });
}

function restaurarCapasActivas() {
  const btnUrbano = document.getElementById("btnUrbano");
  const btnInter = document.getElementById("btnInter");
  const btnMetro = document.getElementById("btnMetro");

  if (btnUrbano && btnUrbano.classList.contains("active-layer")) {
    mapTransporte.addLayer(layers.urbano);
  }
  if (btnInter && btnInter.classList.contains("active-layer")) {
    mapTransporte.addLayer(layers.inter);
  }
  if (btnMetro && btnMetro.classList.contains("active-layer")) {
    mapTransporte.addLayer(layers.metro);
  }
}

function handleSearchInput(event) {
  // Si pulsa Enter, busca inmediatamente
  if (event.key === "Enter") {
    filtrarParadasMapa();
  }
  // Si borra el texto, restaura las paradas automáticamente
  if (document.getElementById("map-search-input").value.trim() === "") {
    filtrarParadasMapa();
  }
}

window.filtrarParadasMapa = function () {
  const input = document.getElementById("map-search-input");
  // Guardamos el término en minúsculas y sin espacios extra
  currentMapSearchTerm = input.value.toLowerCase().trim();

  // Si el campo está vacío, restauramos las capas activas sin filtrar
  if (currentMapSearchTerm === "") {
    // 1. Limpiamos las capas
    if (layers.urbano) mapTransporte.removeLayer(layers.urbano);
    if (layers.inter) mapTransporte.removeLayer(layers.inter);
    if (layers.metro) mapTransporte.removeLayer(layers.metro);

    // 2. Regeneramos con todos los datos
    layers.urbano = bindData(dUrb, "urbano");
    layers.inter = bindData(dInt, "inter");
    layers.metro = bindData(dMet, "metro");

    // 3. Volvemos a añadir al mapa SOLO las capas que estén activas visualmente
    restaurarCapasActivas();

    input.classList.remove(
      "border-red-500",
      "focus:ring-red-500",
      "focus:border-red-500"
    );
    return; // Salimos si no hay término de búsqueda
  }

  // 1. Generamos arrays temporales filtrados basados en los datos originales
  // (dUrb, dInt, dMet son tus variables globales que ya existen en main.js)
  const filteredUrb = filterArrayByString(dUrb, currentMapSearchTerm);
  const filteredInt = filterArrayByString(dInt, currentMapSearchTerm);
  const filteredMet = filterArrayByString(dMet, currentMapSearchTerm);

  // 2. Limpiamos las capas del mapa si existen
  if (layers.urbano) mapTransporte.removeLayer(layers.urbano);
  if (layers.inter) mapTransporte.removeLayer(layers.inter);
  if (layers.metro) mapTransporte.removeLayer(layers.metro);

  // 3. Regeneramos los grupos de capas (LayerGroups) con los datos filtrados
  layers.urbano = bindData(filteredUrb, "urbano");
  layers.inter = bindData(filteredInt, "inter");
  layers.metro = bindData(filteredMet, "metro");

  // 4. Volvemos a añadir al mapa SOLO las capas que estén activas visualmente (botones)
  restaurarCapasActivas();

  // Feedback visual simple
  if (
    filteredUrb.length === 0 &&
    filteredInt.length === 0 &&
    filteredMet.length === 0
  ) {
    input.classList.add(
      "border-red-500",
      "focus:ring-red-500",
      "focus:border-red-500"
    );
  } else {
    input.classList.remove(
      "border-red-500",
      "focus:ring-red-500",
      "focus:border-red-500"
    );
  }
};

// FUNCIÓN TOGGLE LAYER (OPTIMIZADA Y CON FILTROS)
window.toggleLayer = function (key) {
  const layer = layers[key]; // Esto ya contiene la versión filtrada gracias a filtrarParadasMapa
  const btn = document.getElementById(
    "btn" + key.charAt(0).toUpperCase() + key.slice(1)
  );

  const isActive = btn.classList.contains("active-layer");

  if (isActive) {
    // DESACTIVAR
    if (mapTransporte.hasLayer(layer)) {
      mapTransporte.removeLayer(layer);
    }
    btn.classList.remove("active-layer");
    btn.classList.add("inactive-layer");
  } else {
    // ACTIVAR
    if (!mapTransporte.hasLayer(layer)) {
      mapTransporte.addLayer(layer);
    }
    btn.classList.add("active-layer");
    btn.classList.remove("inactive-layer");
  }
};

// 8.5. FUNCIONES GLOBALES PARA EL POPUP
// ------------------------------------------
window.verTiemposBus = function (stopCode) {
  // 1. Cerrar popup
  if (mapTransporte) mapTransporte.closePopup();

  // 2. Navegar a la vista
  navigateTo("transporte");

  // 3. Rellenar y buscar (con un pequeño delay para asegurar que la vista cargó)
  setTimeout(() => {
    const stopCodeInput = document.getElementById("stop-code");
    if (stopCodeInput) {
      stopCodeInput.value = stopCode;
      searchStop(); // Esta función ya es global, así que funcionará
    }

    // Hacemos scroll manual porque scrollToElement es privada
    const element = document.querySelector("#transporte-view .grid");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
};

window.verTiemposMetro = function (stopName) {
  if (mapTransporte) mapTransporte.closePopup();

  navigateTo("transporte");

  setTimeout(async () => {
    const selectMetro = document.getElementById("metro-stop-select");
    if (!selectMetro) return;

    // Si el select está vacío, cargamos las paradas primero
    // Nota: loadMetroStops es privada, pero como esta función está en main.js, puede verla.
    if (selectMetro.options.length <= 1) await loadMetroStops();

    // Buscamos la opción que coincida con el nombre
    const options = Array.from(selectMetro.options);
    const targetOption = options.find(
      (opt) => (opt.text || "").trim() === stopName.trim()
    );

    if (targetOption) {
      selectMetro.value = targetOption.value;
      searchMetroStop(); // Esta función ya es global
    }

    const element = document.querySelector("#transporte-view .grid");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
};

// ======================================================================
// 9. MÓDULO: LISTADO ORA
// ======================================================================

window.renderOraStreets = function () {
  const container = document.getElementById("ora-streets-container");
  if (!container || container.children.length > 0) return; // Evitar re-renderizado

  // Optimización: Uso de map + join en lugar de += en un bucle
  const htmlContent = ORA_DATA.map(
    (zone) => `
        <div class="mb-6">
            <h4 class="${zone.color} font-bold border-b-2 ${
      zone.border
    } pb-1 mb-2 sticky top-0 bg-white z-10">
                ${zone.title}
            </h4>
            ${zone.subzones
              .map(
                (sub) => `
                <p class="font-bold text-gray-700 mt-2 mb-1 text-xs uppercase ${
                  zone.bg
                } p-1 rounded">
                    ${sub.name}
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 mb-3">
                    ${sub.streets
                      .map(
                        (st) => `
                        <div class="flex justify-between">
                            <span>${st[0]}</span> 
                            <span class="font-mono text-xs bg-gray-100 px-1 rounded">${st[1]}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `
              )
              .join("")}
        </div>
    `
  ).join("");

  container.innerHTML = htmlContent;
};

window.switchOraMap = function (type) {
  const btnVias = document.getElementById("btn-map-vias");
  const btnParq = document.getElementById("btn-map-parq");
  const mapVias = document.getElementById("map-vias");
  const mapParq = document.getElementById("map-parquimetros");

  // Clases CSS
  const activeClass =
    "px-6 py-2 rounded-lg text-sm font-bold transition-all shadow bg-white text-blue-600";
  const inactiveClass =
    "px-6 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 transition-all";

  if (type === "vias") {
    btnVias.className = activeClass;
    btnParq.className = inactiveClass;
    mapVias.classList.remove("hidden");
    mapParq.classList.add("hidden");
  } else {
    btnVias.className = inactiveClass;
    btnParq.className = activeClass;
    mapVias.classList.add("hidden");
    mapParq.classList.remove("hidden");
  }

  // === NUEVA LÓGICA DE HISTORIAL ===
  // Si estamos en la vista ORA (debería ser el caso), reemplazamos el estado actual.
  // Esto evita que cambiar entre los dos mapas añada dos entradas al historial.
  if (window.location.hash.startsWith("#ora")) {
    const newState = { view: "ora", subview: type }; // Guardamos el subview
    const newUrl = `#ora-${type}`;
    // Usamos replaceState, no pushState
    history.replaceState(newState, "", newUrl);
  }
};

// ======================================================================
// 10. MÓDULO: CORTES DE TRÁFICO (Lógica XML/Mapa)
// ======================================================================

// 10.1. INICIALIZACIÓN DEL MAPA
// ------------------------------------------
// Inicialización del Mapa
window.initCortesMap = function () {
  if (mapCortes) {
    setTimeout(() => mapCortes.invalidateSize(), 200);
    return;
  }

  // --- USA LA FACTORÍA ---
  mapCortes = createBaseMap("map-cortes", [37.1773, -3.5986], 13);
  // -----------------------

  // Creamos el grupo de capas para los marcadores
  cortesLayerGroup = L.layerGroup().addTo(mapCortes);

  fetchCortesData();
};

// 10.2. FUNCIONES DE ICONOS Y FETCH
// ------------------------------------------
// Función para crear el icono personalizado
function createCustomIcon(colorHex) {
  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
        <path fill="${colorHex}" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
    </svg>`;

  return L.divIcon({
    className: "custom-map-pin",
    html: svgHtml,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  });
}

// Lógica de descarga y parsing (XML)
async function fetchCortesData() {
  const container = document.getElementById("cortes-lista-container");
  const urlGranada =
    "http://www.movilidadgranada.com/app/noticias/cortes-geojson.php";
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(urlGranada);

  container.innerHTML =
    '<div class="text-center py-4 text-gray-500">Cargando datos...</div>';

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Error conexión");

    const textoXML = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(textoXML, "text/xml");
    const items = Array.from(xmlDoc.getElementsByTagName("item"));

    const regexCoords =
      /Ubicación \(latitud,longitud\):\s*\(([\d.-]+),\s*([\d.-]+)\)/i;

    // Helpers internos para parseo
    const getEstiloTipo = (tipoTextoRaw, tituloFallback) => {
      const texto = tipoTextoRaw
        ? tipoTextoRaw.toUpperCase().trim()
        : tituloFallback.toUpperCase();
      if (texto.includes("TOTAL"))
        return {
          texto: "CORTE TOTAL",
          clase: "bg-red-600 text-white shadow-red-200",
          colorHex: "#dc2626",
        };
      if (texto.includes("PARCIAL"))
        return {
          texto: "CORTE PARCIAL",
          clase: "bg-orange-500 text-white shadow-orange-200",
          colorHex: "#f97316",
        };
      if (texto.includes("PUNTUAL"))
        return {
          texto: "CORTE PUNTUAL",
          clase: "bg-yellow-500 text-white shadow-yellow-200",
          colorHex: "#eab308",
        };
      if (texto.includes("MANIFESTACIÓN"))
        return {
          texto: "📢 MANIFESTACIÓN",
          clase: "bg-purple-600 text-white shadow-purple-200",
          colorHex: "#9333ea",
        };
      if (texto.includes("OBRA"))
        return {
          texto: "🚧 OBRAS",
          clase: "bg-blue-600 text-white shadow-blue-200",
          colorHex: "#2563eb",
        };
      return {
        texto: "⚠️ AVISO",
        clase: "bg-gray-600 text-white shadow-gray-200",
        colorHex: "#4b5563",
      };
    };

    const parseFechaFin = (fechaStr) => {
      if (!fechaStr) return null;
      const partes = fechaStr.trim().split("-");
      if (partes.length === 3)
        return new Date(
          parseInt(partes[0]),
          parseInt(partes[1]) - 1,
          parseInt(partes[2])
        );
      return null;
    };

    // Reiniciamos el array global
    allCortesEventos = [];

    for (let item of items) {
      const titulo =
        item.getElementsByTagName("title")[0]?.textContent || "Sin título";
      const rawDesc =
        item.getElementsByTagName("description")[0]?.textContent || "";
      const pubDateStr = item.getElementsByTagName("pubDate")[0]?.textContent;
      const fechaPub = pubDateStr ? new Date(pubDateStr) : new Date(0);

      const matchTipo = rawDesc.match(/Tipo de corte:\s*([^<.\n]+)/i);
      const regexFin =
        /(?:<p>)?Fin de(?: la)? publicaci[óo]n:\s*([^<\n]+)(?:<\/p>)?/i;
      const matchFin = rawDesc.match(regexFin);
      const matchCoords = rawDesc.match(regexCoords);

      let descLimpia = rawDesc
        .replace(regexCoords, "")
        .replace(/Tipo de corte:\s*([^<.\n]+)/i, "")
        .replace(regexFin, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/Más info[\s\S]*$/i, "")
        .replace(/\s+/g, " ")
        .trim();

      const estilo = getEstiloTipo(
        matchTipo ? matchTipo[1].trim() : null,
        titulo
      );
      const fechaFinTexto = matchFin ? matchFin[1].trim() : null;
      const fechaFinObjeto = parseFechaFin(fechaFinTexto);

      allCortesEventos.push({
        titulo,
        descripcion: descLimpia,
        fechaPub,
        fechaFin: fechaFinTexto,
        fechaFinObj: fechaFinObjeto,
        tipo: estilo,
        lat: matchCoords ? parseFloat(matchCoords[1]) : null,
        lon: matchCoords ? parseFloat(matchCoords[2]) : null,
      });
    }

    // Ordenar: Más cercanos a hoy primero
    allCortesEventos.sort((a, b) => a.fechaFinObj - b.fechaFinObj);

    // Renderizar todos inicialmente
    renderCortes(allCortesEventos);
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="p-4 text-center"><p class="text-red-500 font-bold mb-1">Error cargando datos</p></div>`;
  }
}

// 10.3. RENDERIZADO DE MAPA Y LISTA
// ------------------------------------------
function renderCortes(datosParaPintar) {
  const container = document.getElementById("cortes-lista-container");
  container.innerHTML = "";

  // 1. Limpiar y regenerar marcadores del mapa (Estado Inicial)
  if (cortesLayerGroup) {
    cortesLayerGroup.clearLayers();
  }

  if (datosParaPintar.length === 0) {
    container.innerHTML =
      '<div class="p-4 text-center text-gray-500">No se encontraron eventos.</div>';
    return;
  }

  datosParaPintar.forEach((ev, index) => {
    // --- A. MAPA (Pintamos todos inicialmente) ---
    if (ev.lat && ev.lon && mapCortes && cortesLayerGroup) {
      const customIcon = createCustomIcon(ev.tipo.colorHex);
      const marker = L.marker([ev.lat, ev.lon], { icon: customIcon });

      marker.bindPopup(`
                <div class="font-sans text-center min-w-[140px]">
                    <span class="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-1 ${ev.tipo.clase} notranslate">${ev.tipo.texto}</span>
                    <h3 class="font-bold text-gray-800 text-sm leading-tight">${ev.titulo}</h3>
                </div>
            `);

      // Guardamos el índice en el marcador para poder filtrarlo luego
      marker.options.dataIndex = index;
      cortesLayerGroup.addLayer(marker);
    }

    // --- B. LISTA ---
    const fechaPubString = ev.fechaPub.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const itemDiv = document.createElement("div");

    // AÑADIMOS CLASE IDENTIFICATIVA Y DATA-INDEX
    itemDiv.className =
      "corte-card-item bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 mb-4 group";
    itemDiv.setAttribute("data-index", index); // Importante para vincular con el mapa

    const cajaFinPublicacion = ev.fechaFin
      ? `<div class="mt-3 inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                 <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📅 Fin:</span>
                 <span class="text-xs font-mono font-bold text-gray-800">${ev.fechaFin}</span>
               </div>`
      : `<div class="mt-3 text-xs text-gray-400 italic">Sin fecha fin</div>`;

    const botonMapa = ev.lat
      ? `<button class="btn-localizar-corte ml-auto mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                 📍 Mapa
               </button>`
      : "";

    itemDiv.innerHTML = `
            <div class="flex flex-wrap gap-2 mb-2 items-center">
                <div class="${ev.tipo.clase} px-2 py-0.5 rounded shadow-sm text-[10px] font-black uppercase tracking-wide notranslate">
                    ${ev.tipo.texto}
                </div>
                <span class="ml-auto text-[10px] text-gray-400">Pub: ${fechaPubString}</span>
            </div>
            
            <h4 class="font-bold text-gray-800 text-base mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                ${ev.titulo}
            </h4>
            
            <p class="text-sm text-gray-600 leading-relaxed line-clamp-3">
                ${ev.descripcion}
            </p>
            
            <div class="flex flex-wrap items-end justify-between gap-2 border-t border-gray-50 pt-2 mt-2">
                ${cajaFinPublicacion}
                ${botonMapa}
            </div>
        `;

    // Evento click en el botón "Mapa"
    if (ev.lat) {
      const btn = itemDiv.querySelector(".btn-localizar-corte");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          document
            .getElementById("map-cortes")
            .scrollIntoView({ behavior: "smooth", block: "center" });

          if (mapCortes) {
            setTimeout(() => {
              mapCortes.invalidateSize();
              mapCortes.flyTo([ev.lat, ev.lon], 16, { duration: 1.5 });
              cortesLayerGroup.eachLayer((layer) => {
                // Buscamos el marcador por el índice que asignamos antes
                if (layer.options.dataIndex === index) {
                  setTimeout(() => layer.openPopup(), 1600);
                }
              });
            }, 300);
          }
        });
      }
    }
    container.appendChild(itemDiv);
  });
}

// 10.4. FILTRADO DE LISTA Y MAPA
// ------------------------------------------

window.ejecutarFiltroCortes = function () {
  const input = document.getElementById("cortes-search-input");
  const term = input.value.toLowerCase().trim();

  // Obtenemos todas las tarjetas renderizadas en el DOM
  const tarjetas = document.querySelectorAll(".corte-card-item");
  const indicesVisibles = new Set();
  let hayResultados = false;

  // 1. Filtrar LISTA visualmente (leyendo lo que ve el usuario, traducido o no)
  tarjetas.forEach((card) => {
    // card.innerText contiene el texto visible (traducido por Google)
    if (card.innerText.toLowerCase().includes(term)) {
      card.classList.remove("hidden");
      // Guardamos el índice original del dato para filtrar el mapa
      const index = parseInt(card.getAttribute("data-index"));
      indicesVisibles.add(index);
      hayResultados = true;
    } else {
      card.classList.add("hidden");
    }
  });

  // 2. Filtrar MAPA basado en los resultados de la lista
  if (cortesLayerGroup) {
    cortesLayerGroup.clearLayers(); // Borramos todo

    // Re-añadimos solo los marcadores que coinciden con la lista visible
    // Usamos allCortesEventos (variable global) para reconstruir los marcadores necesarios
    indicesVisibles.forEach((index) => {
      const ev = allCortesEventos[index];
      if (ev && ev.lat && ev.lon) {
        const customIcon = createCustomIcon(ev.tipo.colorHex);
        const marker = L.marker([ev.lat, ev.lon], { icon: customIcon });

        marker.bindPopup(`
                    <div class="font-sans text-center min-w-[140px]">
                        <span class="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-1 ${ev.tipo.clase} notranslate">${ev.tipo.texto}</span>
                        <h3 class="font-bold text-gray-800 text-sm leading-tight">${ev.titulo}</h3>
                    </div>
                `);
        marker.options.dataIndex = index;
        cortesLayerGroup.addLayer(marker);
      }
    });
  }

  // Feedback visual en el input
  if (term !== "" && !hayResultados) {
    input.classList.add(
      "border-red-500",
      "focus:ring-red-500",
      "focus:border-red-500"
    );
  } else {
    input.classList.remove(
      "border-red-500",
      "focus:ring-red-500",
      "focus:border-red-500"
    );
  }
};

// ======================================================================
// 11. MÓDULO: MI COCHE (Geolocalización, Guardado y Rutas)
// ======================================================================

// 11.1. INICIALIZACIÓN Y RASTREO GPS
// ------------------------------------------
function _handleCocheLocationSuccess(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  userLocationLatLng = L.latLng(lat, lon); // Actualiza la ubicación global

  // 1. Limpiar marcador de ubicación actual (si existía)
  if (userCurrentMarker) mapCoche.removeLayer(userCurrentMarker);

  // 2. Crear y añadir el NUEVO marcador de ubicación actual (icono de usuario)
  const userIcon = createCustomUserIcon("#2563eb"); // Azul para el usuario actual
  userCurrentMarker = L.marker(userLocationLatLng, { icon: userIcon })
    .addTo(mapCoche)
    .bindPopup("Tu ubicación actual")
    .openPopup();

  // 3. Ocultar el marcador de coche guardado si coincide (para evitar duplicidad visual)
  const savedData = localStorage.getItem("parking_data");
  if (savedData) {
    const data = JSON.parse(savedData);
    if (cocheMarker) {
      // Comprobar si la ubicación actual es muy cercana a la guardada (opcional, pero buena práctica)
      const distance = mapCoche.distance(
        userLocationLatLng,
        L.latLng(data.lat, data.lng)
      );
      if (distance < 50)
        cocheMarker.setOpacity(0.5); // Atenuar si estamos muy cerca
      else cocheMarker.setOpacity(1.0);
    }
  }

  // 4. Centrar el mapa en la posición actual
  mapCoche.flyTo(userLocationLatLng, 16);
}

window.initCocheMap = function () {
  if (!mapCoche) {
    // --- USA LA FACTORÍA ---
    mapCoche = createBaseMap("map-coche", [37.1773, -3.5986], 15);

    // --- AÑADIMOS EL BOTÓN DE UBICACIÓN ---
    addLocationControl(mapCoche, () => {
      // Al pulsar el botón, forzamos centrado y reiniciamos el watch si se perdió
      if (userLocationLatLng) {
        mapCoche.flyTo(userLocationLatLng, 16);
      }
    });

    // --- ACTIVAR RASTREO EN TIEMPO REAL (WATCH) ---
    if (navigator.geolocation) {
      // Cancelamos cualquier watch anterior por seguridad
      if (cocheWatchId) navigator.geolocation.clearWatch(cocheWatchId);

      cocheWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          // Esta función se ejecutará cada vez que te muevas
          _handleCocheLocationSuccess(pos);
        },
        (err) => console.log("Esperando señal GPS precisa..."),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    }
  } else {
    mapCoche.invalidateSize();
  }
  actualizarInterfazCoche();
};

// 11.2. INTERFAZ Y ESTADO DE GUARDADO
// ------------------------------------------
function actualizarInterfazCoche() {
  const savedData = localStorage.getItem("parking_data");
  const btnGuardar = document.getElementById("btn-guardar-coche");
  const panelAcciones = document.getElementById("panel-acciones-coche");
  const labelFecha = document.getElementById("fecha-coche");

  // 1. Limpiar marcadores y rutas previas
  if (cocheMarker) mapCoche.removeLayer(cocheMarker);
  if (userCurrentMarker) mapCoche.removeLayer(userCurrentMarker);
  if (rutaControl) {
    mapCoche.removeControl(rutaControl);
    rutaControl = null;
  }

  if (savedData) {
    // MODO: COCHE GUARDADO
    const data = JSON.parse(savedData);
    btnGuardar.classList.add("hidden");
    panelAcciones.classList.remove("hidden");
    labelFecha.textContent = data.timestamp;

    // Poner marcador del coche (Icono de coche guardado - ROJO)
    const carIcon = createCustomCarIcon();
    cocheMarker = L.marker([data.lat, data.lng], { icon: carIcon })
      .addTo(mapCoche)
      .bindPopup("<b>🚗 Tu coche está aquí</b>")
      .openPopup();

    mapCoche.setView([data.lat, data.lng], 16);

    // Volver a añadir el marcador de posición actual del usuario si lo tenemos
    if (userLocationLatLng) {
      const userIcon = createCustomUserIcon("#2563eb");
      userCurrentMarker = L.marker(userLocationLatLng, { icon: userIcon })
        .addTo(mapCoche)
        .bindPopup("Tu ubicación actual");
    }
  } else {
    // MODO: SIN COCHE
    btnGuardar.classList.remove("hidden");
    panelAcciones.classList.add("hidden");

    // Intentar centrar en usuario si es posible para facilitar el guardado
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(_handleCocheLocationSuccess); // Llama a la versión que centra el mapa
    }
  }
}

// 11.3. ACCIONES PRINCIPALES
// ------------------------------------------
window.guardarUbicacionCoche = function () {
  if (!navigator.geolocation) {
    alert("Necesitamos permiso de ubicación para guardar donde estás.");
    return;
  }

  const btn = document.getElementById("btn-guardar-coche");
  // 1. Guardamos el texto original del span interno ANTES de modificarlo
  const spanOriginal = btn.querySelector("span");
  const textoOriginal = spanOriginal.textContent;

  // 2. Mostramos feedback de carga en el botón
  btn.innerHTML = "⏳ ESPERANDO NUEVA UBICACIÓN...";
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      // ÉXITO: GUARDAMOS LA UBICACIÓN Y ACTUALIZAMOS INTERFAZ
      const data = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: new Date().toLocaleString(),
      };
      localStorage.setItem("parking_data", JSON.stringify(data));

      // La función actualizarInterfazCoche() se encarga de ocultar
      // este botón y mostrar el panel de acciones.
      btn.disabled = false;
      actualizarInterfazCoche();
    },
    (err) => {
      // ERROR: RESTAURAR EL BOTÓN A SU ESTADO ORIGINAL
      console.error("Error obteniendo ubicación:", err);
      alert("Error obteniendo ubicación. Asegúrate de tener el GPS activo.");

      // 3. Restaurar el HTML del botón al span original (texto y estructura)
      btn.innerHTML = `<span>${textoOriginal}</span>`;
      btn.disabled = false;
    },
    { enableHighAccuracy: true }
  );
};

window.calcularRutaCoche = function () {
  const savedData = JSON.parse(localStorage.getItem("parking_data"));
  if (!savedData) return;

  if (!navigator.geolocation) {
    alert("Necesitamos tu ubicación para calcular la ruta.");
    return;
  }

  // Mostrar feedback de carga
  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Calculando ruta...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      // 1. Limpiar ruta previa y el marcador de posición actual del usuario
      if (rutaControl) mapCoche.removeControl(rutaControl);
      if (userCurrentMarker) mapCoche.removeLayer(userCurrentMarker);

      // 2. Crear y añadir el marcador de ubicación actual para la ruta (Icono de usuario - AZUL)
      const userIcon = createCustomUserIcon("#2563eb", true);
      userCurrentMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(mapCoche)
        .bindPopup("Tu posición (Inicio de ruta)");

      // 3. Asegurarse de que el marcador del coche es visible
      if (cocheMarker) {
        cocheMarker.setOpacity(1.0);
        cocheMarker.openPopup();
      }

      // 4. Usar Leaflet Routing Machine
      rutaControl = L.Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(savedData.lat, savedData.lng),
        ],
        routeWhileDragging: false,
        show: false,
        // NO crear marcadores extra, usamos los nuestros
        createMarker: function (i, wp) {
          return null;
        },
        lineOptions: {
          styles: [{ color: "#2563eb", opacity: 0.8, weight: 6 }],
        },
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          profile: "foot",
        }),
      }).addTo(mapCoche);

      // Ajustar zoom para ver toda la ruta cuando se calcule
      rutaControl.on("routesfound", function (e) {
        mapCoche.fitBounds(e.routes[0].coordinates, { padding: [50, 50] });
        btn.innerHTML = originalText;
      });

      // Si la ruta falla
      rutaControl.on("routingerror", function (e) {
        alert("Error al calcular la ruta. Inténtalo de nuevo más tarde.");
        btn.innerHTML = originalText;
      });
    },
    (err) => {
      alert("No pudimos obtener tu ubicación actual.");
      btn.innerHTML = originalText;
    }
  );
};

// 11.4. BORRADO DE UBICACIÓN (MODAL CUSTOM)
// ------------------------------------------
// LÓGICA DE MODAL CUSTOMIZADO (Paso 2)
function showCustomConfirm(message, callback) {
  const modal = document.getElementById("custom-confirm-modal");
  const messageEl = document.getElementById("modal-message-text");
  const confirmBtn = document.getElementById("modal-confirm-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");

  // Muestra el modal con el mensaje
  messageEl.textContent = message;

  // Configura la visibilidad con animación
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.remove("opacity-0"), 10);

  // Limpia y añade listeners para evitar duplicados
  const cleanup = () => {
    confirmBtn.removeEventListener("click", onConfirm);
    cancelBtn.removeEventListener("click", onCancel);
    modal.classList.add("opacity-0");
    setTimeout(() => modal.classList.add("hidden"), 300);
  };

  const onConfirm = () => {
    cleanup();
    callback(true); // Llama al callback con 'true' (confirmado)
  };

  const onCancel = () => {
    cleanup();
    callback(false); // Llama al callback con 'false' (cancelado)
  };

  confirmBtn.addEventListener("click", onConfirm);
  cancelBtn.addEventListener("click", onCancel);
}

window.borrarUbicacionCoche = function () {
  const message = CONFIRM_MESSAGES[currentLanguage] || CONFIRM_MESSAGES["es"];

  showCustomConfirm(message, (confirmed) => {
    if (confirmed) {
      // 1. ELIMINAR EL DATO. Esto es lo único que debe ejecutarse.
      localStorage.removeItem("parking_data");

      // 2. Ejecutar la actualización de la interfaz y forzar la eliminación del popup.
      // NOTA: ELIMINAMOS LA LÓGICA DE cambiarIdioma() AQUÍ para evitar la recarga/interferencia.

      // Forzar la actualización de la interfaz
      actualizarInterfazCoche();

      // Forzar el botón de guardar.
      const btnGuardar = document.getElementById("btn-guardar-coche");
      if (btnGuardar) {
        btnGuardar.innerHTML = "<span>🅿️ AQUÍ HE APARCADO</span>";
        btnGuardar.disabled = false;
        btnGuardar.classList.remove("hidden");
      }

      // 3. Mostrar una alerta (si es necesario) para darle tiempo al usuario
      // de que el widget de Google Translate se calme después de la interacción.
      // Si el popup persiste, es posible que el usuario deba hacer clic en el botón de idioma
      // de nuevo para restablecer el traductor.
      alert(
        "Ubicación del coche borrada correctamente. / Car location successfully deleted."
      );
    }
    // Si no está confirmado (cancelar), no hacemos nada.
  });
};

// ======================================================================
// 12. MÓDULO: PUNTOS DE INTERÉS (POI)
// ======================================================================

// 12.1. ICONOS Y MARCADORES POI
// ------------------------------------------
// Función auxiliar para obtener el path SVG correcto
function getIconPathForPoi(slug) {
  // Alojamiento
  if (
    slug.includes("hotel") ||
    slug.includes("hostal") ||
    slug.includes("apartamento") ||
    slug.includes("huespedes")
  ) {
    return ICONS.hotel;
  }

  // Naturaleza
  if (slug.includes("parque")) {
    return ICONS.parque;
  }

  // Cultura y Turismo
  if (
    slug.includes("museo") ||
    slug.includes("monumento") ||
    slug.includes("atraccion") ||
    slug.includes("castillo") ||
    slug.includes("memorial")
  ) {
    return ICONS.cultura;
  }

  // Transporte
  if (slug.includes("estacion")) {
    return ICONS.transporte;
  }
  if (slug.includes("aparcamiento") || slug.includes("parking")) {
    return ICONS.parking;
  }

  // Religión
  if (
    slug.includes("iglesia") ||
    slug.includes("culto") ||
    slug.includes("capilla") ||
    slug.includes("monasterio")
  ) {
    return ICONS.iglesia;
  }

  if (slug.includes("biblioteca")) {
    return ICONS.biblioteca;
  }

  // Ocio
  if (slug.includes("discoteca") || slug.includes("ocio")) {
    return ICONS.ocio;
  }

  // Miradores
  if (slug.includes("mirador")) {
    return ICONS.mirador;
  }

  // Deportes
  if (slug.includes("estadio")) {
    return ICONS.estadio;
  }
  // Servicios de Emergencia
  if (slug.includes("policia")) {
    return ICONS.policia;
  }
  if (slug.includes("bomberos")) {
    return ICONS.fuego;
  }

  // Salud
  if (slug.includes("hospital") || slug.includes("salud")) {
    return ICONS.salud;
  }

  // Ocio y Compras
  if (slug.includes("centro-comercial") || slug.includes("tienda")) {
    return ICONS.compras;
  }
  if (slug.includes("cine")) {
    return ICONS.cine;
  }

  // Fallback (por si alguno no coincide, usa uno genérico o el de cultura)
  return '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>';
}

function createCustomIconPoi(slug, colorHex) {
  let iconClass = `pin-${slug}`;
  let svgContent = getIconPathForPoi(slug);

  const iconHtml = `
    <div class="${iconClass} pin-icon-custom" style="background-color: ${colorHex};">
        <svg class="h-full w-full" fill="currentColor" viewBox="0 0 24 24">${svgContent}</svg>
    </div>`;

  return L.divIcon({
    className: "poi-icon-wrapper",
    html: iconHtml,
    iconSize: [45, 45],
    iconAnchor: [22.5, 45],
    popupAnchor: [0, -45],
  });
}

function createPoiMarker(poi) {
  const customIcon = createCustomIconPoi(poi.type_slug, poi.color);

  // Generamos el HTML del popup con el nuevo botón IR
  const content = `
        <div class="custom-popup-card" style="min-width: 250px;">
            <div class="popup-header !justify-start !gap-3">
                <div class="pin-icon-custom pin-${
                  poi.type_slug
                }" style="background-color: ${poi.color}; border-color: ${
    poi.color
  }; width: 30px; height: 30px; padding: 5px;">
                    <svg class="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
                        ${getIconPathForPoi(poi.type_slug)}
                    </svg>
                </div>
                <h3 class="notranslate">${poi.name}</h3>
            </div>
            <div class="popup-body">
                <p class="label">Categoría:</p>
                <p class="text-sm font-semibold mb-2">${poi.type}</p>
                
                <button onclick="iniciarRutaAPie(${poi.lat}, ${
    poi.lon
  })" class="btn-ir-ruta">
                    <span>IR AHORA 🚶</span>
                </button>
            </div>
        </div>
    `;

  return L.marker([poi.lat, poi.lon], { icon: customIcon }).bindPopup(content, {
    className: "clean-leaflet-popup",
    minWidth: 260,
    maxWidth: 350,
  });
}

// 12.2. INICIALIZACIÓN DEL MAPA POI
// ------------------------------------------
window.initPuntosMap = function () {
  const mapElement = document.getElementById("map-puntos");
  if (!mapElement) return;

  if (!mapPuntos) {
    // 1. Crear Mapa
    mapPuntos = createBaseMap("map-puntos", [37.1773, -3.5986], 14);

    // 2. Añadir botón de "Mi Ubicación" (con recentrado forzado)
    addLocationControl(mapPuntos, () => {
      mapPuntos.locate({
        setView: true,
        maxZoom: 19,
        enableHighAccuracy: true,
      });
    });

    // ============================================================
    // 3. RECUPERACIÓN DE DATOS (ESTA ES LA PARTE QUE FALTABA)
    // ============================================================

    // A) Inicializar los Grupos de Capas (Layers)
    if (typeof POI_LAYERS_CONFIG !== "undefined") {
      POI_LAYERS_CONFIG.forEach((config) => {
        // Creamos el grupo y lo añadimos al mapa por defecto
        puntosLayerGroups[config.slug] = L.layerGroup().addTo(mapPuntos);
      });
    } else {
      console.error(
        "❌ Error: POI_LAYERS_CONFIG no está definido. Revisa transporte.js"
      );
    }

    // B) Crear y distribuir los Marcadores
    if (typeof POI_DATA !== "undefined") {
      let puntosCargados = 0;
      POI_DATA.forEach((poi) => {
        const marker = createPoiMarker(poi);

        // Verificamos si existe el grupo para ese slug
        if (puntosLayerGroups[poi.type_slug]) {
          puntosLayerGroups[poi.type_slug].addLayer(marker);
          puntosCargados++;
        } else {
          console.warn(
            `⚠️ Aviso: El punto "${poi.name}" tiene una categoría desconocida: "${poi.type_slug}". No se mostrará.`
          );
        }
      });
      console.log(`✅ Mapa cargado con ${puntosCargados} lugares de interés.`);
    } else {
      console.error("❌ Error: POI_DATA no está definido.");
    }

    // C) Renderizar los botones de filtro
    renderPuntosFilterButtons();

    // ============================================================
    // 4. GEOLOCALIZACIÓN EN TIEMPO REAL (NUEVO)
    // ============================================================

    mapPuntos.on("locationfound", function (e) {
      if (puntosUserMarker) {
        puntosUserMarker.setLatLng(e.latlng); // Mueve el marcador azul
      } else {
        const icon = createCustomUserIcon("#2563eb", true);
        puntosUserMarker = L.marker(e.latlng, {
          icon: icon,
          zIndexOffset: 1000,
        })
          .addTo(mapPuntos)
          .bindPopup("📍 Estás aquí");

        // 💡 NUEVA LÍNEA: Centrar solo la PRIMERA vez que se encuentra la ubicación
        mapPuntos.flyTo(e.latlng, 16);
      }
    });

    // Activar el "watch: true" para seguimiento continuo
    mapPuntos.locate({
      setView: false, // <-- CAMBIO CLAVE: Ya no centra el mapa automáticamente
      maxZoom: 19,
      enableHighAccuracy: true,
      watch: true,
    });
  } else {
    // Si ya existía el mapa, solo reajustamos tamaño y reactivamos GPS
    mapPuntos.invalidateSize();
    mapPuntos.locate({
      setView: false,
      maxZoom: 19,
      enableHighAccuracy: true,
      watch: true,
    });
  }
};

// 12.3. LÓGICA DE FILTRADO (BÚSQUEDA Y BOTONES)
// ------------------------------------------
// Mostrar/Ocultar el menú desplegable
window.togglePuntosFilterMenu = function () {
  const panel = document.getElementById("puntos-filter-panel");
  if (panel) {
    panel.classList.toggle("hidden");
  }
};

// Generar los botones HTML basados en POI_LAYERS_CONFIG
window.renderPuntosFilterButtons = function () {
  const container = document.getElementById("puntos-filter-grid");
  if (!container) return;

  container.innerHTML = "";

  POI_LAYERS_CONFIG.forEach((cat) => {
    // Crear botón
    const btn = document.createElement("button");

    // Clases base + Estado inicial (Activo)
    btn.className = `filter-pill active`;
    btn.id = `btn-filter-${cat.slug}`;

    // Estilos inline para el color específico de cada categoría
    btn.style.backgroundColor = cat.color;

    // Contenido (Círculo blanco decorativo + Nombre)
    btn.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-white opacity-80"></span>
            ${cat.name}
        `;

    // Evento Click
    btn.onclick = () => togglePuntosLayerState(cat.slug, cat.color);

    container.appendChild(btn);
  });
};

// Lógica de activar/desactivar capa
window.togglePuntosLayerState = function (slug, colorOriginal) {
  const layer = puntosLayerGroups[slug];
  const btn = document.getElementById(`btn-filter-${slug}`);

  if (!mapPuntos || !layer || !btn) return;

  if (mapPuntos.hasLayer(layer)) {
    // DESACTIVAR
    mapPuntos.removeLayer(layer);

    btn.classList.remove("active");
    btn.classList.add("inactive");
    btn.style.backgroundColor = ""; // Quitar color de fondo para que use el gris del CSS
  } else {
    // ACTIVAR
    mapPuntos.addLayer(layer);

    btn.classList.remove("inactive");
    btn.classList.add("active");
    btn.style.backgroundColor = colorOriginal; // Restaurar color original
  }
};

// Botón "Ver todo" (Resetea filtros)
window.resetPuntosFilters = function () {
  POI_LAYERS_CONFIG.forEach((cat) => {
    const layer = puntosLayerGroups[cat.slug];
    const btn = document.getElementById(`btn-filter-${cat.slug}`);

    if (!mapPuntos.hasLayer(layer)) {
      mapPuntos.addLayer(layer);
    }

    if (btn) {
      btn.classList.remove("inactive");
      btn.classList.add("active");
      btn.style.backgroundColor = cat.color;
    }
  });
};

// FUNCIÓN CORREGIDA: BUSCADOR DE PUNTOS
window.filtrarPuntosMapa = function (event) {
  // Lógica para decidir si ejecutar el filtro (Enter, click o borrado de texto)
  if (
    event &&
    event.key &&
    event.key !== "Enter" &&
    event.key !== "Backspace" &&
    event.key !== "Delete" &&
    document.getElementById("puntos-search-input").value.trim() !== ""
  ) {
    return; // Si está escribiendo pero no ha pulsado enter, esperamos (opcional, para rendimiento)
  }

  const input = document.getElementById("puntos-search-input");
  const term = input.value.toLowerCase().trim();
  let resultsFound = false;

  // 1. Limpiar TODAS las capas y grupos primero
  POI_LAYERS_CONFIG.forEach((config) => {
    // Limpiamos los marcadores internos
    puntosLayerGroups[config.slug].clearLayers();
    // Quitamos la capa del mapa para repintar limpio
    mapPuntos.removeLayer(puntosLayerGroups[config.slug]);
  });

  // 2. Obtener los datos a mostrar (Filtrados o Todos si está vacío)
  const filteredPois =
    term === ""
      ? POI_DATA // Si está vacío, reseteamos a todos
      : POI_DATA.filter(
          (poi) =>
            poi.name.toLowerCase().includes(term) ||
            poi.type.toLowerCase().includes(term)
        );

  // 3. Reconstruir marcadores y detectar qué categorías tienen resultados
  const categoriesWithResults = new Set(); // Guardará los slugs (ej: 'hotel', 'monumento')

  filteredPois.forEach((poi) => {
    const marker = createPoiMarker(poi);
    puntosLayerGroups[poi.type_slug].addLayer(marker);
    categoriesWithResults.add(poi.type_slug);
    resultsFound = true;
  });

  // 4. ACTUALIZAR ESTADO DE LOS BOTONES Y CAPAS (AQUÍ ESTABA EL FALLO)
  POI_LAYERS_CONFIG.forEach((config) => {
    const btn = document.getElementById(`btn-filter-${config.slug}`);
    const layer = puntosLayerGroups[config.slug];
    const hasContent = categoriesWithResults.has(config.slug);

    if (hasContent) {
      // A) Si la categoría tiene resultados:
      // 1. Añadimos la capa al mapa
      mapPuntos.addLayer(layer);

      // 2. Reactivamos el botón (Color)
      if (btn) {
        btn.classList.remove("inactive");
        btn.classList.add("active");
        btn.style.backgroundColor = config.color; // Restauramos su color original
      }
    } else {
      // B) Si no tiene resultados para esa búsqueda:
      // Desactivamos el botón (Gris)
      if (btn) {
        btn.classList.remove("active");
        btn.classList.add("inactive");
        btn.style.backgroundColor = ""; // Fondo gris por CSS
      }
    }
  });

  // 5. Ajustar Zoom y Feedback visual del input
  if (resultsFound) {
    input.classList.remove(
      "border-red-500",
      "focus:ring-red-500",
      "focus:border-red-500"
    );

    // Calcular límites para centrar
    if (filteredPois.length > 0) {
      const group = new L.featureGroup(
        filteredPois.map((p) => L.marker([p.lat, p.lon]))
      );
      // MaxZoom 16 para que no se acerque demasiado si es un solo punto
      mapPuntos.fitBounds(group.getBounds(), {
        padding: [20, 20],
        maxZoom: 16,
      });
    }
  } else {
    // Si hay término de búsqueda pero no resultados, marco rojo
    if (term !== "") {
      input.classList.add(
        "border-red-500",
        "focus:ring-red-500",
        "focus:border-red-500"
      );
    } else {
      // Si se borró el texto, quitamos rojo
      input.classList.remove(
        "border-red-500",
        "focus:ring-red-500",
        "focus:border-red-500"
      );
    }
  }
};

// 12.4. LÓGICA DE NAVEGACIÓN Y "HAS LLEGADO"
// ------------------------------------------

// Actualiza el marcador azul del usuario en el mapa de puntos
function actualizarPosicionUsuarioPuntos(lat, lng) {
  if (!mapPuntos) return;

  const userLatLng = L.latLng(lat, lng);

  if (puntosUserMarker) {
    puntosUserMarker.setLatLng(userLatLng);
  } else {
    // Usamos el icono azul de usuario que ya definiste (createCustomUserIcon)
    const icon = createCustomUserIcon("#2563eb", true);
    puntosUserMarker = L.marker(userLatLng, { icon: icon, zIndexOffset: 1000 })
      .addTo(mapPuntos)
      .bindPopup("Estás aquí");
  }
}

// Función principal llamada por el botón "IR"
window.iniciarRutaAPie = function (destLat, destLon) {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  // Cerramos el popup para ver el mapa
  mapPuntos.closePopup();

  // Limpiar rutas previas y vigilantes
  detenerNavegacion();

  // Obtener ubicación actual e iniciar
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;

      // 1. Dibujar la ruta
      dibujarRuta(userLat, userLon, destLat, destLon);

      // 1.5. Centrar el mapa en la posición actual al iniciar la ruta
      mapPuntos.flyTo([userLat, userLon], 16);

      // 2. Empezar a vigilar la posición para detectar llegada
      iniciarVigilanciaLlegada(destLat, destLon);
    },
    (err) => {
      alert("No podemos acceder a tu ubicación para calcular la ruta.");
    },
    { enableHighAccuracy: true }
  );
};

function dibujarRuta(startLat, startLon, endLat, endLon) {
  if (puntosRouteControl) {
    mapPuntos.removeControl(puntosRouteControl);
  }

  // Mostrar botón de cancelar
  document.getElementById("btn-cancel-navigation").classList.remove("hidden");

  puntosRouteControl = L.Routing.control({
    waypoints: [L.latLng(startLat, startLon), L.latLng(endLat, endLon)],
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
      profile: "foot",
    }),
    lineOptions: {
      styles: [
        { color: "#2563eb", opacity: 0.8, weight: 6, dashArray: "1, 10" },
      ],
    },
    createMarker: function () {
      return null;
    },
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false,
  }).addTo(mapPuntos);
}

function iniciarVigilanciaLlegada(destLat, destLon) {
  if (navigationWatchId) navigator.geolocation.clearWatch(navigationWatchId);

  navigationWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const currentLat = pos.coords.latitude;
      const currentLon = pos.coords.longitude;

      // Actualizar marcador visual del usuario
      actualizarPosicionUsuarioPuntos(currentLat, currentLon);

      // Calcular distancia al destino (en metros)
      const dist = mapPuntos.distance(
        [currentLat, currentLon],
        [destLat, destLon]
      );

      console.log(`Distancia al destino: ${dist.toFixed(0)} metros`);

      // SI ESTAMOS CERCA (ej: menos de 30 metros)
      if (dist < ARRIVAL_THRESHOLD) {
        ejecutarLlegada();
      }
    },
    (err) => console.warn(err),
    { enableHighAccuracy: true, maximumAge: 1000 }
  );
}

function ejecutarLlegada() {
  // 1. Detener la navegación (quitar ruta y dejar de vigilar)
  detenerNavegacion();

  // 2. Mostrar Popup "HAS LLEGADO"
  const popup = document.getElementById("arrival-notification");
  popup.classList.remove("hidden");
  // Pequeño delay para permitir que el navegador renderice el display:flex antes de la opacidad
  setTimeout(() => {
    popup.classList.add("active"); // Clase para activar animación si se desea manual
    popup.querySelector("div").style.transform = "scale(1)";
  }, 10);

  // 3. Ocultar después de 3 segundos
  setTimeout(() => {
    popup.querySelector("div").style.transform = "scale(0)";
    setTimeout(() => {
      popup.classList.add("hidden");
      popup.classList.remove("active");
    }, 300); // Esperar a que acabe la transición de escala
  }, 3000);
}

function detenerNavegacion() {
  // Quitar línea del mapa
  if (puntosRouteControl) {
    mapPuntos.removeControl(puntosRouteControl);
    puntosRouteControl = null;
  }

  // Detener GPS
  if (navigationWatchId) {
    navigator.geolocation.clearWatch(navigationWatchId);
    navigationWatchId = null;
  }

  // Ocultar botón de cancelar
  const btnCancel = document.getElementById("btn-cancel-navigation");
  if (btnCancel) btnCancel.classList.add("hidden");
}

// ======================================================================
// 13. MÓDULO: INFORMACIÓN DE TRANSPORTE (Rutas, Horarios, Tarifas)
// ======================================================================

// 13.1. RENDERIZADO DE MENÚS
// ------------------------------------------
// 1. Menú Principal
function renderInfoTransporteMenu() {
  const container = document.getElementById("info-content-container");
  if (!container) return;

  // Iconos SVG
  const iconBus = `<svg class="h-16 w-16 mb-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-9-11c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v4H6V6z"/></svg>`;
  const iconMetro = `<svg class="h-16 w-16 mb-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;

  container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onclick="selectInfoMode('metro')" class="btn-mode-select metro group hover:bg-green-50 transition-colors">
                <div class="text-green-600 group-hover:scale-110 transition-transform duration-300">${iconMetro}</div>
                <span class="font-black text-xl text-green-700">METRO</span>
                <span class="text-sm opacity-75 text-green-600">Granada y Área Metropolitana</span>
            </button>
            <button onclick="selectInfoMode('urbano')" class="btn-mode-select urbano group hover:bg-red-50 transition-colors">
                <div class="text-red-600 group-hover:scale-110 transition-transform duration-300">${iconBus}</div>
                <span class="font-black text-xl text-red-700">BUS URBANO</span>
                <span class="text-sm opacity-75 text-red-600">Transporte Urbano de Granada</span>
            </button>
            <button onclick="selectInfoMode('interurbano')" class="btn-mode-select inter group hover:bg-blue-50 transition-colors">
                <div class="text-blue-600 group-hover:scale-110 transition-transform duration-300">${iconBus}</div>
                <span class="font-black text-xl text-blue-700">INTERURBANO</span>
                <span class="text-sm opacity-75 text-blue-600">Consorcio de Transporte</span>
            </button>
        </div>
    `;
}

// 2. Selección de Modo
window.selectInfoMode = function (mode, addToHistory = true) {
  currentInfoMode = mode;

  if (addToHistory) {
    history.pushState(
      { view: "info-transporte", subview: "mode", mode: mode },
      "",
      `#info-${mode}`
    );
  }

  const container = document.getElementById("info-content-container");

  // Header
  const headerHtml = `
        <div class="flex items-center gap-3 mb-4">
            <button onclick="window.history.back()" class="nav-back-btn text-gray-500 hover:text-blue-600 font-bold text-sm">
                ← Volver
            </button>
            <span class="text-gray-300">|</span>
            <span class="nav-header-text font-bold text-gray-700 uppercase tracking-wide">${mode}</span>
        </div>
    `;

  if (mode === "metro") {
    const metroLine = {
      name: "1",
      long_name: "Albolote - Armilla",
      color: "#10b981",
    };
    currentInfoLine = metroLine;
    if (addToHistory) {
      history.replaceState(
        {
          view: "info-transporte",
          subview: "line",
          mode: "metro",
          lineIndex: 0,
        },
        "",
        `#info-metro-1`
      );
    }
    container.innerHTML = headerHtml + renderInfoOptionsHTML(metroLine);
    return;
  }

  // main.js - Código modificado
  const routesData =
    mode === "urbano" ? ALL_ROUTES.urbano : ALL_ROUTES.interurbano;
  let listHtml = `<div class="grid grid-cols-1 gap-2">`;

  routesData.forEach((route, index) => {
    const color = getRouteColorFromStaticData(route.name, mode);

    // --- NUEVA LÓGICA DE LIMPIEZA ---
    let longNameClean = route.long_name;
    // Creamos una expresión regular que coincida con el patrón "L.X" o "Línea X" al inicio
    const regex = new RegExp(
      `^(L[.\\s]?\\s*|L[íi]nea\\s*)?${route.name}[\\s-]*`,
      "i"
    );
    longNameClean = longNameClean.replace(regex, "").trim();
    // --------------------------------

    // AÑADIDO 'notranslate' AL NOMBRE DE LA LÍNEA
    listHtml += `
            <div onclick="selectInfoLine('${mode}', ${index})" class="line-item-card">
                <div class="line-number-box shadow-md notranslate" style="background-color: ${color};">
                    ${route.name}
                </div>
                <div class="font-semibold text-sm flex-1 notranslate">
                    ${longNameClean}
                </div>
                <div class="ml-auto opacity-50">›</div>
            </div>
        `;
  });
  listHtml += `</div>`;
  container.innerHTML = headerHtml + listHtml;
};

// 3. Selección de Línea
window.selectInfoLine = function (mode, index, addToHistory = true) {
  const routesData =
    mode === "urbano" ? ALL_ROUTES.urbano : ALL_ROUTES.interurbano;

  // 1. Obtener la línea original
  const originalLine = routesData[index];

  // 2. CORRECCIÓN: Crear un objeto de línea limpio para el encabezado
  const cleanedLine = { ...originalLine };

  if (mode !== "metro") {
    // Limpiamos la redundancia del número de línea ("Línea X - Destino" -> "Destino")
    const regex = new RegExp(
      `^(L[.\\s]?\\s*|L[íi]nea\\s*)?${originalLine.name}[\\s-]*`,
      "i"
    );
    cleanedLine.long_name = cleanedLine.long_name.replace(regex, "").trim();
  }

  // 3. Establecer la línea limpia como estado actual
  currentInfoLine = cleanedLine;

  if (addToHistory) {
    history.pushState(
      {
        view: "info-transporte",
        subview: "line",
        mode: mode,
        lineIndex: index,
      },
      "",
      `#info-${mode}-${cleanedLine.name}`
    );
  }

  const container = document.getElementById("info-content-container");

  // AÑADIDO 'notranslate' AL HEADER
  const headerHtml = `
        <div class="flex items-center gap-3 mb-4">
            <button onclick="window.history.back()" class="nav-back-btn text-gray-500 hover:text-blue-600 font-bold text-sm">
                ← Volver a Líneas
            </button>
            <span class="text-gray-300">|</span>
            <span class="nav-header-text font-bold text-gray-700">Línea <span class="notranslate">${cleanedLine.name}</span></span>
        </div>
    `;

  // 4. Usar cleanedLine en el renderizado
  container.innerHTML = headerHtml + renderInfoOptionsHTML(cleanedLine);
};

// 4. Renderizar Opciones (CORREGIDA)
function renderInfoOptionsHTML(line) {
  // 1. Definimos las opciones
  const options = [
    { type: "map", icon: "🗺️", label: "Ruta en Mapa" },
    { type: "list", icon: "📋", label: "Ruta en Lista" },
    { type: "fares", icon: "💶", label: "Tarifas" },
    { type: "schedule", icon: "🕒", label: "Horarios" },
  ];

  // 2. Generamos el HTML de los botones primero
  const buttonsHtml = options
    .map((opt) =>
      UI.createOptionButton(
        `activateInfoOption('${opt.type}')`,
        opt.icon,
        opt.label
      )
    )
    .join("");

  // 3. Pasamos los botones DENTRO de la función de cabecera
  // Esto garantiza que se rendericen dentro del <div class="grid ...">
  return UI.createLineHeader(line, currentInfoMode, buttonsHtml);
}

// 5. Controlador de Opciones
window.activateInfoOption = function (type, addToHistory = true) {
  // Obtenemos la URL actual. Si ya tiene un tipo de detalle, asumimos que estamos
  // en el nivel más profundo y debemos REEMPLAZAR (replaceState).
  const currentHash = window.location.hash;
  const isCurrentlyInDetail =
    currentHash.includes("-map") ||
    currentHash.includes("-list") ||
    currentHash.includes("-fares") ||
    currentHash.includes("-schedule");

  // Decide si usar pushState o replaceState
  if (addToHistory) {
    let lineIdx = 0;
    if (currentInfoMode !== "metro") {
      const routesData =
        currentInfoMode === "urbano"
          ? ALL_ROUTES.urbano
          : ALL_ROUTES.interurbano;
      // Usamos findIndex para obtener el índice para que popstate pueda encontrarlo
      lineIdx = routesData.findIndex((r) => r.name === currentInfoLine.name);
    }

    const newState = {
      view: "info-transporte",
      subview: "detail", // Nivel de detalle
      mode: currentInfoMode,
      lineIndex: lineIdx,
      detailType: type, // El tipo de detalle (map, list, fares, schedule)
    };

    const newUrl = `#info-${currentInfoMode}-${currentInfoLine.name}-${type}`;

    if (isCurrentlyInDetail) {
      // Caso 1: Ya estamos en un detalle (mapa, lista, etc.). Reemplazamos el estado actual.
      history.replaceState(newState, "", newUrl);
    } else {
      // Caso 2: Venimos del menú de la línea. Hacemos PUSH para que el botón "atrás"
      // vuelva a ese menú de la línea.
      history.pushState(newState, "", newUrl);
    }
  }

  if (type === "map") showInfoMap();
  else if (type === "list") showInfoList();
  else if (type === "fares") showInfoFares();
  else if (type === "schedule") showInfoSchedule();

  setTimeout(() => {
    const el = document.getElementById("info-result-area");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
};

// 13.2. LÓGICA DE DETALLE (MAPA, LISTA, TARIFAS, HORARIOS)
// ------------------------------------------
// Función auxiliar transbordos (Añadido notranslate)
function generateTransferBadgesHtml(stopObj, currentLineName) {
  if (!stopObj.routes || stopObj.routes.length === 0) return "";
  const transfers = stopObj.routes.filter((r) => r.name !== currentLineName);
  if (transfers.length === 0) return "";

  return `
        <div class="flex flex-wrap gap-1 mt-1.5">
            <span class="text-[10px] opacity-70 font-bold mr-1 self-center">Transbordos:</span>
            ${transfers
              .map((r) => {
                const textColor = getContrastColor(r.color);
                return `<span class="text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center justify-center min-w-[20px] notranslate" 
                              style="background-color: ${r.color}; color: ${textColor}; border: 1px solid rgba(0,0,0,0.1);">
                          ${r.name}
                        </span>`;
              })
              .join("")}
        </div>
    `;
}

// Variables globales para rutas
let routingControlIda = null;
let routingControlVuelta = null;

// A. RUTA EN MAPA (Añadido notranslate a los popups)
window.showInfoMap = function () {
  const area = document.getElementById("info-result-area");
  area.innerHTML = `<div class="info-card-white"><div id="map-info-detail" style="height: 400px; width: 100%; z-index: 1;"></div></div>`;

  if (mapInfoTransporte) {
    mapInfoTransporte.remove();
    mapInfoTransporte = null;
    routingControlIda = null;
    routingControlVuelta = null;
  }

  mapInfoTransporte = L.map("map-info-detail").setView([37.177, -3.598], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(mapInfoTransporte);

  let routeObj = null;
  if (currentInfoMode === "metro") routeObj = ALL_ROUTES.metro[0];
  else if (currentInfoMode === "urbano")
    routeObj = ALL_ROUTES.urbano.find((r) => r.name === currentInfoLine.name);
  else
    routeObj = ALL_ROUTES.interurbano.find(
      (r) => r.name === currentInfoLine.name
    );

  if (!routeObj || !routeObj.rutas) {
    area.innerHTML += `<p class="text-center text-red-500 p-4">Datos de ruta no disponibles.</p>`;
    return;
  }

  const findStop = (id) =>
    dUrb.find((s) => s.stop_id === id) ||
    dInt.find((s) => s.stop_id === id) ||
    dMet.find((s) => s.stop_id === id);
  const waypointsIda = [];
  const waypointsVuelta = [];
  const markersGroup = new L.featureGroup();
  const colorIda = currentInfoMode === "metro" ? "#10b981" : "#2563eb";
  const colorVuelta = "#dc2626";

  if (routeObj.rutas.ida) {
    routeObj.rutas.ida.forEach((stopId) => {
      const s = findStop(stopId);
      if (s) {
        const latlng = L.latLng(s.stop_lat, s.stop_lon);
        waypointsIda.push(latlng);
        const transfersHtml = generateTransferBadgesHtml(
          s,
          currentInfoLine.name
        );
        // AÑADIDO notranslate
        const marker = L.circleMarker(latlng, {
          radius: 12, // ANTES: 6. Aumentado para facilitar el toque
          color: "#fff",
          fillColor: colorIda,
          fillOpacity: 1,
          weight: 3, // ANTES: 2. Borde más grueso para visibilidad
        }).bindPopup(
          `<div class="text-center min-w-[150px]"><p class="font-bold text-sm text-gray-800 border-b border-gray-100 pb-1 mb-1 notranslate">${s.stop_name}</p><span class="text-xs text-blue-600 font-bold block mb-1">SENTIDO IDA</span>${transfersHtml}</div>`
        );
        marker.addTo(mapInfoTransporte);
        markersGroup.addLayer(marker);
      }
    });
  }

  if (routeObj.rutas.vuelta) {
    routeObj.rutas.vuelta.forEach((stopId) => {
      const s = findStop(stopId);
      if (s) {
        const latlng = L.latLng(s.stop_lat, s.stop_lon);
        waypointsVuelta.push(latlng);
        const transfersHtml = generateTransferBadgesHtml(
          s,
          currentInfoLine.name
        );
        // AÑADIDO notranslate
        const marker = L.circleMarker(latlng, {
          radius: 12, // ANTES: 5. Aumentado para facilitar el toque
          color: "#fff",
          fillColor: colorVuelta,
          fillOpacity: 1,
          weight: 3, // ANTES: 2. Borde más grueso
        }).bindPopup(
          `<div class="text-center min-w-[150px]"><p class="font-bold text-sm text-gray-800 border-b border-gray-100 pb-1 mb-1 notranslate">${s.stop_name}</p><span class="text-xs text-red-600 font-bold block mb-1">SENTIDO VUELTA</span>${transfersHtml}</div>`
        );
        marker.addTo(mapInfoTransporte);
        markersGroup.addLayer(marker);
      }
    });
  }

  if (currentInfoMode === "metro") {
    if (waypointsIda.length > 1) {
      L.polyline(waypointsIda, {
        color: colorIda,
        weight: 6,
        opacity: 0.8,
      }).addTo(mapInfoTransporte);
      L.polyline(waypointsIda, {
        color: "white",
        weight: 2,
        dashArray: "10, 10",
        opacity: 0.5,
      }).addTo(mapInfoTransporte);
    }
    if (waypointsVuelta.length > 1) {
      L.polyline(waypointsVuelta, {
        color: colorVuelta,
        weight: 4,
        opacity: 0.7,
        dashArray: "5, 10",
      }).addTo(mapInfoTransporte);
    }
  } else {
    const routerConfig = {
      serviceUrl: "https://router.project-osrm.org/route/v1",
      profile: "driving",
    };
    if (waypointsIda.length > 1) {
      routingControlIda = L.Routing.control({
        waypoints: waypointsIda,
        router: L.Routing.osrmv1(routerConfig),
        lineOptions: { styles: [{ color: colorIda, opacity: 0.7, weight: 5 }] },
        createMarker: function () {
          return null;
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,
      }).addTo(mapInfoTransporte);
    }
    if (waypointsVuelta.length > 1) {
      routingControlVuelta = L.Routing.control({
        waypoints: waypointsVuelta,
        router: L.Routing.osrmv1(routerConfig),
        lineOptions: {
          styles: [
            { color: colorVuelta, opacity: 0.7, weight: 5, dashArray: "10,10" },
          ],
        },
        createMarker: function () {
          return null;
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,
      }).addTo(mapInfoTransporte);
    }
  }

  if (markersGroup.getLayers().length > 0) {
    setTimeout(
      () =>
        mapInfoTransporte.fitBounds(markersGroup.getBounds(), {
          padding: [30, 30],
        }),
      200
    );
  }
};

// B. RUTA EN LISTA (REFACTORIZADA)
window.showInfoList = function () {
  const area = document.getElementById("info-result-area");

  // 1. Obtener objeto de ruta (Lógica original simplificada)
  const routeObj =
    currentInfoMode === "metro"
      ? ALL_ROUTES.metro[0]
      : (currentInfoMode === "urbano"
          ? ALL_ROUTES.urbano
          : ALL_ROUTES.interurbano
        ).find((r) => r.name === currentInfoLine.name);

  if (!routeObj) {
    area.innerHTML = "Sin datos.";
    return;
  }

  // Helper para buscar parada
  const findStopObj = (id) =>
    dUrb.find((x) => x.stop_id === id) ||
    dInt.find((x) => x.stop_id === id) ||
    dMet.find((x) => x.stop_id === id);

  // 2. Función interna para generar el HTML de una dirección (DRY)
  const generateDirectionHtml = (stopIds, title, colorClass) => {
    if (!stopIds || !stopIds.length) return "";

    const stopsHtml = stopIds
      .map((id, i) => {
        const s = findStopObj(id);
        if (!s) return "";
        const transfers = generateTransferBadgesHtml(s, currentInfoLine.name);
        return UI.createStopItem(i + 1, s.stop_name, transfers);
      })
      .join("");

    return UI.createRouteListCard(title, colorClass, stopsHtml);
  };

  // 3. Renderizar
  const htmlIda = generateDirectionHtml(
    routeObj.rutas.ida,
    "IDA (Sentido principal)",
    "blue"
  );
  const htmlVuelta = generateDirectionHtml(
    routeObj.rutas.vuelta,
    "VUELTA (Retorno)",
    "red"
  );

  area.innerHTML = `<div class="grid md:grid-cols-2 gap-4">${htmlIda}${htmlVuelta}</div>`;
};

// C. TARIFAS
window.showInfoFares = function () {
  const area = document.getElementById("info-result-area");
  let html = `<div class="info-card-white p-4">`;

  if (currentInfoMode === "metro") {
    html += `
            <h4 class="font-bold text-lg mb-4 text-center">Tarifas Metro de Granada</h4>
            <div class="info-table-container">
                <table class="info-table">
                    <thead><tr><th class="text-left">Título de Viaje</th><th class="text-right">Precio</th></tr></thead>
                    <tbody>
                        <tr><td>Billete Sencillo (Univiaje)</td><td class="text-right font-bold">1,35 €</td></tr>
                        <tr><td>Ida y Vuelta</td><td class="text-right font-bold">2,70 €</td></tr>
                        <tr><td>Tarjeta Monedero (Precio viaje)</td><td class="text-right font-bold text-green-600">0,49 €</td></tr>
                        <tr><td>Bono 30 Días</td><td class="text-right font-bold">40,00 €</td></tr>
                        <tr><td>Tarjeta Turística (1 día)</td><td class="text-right font-bold">4,50 €</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="mt-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p class="text-sm text-green-800 dark:text-green-300 font-bold text-center">🔄 Transbordo con Tarjeta del Consorcio: Gratuito</p>
                <p class="text-[10px] text-green-700 dark:text-green-400 text-center mt-1">* Precios de monedero incluyen bonificación vigente.</p>
            </div>`;
  } else if (currentInfoMode === "urbano") {
    html += `
            <h4 class="font-bold text-lg mb-4 text-center">Tarifas Bus Urbano</h4>
            <div class="info-table-container">
                <table class="info-table">
                    <thead><tr><th class="text-left">Título de Viaje</th><th class="text-right">Coste Usuario*</th></tr></thead>
                    <tbody>
                        <tr><td>Billete Ordinario</td><td class="text-right font-bold">1,60 €</td></tr>
                        <tr><td>Credibús 5€</td><td class="text-right font-bold">0,54 € / viaje</td></tr>
                        <tr><td>Credibús 10€ / 20€</td><td class="text-right font-bold">0,53 € / viaje</td></tr>
                        <tr><td>Bono Joven / Universitario</td><td class="text-right font-bold">0,33 € / viaje</td></tr>
                        <tr><td>Bono Infantil (6-14 años)</td><td class="text-right font-bold text-green-600">Gratuito</td></tr>
                        <tr><td>Bono P.M.R.</td><td class="text-right font-bold">0,36 € / viaje</td></tr>
                        <tr><td>Bono Mensual</td><td class="text-right font-bold">24,60 €</td></tr>
                        <tr><td>Billete Búho</td><td class="text-right font-bold">1,70 €</td></tr>
                        <tr><td>Billete Feria</td><td class="text-right font-bold">2,00 €</td></tr>
                        <tr><td>Transbordo (60 min)</td><td class="text-right font-bold text-green-600">Gratuito</td></tr>
                    </tbody>
                </table>
            </div>
            <p class="text-[10px] opacity-70 mt-3 italic text-center">* Precios con bonificación aplicados.</p>`;
  } else {
    html += `
            <h4 class="font-bold text-lg mb-4 text-center">Tarifas Bus Interurbano</h4>
            <p class="text-xs opacity-70 mb-3 text-center">Precios según saltos (zonas) con Tarjeta.</p>
            <div class="info-table-container">
                <table class="info-table">
                    <thead><tr><th class="text-left">Saltos</th><th class="text-right">Billete Sencillo</th><th class="text-right">Tarjeta Consorcio*</th></tr></thead>
                    <tbody>
                        <tr><td>0 Saltos</td><td class="text-right opacity-70">1,55 €</td><td class="text-right font-bold text-blue-600">0,63 €</td></tr>
                        <tr><td>1 Salto</td><td class="text-right opacity-70">1,60 €</td><td class="text-right font-bold text-blue-600">0,64 €</td></tr>
                        <tr><td>2 Saltos</td><td class="text-right opacity-70">1,90 €</td><td class="text-right font-bold text-blue-600">0,76 €</td></tr>
                        <tr><td>3 Saltos</td><td class="text-right opacity-70">3,15 €</td><td class="text-right font-bold text-blue-600">1,30 €</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p class="text-sm text-blue-800 dark:text-blue-300 font-bold text-center">🔄 Transbordo Interurbano: 0,40 €</p>
                <p class="text-[10px] opacity-70 mt-1 text-center">* Tarifas bonificadas temporalmente. Gastos gestión tarjeta: 1,50€.</p>
            </div>`;
  }
  html += `</div>`;
  area.innerHTML = html;
};

// D. HORARIOS (VERSIÓN FINAL: Lee todo de transporte.js y distingue Urbano/Interurbano)
window.showInfoSchedule = function () {
  const area = document.getElementById("info-result-area");

  // 1. BUSCAR CANDIDATOS EN LA BASE DE DATOS
  // Buscamos todas las líneas que coincidan con el nombre (ej: "111")
  let candidates = ALL_SCHEDULES.filter((s) => s.name === currentInfoLine.name);

  // CORRECCIÓN PARA INTERURBANO 111:
  // Si no encuentra "111" y estamos en interurbano, probamos buscar "111L"
  if (
    candidates.length === 0 &&
    currentInfoMode === "interurbano" &&
    currentInfoLine.name === "111"
  ) {
    candidates = ALL_SCHEDULES.filter((s) => s.name === "111L");
  }

  let schedObj = null;

  // 2. FILTRAR EL CORRECTO SEGÚN EL MODO
  if (candidates.length > 0) {
    if (currentInfoMode === "urbano") {
      // MODO URBANO:
      // Intentamos buscar uno que diga "BUHO" en su nombre largo (para el 111/121)
      schedObj = candidates.find(
        (s) => s.long_name && s.long_name.toUpperCase().includes("BUHO")
      );

      // Si no encuentra ninguno que diga Búho (ej: línea 4, 33...), cogemos el primero que haya
      if (!schedObj) {
        schedObj = candidates[0];
      }
    } else if (currentInfoMode === "interurbano") {
      // MODO INTERURBANO:
      // Cogemos el que NO sea Búho (para evitar que salga el urbano 121)
      schedObj = candidates.find(
        (s) => !s.long_name || !s.long_name.toUpperCase().includes("BUHO")
      );

      // Si por lo que sea no queda ninguno, usamos el primero disponible
      if (!schedObj) schedObj = candidates[0];
    } else {
      // MODO METRO:
      schedObj = candidates[0];
    }
  }

  // --- LOGICA DE RESPALDO PARA METRO (Por si no está en el archivo) ---
  if (currentInfoMode === "metro" && !schedObj) {
    schedObj = {
      horarios: {
        lunes_jueves: { ida: ["06:30", "23:00"], vuelta: ["06:30", "23:00"] },
        viernes: { ida: ["06:30", "02:00"], vuelta: ["06:30", "02:00"] },
        sabados: { ida: ["07:30", "02:00"], vuelta: ["07:30", "02:00"] },
        domingos: { ida: ["07:30", "23:00"], vuelta: ["07:30", "23:00"] },
      },
    };
  }

  // 3. VALIDACIÓN: ¿Hemos encontrado datos?
  if (!schedObj || !schedObj.horarios) {
    const msg = "Horarios no disponibles en la base de datos para esta línea.";
    area.innerHTML = `<div class="info-card-white p-6 text-center opacity-70">${msg}</div>`;
    return;
  }

  // 4. CONFIGURACIÓN DE PESTAÑAS (Mapeo de tus claves en transporte.js)
  // Se adapta a tus claves: "semana", "viernes", "sabado" (singular), "festivo"
  const dias = [
    { label: "Lunes a Jueves", key: "lunes_jueves", fallback: "semana" },
    { label: "Viernes", key: "viernes", fallback: "semana" },
    { label: "Sábados", key: "sabados", fallback: "sabado" },
    { label: "Domingos y Festivos", key: "domingos", fallback: "festivo" },
  ];

  let html = `<div class="space-y-4">`;
  let hayDatos = false;

  dias.forEach((dia) => {
    // Intentamos sacar los datos del día
    let h = schedObj.horarios[dia.key];
    if (!h && dia.fallback) h = schedObj.horarios[dia.fallback];

    // Si no hay horario para este día, pasamos al siguiente
    if (!h || (!h.ida?.length && !h.vuelta?.length)) return;

    hayDatos = true;

    // Cabecera de la tarjeta
    html += `
            <div class="info-card-white overflow-hidden">
                <div class="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 font-bold border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span>${dia.label}</span>
                </div>
                <div class="p-4">`;

    if (currentInfoMode === "interurbano") {
      // --- FORMATO LISTA COMPLETA (Para Interurbanos) ---
      if (h.ida && h.ida.length)
        html += `<p class="text-xs font-bold text-blue-600 mb-1">IDA (Salidas):</p><p class="text-sm mb-3 leading-relaxed opacity-80 font-mono text-gray-600">${h.ida
          .map((t) => t.substring(0, 5))
          .join(", ")}</p>`;
      if (h.vuelta && h.vuelta.length)
        html += `<p class="text-xs font-bold text-red-600 mb-1">VUELTA (Salidas):</p><p class="text-sm leading-relaxed opacity-80 font-mono text-gray-600">${h.vuelta
          .map((t) => t.substring(0, 5))
          .join(", ")}</p>`;
    } else {
      // --- FORMATO PRIMERO / ÚLTIMO (Para Urbanos y Búhos) ---
      // Si es un Búho y tiene muchos horarios, podrías querer verlos todos.
      // Por defecto los urbanos muestran Primero/Último.

      const idaFirst = h.ida[0] ? h.ida[0].substring(0, 5) : "--:--";
      const idaLast = h.ida.length
        ? h.ida[h.ida.length - 1].substring(0, 5)
        : "--:--";
      const vueltaFirst = h.vuelta[0] ? h.vuelta[0].substring(0, 5) : "--:--";
      const vueltaLast = h.vuelta.length
        ? h.vuelta[h.vuelta.length - 1].substring(0, 5)
        : "--:--";

      // Si la lista es corta (ej: Búhos a veces tienen pocas salidas), mostramos lista. Si es larga, resumen.
      if (h.ida.length > 0 && h.ida.length <= 15) {
        // Muestra lista completa si son pocos horarios (útil para Búhos)
        html += `<div class="mb-3"><p class="text-xs font-bold text-blue-600 mb-1">IDA:</p><p class="text-sm opacity-80 font-mono">${h.ida
          .map((t) => t.substring(0, 5))
          .join(", ")}</p></div>`;
        if (h.vuelta.length)
          html += `<div><p class="text-xs font-bold text-red-600 mb-1">VUELTA:</p><p class="text-sm opacity-80 font-mono">${h.vuelta
            .map((t) => t.substring(0, 5))
            .join(", ")}</p></div>`;
      } else {
        // Formato Resumen
        html += `
                <div class="grid grid-cols-2 gap-4 text-center">
                    <div class="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p class="text-xs font-black text-blue-600 uppercase mb-2">IDA</p>
                        <div class="flex justify-between items-end px-2">
                            <div class="text-left"><span class="text-[10px] text-gray-400 block">Primer</span><b class="text-lg text-gray-700 dark:text-gray-200">${idaFirst}</b></div>
                            <div class="text-right"><span class="text-[10px] text-gray-400 block">Último</span><b class="text-lg text-gray-700 dark:text-gray-200">${idaLast}</b></div>
                        </div>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-800">
                        <p class="text-xs font-black text-red-600 uppercase mb-2">VUELTA</p>
                        <div class="flex justify-between items-end px-2">
                            <div class="text-left"><span class="text-[10px] text-gray-400 block">Primer</span><b class="text-lg text-gray-700 dark:text-gray-200">${vueltaFirst}</b></div>
                            <div class="text-right"><span class="text-[10px] text-gray-400 block">Último</span><b class="text-lg text-gray-700 dark:text-gray-200">${vueltaLast}</b></div>
                        </div>
                    </div>
                </div>`;
      }
    }
    html += `</div></div>`;
  });

  if (!hayDatos) {
    html += `<div class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">No hay información de horarios disponible para esta línea.</div>`;
  }

  html += `</div>`;
  area.innerHTML = html;
};

// ======================================================================
// 14. MÓDULO: GESTIÓN DE GOOGLE TRANSLATE (PWA-Ready)
// ======================================================================

/* 1) Inicializador que Google llama */
function googleTranslateElementInit() {
  if (!document.getElementById("google_translate_element")) return;
  // pageLanguage: 'es' porque tu web está en español
  new google.translate.TranslateElement(
    { pageLanguage: "es" },
    "google_translate_element"
  );
}

/* 2) Carga el script de google translate (si no está ya) */
function loadGoogleTranslateScript(cbName = "googleTranslateElementInit") {
  if (window.google && window.google.translate) {
    // ya cargado
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    // Evitar múltiples tags
    if (document.getElementById("google-translate-script")) {
      // Espera a que inicialice el combo
      const check = setInterval(() => {
        if (document.querySelector(".goog-te-combo")) {
          clearInterval(check);
          resolve();
        }
      }, 200);
      // timeout por si acaso
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 5000);
      return;
    }
    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = `//translate.google.com/translate_a/element.js?cb=${cbName}`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      // Esperamos un poco a que Google construya el combo
      const check = setInterval(() => {
        if (document.querySelector(".goog-te-combo")) {
          clearInterval(check);
          resolve();
        }
      }, 200);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 5000);
    };
    s.onerror = () => reject(new Error("No se pudo cargar Google Translate"));
    document.head.appendChild(s);
  });
}

/* 3) Fuerza la selección de idioma en el select interno de Google */
function selectGoogleLang(code) {
  const select = document.querySelector(".goog-te-combo");
  if (!select) return false;
  select.value = code;
  // disparar evento change compatible
  select.dispatchEvent(new Event("change"));
  // Para navegadores antiguos:
  try {
    select.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (e) {}
  return true;
}

/* 4) Elimina la cookie de Google Translate (para volver a original) */
function clearGoogleTranslateCookie() {
  // Borra la cookie googtrans en path=/
  document.cookie =
    "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // A veces se setea con dominio; intentar eliminar con dominio actual
  try {
    const domain = "." + location.hostname;
    document.cookie =
      "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" +
      domain +
      ";";
  } catch (e) {}
}

/* 5) Observador para ocultar el banner siempre que lo inserten (robusto) */
(function observeAndHideGoogleBanner() {
  const hideBanner = () => {
    const iframe = document.querySelector(".goog-te-banner-frame");
    if (iframe) {
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      iframe.style.pointerEvents = "none";
    }
    const balloon = document.querySelector(".goog-te-balloon-frame");
    if (balloon) {
      balloon.style.display = "none";
      balloon.style.visibility = "hidden";
      balloon.style.pointerEvents = "none";
    }
    document.body.style.top = "0px";
  };

  // Ejecutar ahora
  hideBanner();

  // Observer para cambios en el DOM (si Google vuelve a insertar elementos)
  const observer = new MutationObserver(() => hideBanner());
  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });
})();

/**
 * Función pública de cambio de idioma
 * Modificada para no recargar la página al volver a español.
 */
window.cambiarIdioma = function (lang) {
  // ============================================================
  // 1. BLOQUE DE SEGURIDAD (COOKIES / RGPD)
  // ============================================================
  // Si intentamos traducir a un idioma que no sea el original (Español),
  // necesitamos cargar scripts externos de Google, lo que implica cookies.
  if (lang !== "es") {
    const consent = localStorage.getItem("cookie_consent");

    // Si el usuario rechazó las cookies o aún no ha decidido
    if (consent === "rejected" || !consent) {
      const confirmar = confirm(
        "⚠️ Para traducir la web necesitamos cargar cookies de Google Translate. ¿Nos das permiso para activarlas? / ⚠️ To translate the website we need to load Google Translate cookies. Do you give us permission to activate them?"
      );

      if (confirmar) {
        // Si dice que SÍ, guardamos el consentimiento y continuamos
        aceptarCookies();
      } else {
        // Si dice que NO, detenemos la función aquí. No se carga nada.
        return;
      }
    }
  }

  // ============================================================
  // 2. LÓGICA DE CAMBIO A ESPAÑOL (Volver al original)
  // ============================================================
  if (lang === "es") {
    // Borramos la cookie para que la próxima vez no traduzca automático.
    clearGoogleTranslateCookie();
    currentLanguage = lang;

    // Usamos la lógica interna de Google para volver a Español sin recargar.
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = "es";
      select.dispatchEvent(new Event("change"));
      try {
        select.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (e) {}
    }

    // IMPORTANTE: No hacemos location.reload()
    return;
  }

  // ============================================================
  // 3. LÓGICA DE CAMBIO A INGLÉS (Cargar Google Translate)
  // ============================================================
  if (lang === "en") {
    currentLanguage = lang;
    // Intentamos traducir sin recargar:
    loadGoogleTranslateScript()
      .then(() => {
        // Si el combo ya existe, lo seleccionamos
        if (!selectGoogleLang("en")) {
          // Si no existe aún (está cargando), intentamos con reintentos
          const tries = 20;
          let attempt = 0;
          const t = setInterval(() => {
            attempt++;
            // Intentamos seleccionar inglés
            if (selectGoogleLang("en") || attempt >= tries) {
              clearInterval(t);
            }
          }, 250);
        }
      })
      .catch((err) => {
        console.warn("Error cargando Google Translate:", err);
        // Fallback solo si falla la carga del script
        document.cookie = "googtrans=/es/en; path=/;";
        document.cookie =
          "googtrans=/es/en; path=/; domain=." + location.hostname + ";";
        setTimeout(() => location.reload(), 150);
      });
    return;
  }
};

// ======================================================================
// 15. MÓDULO: GESTIÓN DE COOKIES Y CONSENTIMIENTO
// ======================================================================

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("cookie-banner");
  const consent = localStorage.getItem("cookie_consent");
  // 1. Transporte en Tiempo Real (Bus/Metro)
  const mapSearchInput = document.getElementById("map-search-input");
  const mapSearchButton = document.querySelector(
    "#transporte-view button[onclick='filtrarParadasMapa()']"
  );

  if (mapSearchInput) {
    mapSearchInput.addEventListener("keyup", (event) => {
      // Dispara el filtro al soltar la tecla (para autocompletar o borrado)
      // Y de forma explícita al pulsar Enter
      if (event.key === "Enter" || mapSearchInput.value.trim() === "") {
        filtrarParadasMapa();
      }
    });
  }

  // 2. Cortes y Eventos
  const cortesSearchInput = document.getElementById("cortes-search-input");
  const cortesSearchButton = document.querySelector(
    "#cortes-view button[onclick='ejecutarFiltroCortes()']"
  );

  if (cortesSearchInput) {
    cortesSearchInput.addEventListener("keyup", (event) => {
      // Dispara el filtro al soltar la tecla (para autocompletar o borrado)
      if (event.key === "Enter" || cortesSearchInput.value.trim() === "") {
        ejecutarFiltroCortes();
      }
    });
  }

  // 3. Lugares de Interés (La lógica de Enter y borrado ya está en filtrarPuntosMapa)
  const puntosSearchInput = document.getElementById("puntos-search-input");
  const puntosSearchButton = document.querySelector(
    "#puntos-view button[onclick='filtrarPuntosMapa(event)']"
  );

  if (puntosSearchInput) {
    puntosSearchInput.addEventListener("keyup", (event) => {
      // La función filtrarPuntosMapa tiene lógica interna para decidir si es un "Enter" o un "Borrado"
      // Se le pasa el evento para que la lógica interna funcione
      if (event.key === "Enter" || puntosSearchInput.value.trim() === "") {
        filtrarPuntosMapa(event);
      }
    });
  }
  // Si no hay decisión guardada, mostrar el banner
  if (!consent) {
    banner.classList.remove("hidden");
    // Pequeño retardo para la animación de entrada
    setTimeout(() => {
      banner.classList.remove("translate-y-full");
    }, 100);
  } else if (consent === "accepted") {
    // Si ya aceptó, cargamos Google Translate en segundo plano si es necesario
    // (Opcional: aquí podrías precargar scripts)
  }
});

window.aceptarCookies = function () {
  localStorage.setItem("cookie_consent", "accepted");
  cerrarBanner();
  // Aquí es donde activas los servicios de terceros si los hubieras bloqueado
  console.log("Cookies aceptadas. Servicios activados.");
};

window.rechazarCookies = function () {
  localStorage.setItem("cookie_consent", "rejected");
  cerrarBanner();
  // Si rechaza, borramos las cookies de Google Translate por si acaso
  document.cookie =
    "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  alert(
    "Has rechazado las cookies. La traducción automática y algunas funciones podrían no estar disponibles. / You have rejected cookies. Automatic translation and some features may not be available."
  );
};

function cerrarBanner() {
  const banner = document.getElementById("cookie-banner");
  banner.classList.add("translate-y-full");
  setTimeout(() => {
    banner.classList.add("hidden");
  }, 300);
}

// ======================================================================
// 16. MÓDULO: INFORMACIÓN DEL PROYECTO (README)
// ======================================================================

/**
 * Abre el modal, carga el contenido y añade un estado al historial
 * para que el botón "Atrás" del móvil funcione.
 */
window.openReadmeModal = async function () {
  const modal = document.getElementById("readme-modal");
  const contentDiv = document.getElementById("readme-content");

  // 1. Mostrar el modal visualmente
  if (modal) {
    modal.classList.remove("hidden");
    // Pequeño timeout para permitir que el navegador procese el 'display: flex' antes de la opacidad
    setTimeout(() => {
      modal.classList.remove("opacity-0");
      const innerDiv = modal.querySelector("div");
      if (innerDiv) {
        innerDiv.classList.remove("scale-95");
        innerDiv.classList.add("scale-100");
      }
    }, 10);
  }

  // 2. AÑADIR ESTADO AL HISTORIAL (La clave para que funcione el botón atrás)
  // Solo empujamos el estado si no estamos ya en él
  if (window.location.hash !== "#info") {
    window.history.pushState({ modal: "readme" }, "Información", "#info");
  }

  // 3. Cargar y Renderizar el README
  try {
    // Asegúrate de que README.md esté en la raíz de tu proyecto (junto al index.html)
    const response = await fetch("./README.md");

    if (!response.ok)
      throw new Error(
        `Error ${response.status}: No se encontró el archivo README.`
      );

    const markdown = await response.text();

    // Configurar Marked
    // Configurar Marked
    const renderer = new marked.Renderer();

    // Sobrescribimos la función 'link'.
    // En versiones nuevas, recibe un objeto destructurado { href, title, text }
    renderer.link = function ({ href, title, text }) {
      // Aseguramos que sean texto para evitar errores
      const safeHref = href || "";
      const safeText = text || "";
      const safeTitle = title ? ` title="${title}"` : "";

      // 1. Lógica para Enlaces Internos (Índice)
      if (safeHref.startsWith("#")) {
        const id = safeHref.substring(1);
        return `<a href="${safeHref}" 
                   class="text-blue-600 hover:underline cursor-pointer"
                   onclick="event.preventDefault(); const el = document.getElementById('${id}'); if(el) el.scrollIntoView({behavior: 'smooth', block: 'start'});"
                >${safeText}</a>`;
      }

      // 2. Lógica para Enlaces Externos (target="_blank")
      return `<a href="${safeHref}"${safeTitle} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${safeText}</a>`;
    };

    // Renderizar Markdown a HTML
    contentDiv.innerHTML = marked.parse(markdown, { renderer: renderer });
  } catch (error) {
    console.error(error);
    contentDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-center">
                <p class="text-4xl mb-2">😕</p>
                <p class="font-bold text-lg text-gray-700 dark:text-gray-200">No se pudo cargar la información.</p>
                <p class="text-sm text-gray-500 mt-1">${error.message}</p>
                <p class="text-xs text-gray-400 mt-4">Verifica que el archivo README.md existe en la carpeta raíz.</p>
            </div>`;
  }
};

/**
 * Cierra el modal.
 * Si estamos en el estado '#info', simulamos un "Atrás" para limpiar la URL.
 * Si no, simplemente ocultamos el modal.
 */
window.closeReadmeModal = function () {
  // Si la URL actual tiene el hash #info, usamos la historia para volver atrás.
  // Esto disparará el evento 'popstate' que cerrará visualmente el modal.
  if (window.location.hash === "#info") {
    window.history.back();
  } else {
    // Fallback: Si por alguna razón no hay hash, cerramos visualmente directo
    hideReadmeModalVisuals();
  }
};

/**
 * Función auxiliar que solo se encarga de la animación de cierre (CSS)
 */
function hideReadmeModalVisuals() {
  const modal = document.getElementById("readme-modal");
  if (!modal) return;

  // Animación de salida
  modal.classList.add("opacity-0");
  const innerDiv = modal.querySelector("div");
  if (innerDiv) {
    innerDiv.classList.add("scale-95");
    innerDiv.classList.remove("scale-100");
  }

  // Esperar a que termine la transición para ocultar (300ms match con CSS)
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// ======================================================================
// 17. UI COMPONENTS (Estructuras de Componentes HTML)
// ======================================================================

const UI = {
  // ... mantén createOptionButton igual que antes ...
  createOptionButton: (onClick, icon, label) => {
    const btnClass =
      "flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 transition hover:bg-blue-50 group bg-gray-50 h-full w-full"; // Añadido h-full w-full por seguridad
    return `
            <button onclick="${onClick}" class="${btnClass}">
                <span class="text-3xl mb-2 group-hover:scale-110 transition">${icon}</span>
                <span class="font-bold text-sm">${label}</span>
            </button>
        `;
  },

  // --- CAMBIO AQUÍ: Aceptamos buttonsHtml como parámetro ---
  createLineHeader: (line, mode, buttonsHtml) => {
    const color = getRouteColorFromStaticData(line.name, mode) || "#3b82f6";
    return `
            <div class="info-card-white mb-6">
                <div class="p-6 text-center text-white" style="background-color: ${color}">
                    <h3 class="text-3xl font-black mb-1 notranslate" style="color: white !important;">${line.name}</h3>
                    <p class="text-sm opacity-90 font-medium notranslate" style="color: rgba(255,255,255,0.9) !important;">${line.long_name}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4 p-6">
                    ${buttonsHtml}
                </div>
            </div>
            <div id="info-result-area" class="mt-4"></div>
        `;
  },

  // ... mantén createRouteListCard y createStopItem igual ...
  createRouteListCard: (title, colorClass, stopsHtml) => {
    return `
            <div class="info-card-white p-4">
                <h4 class="font-bold text-${colorClass}-600 mb-3 border-b pb-2 flex items-center gap-2 sticky top-0 bg-inherit z-10">
                    <span class="w-3 h-3 rounded-full bg-${colorClass}-600"></span> ${title}
                </h4>
                <ul class="text-sm space-y-0 divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    ${stopsHtml}
                </ul>
            </div>
        `;
  },

  createStopItem: (index, stopName, transfersHtml) => {
    return `
            <li class="py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div class="flex gap-3 items-baseline">
                    <span class="opacity-50 font-mono text-xs min-w-[1.2rem] text-right">${index}.</span> 
                    <div class="flex-1">
                        <span class="font-medium notranslate">${stopName}</span>
                        ${transfersHtml}
                    </div>
                </div>
            </li>
        `;
  },
};

// ======================================================================
// 18. INICIALIZACIÓN Y LISTENERS (DOM Ready)
// ======================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Carga inicial de datos
  loadMetroStops();
  renderFavorites("bus");
  renderFavorites("metro");
  renderHomeGrid();
  // Inicializar el mapa de transporte si la vista de transporte es la inicial
  if (document.getElementById("transporte-view").classList.contains("active")) {
    initTransporteMap();
  }

  // Setup Modal Interactividad (Touch/Mouse)
  const modalContainer = document.getElementById("zbe-modal");

  if (modalContainer) {
    // Prevenir scroll de la página al tocar el modal
    modalContainer.addEventListener("touchmove", (e) => e.preventDefault(), {
      passive: false,
    });

    // Zoom con rueda ratón
    modalContainer.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        modalState.scale = Math.min(Math.max(0.1, modalState.scale * delta), 8);
        requestUpdate();
      },
      { passive: false }
    );

    // Manejadores de eventos unificados
    const startDrag = (e) => {
      if (e.touches && e.touches.length === 2) {
        // Pinch to Zoom init
        modalState.isDragging = false;
        modalState.initialDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        modalState.initialScale = modalState.scale;
      } else if (!e.touches || e.touches.length === 1) {
        // Pan init
        modalState.isDragging = true;
        modalState.startX = e.touches ? e.touches[0].clientX : e.clientX;
        modalState.startY = e.touches ? e.touches[0].clientY : e.clientY;
        modalState.lastX = modalState.pX;
        modalState.lastY = modalState.pY;

        const img = document.getElementById("zbe-modal-img");
        if (img) img.style.cursor = "grabbing";
      }
    };

    const doDrag = (e) => {
      // Pinch to Zoom Action
      if (e.touches && e.touches.length === 2 && modalState.initialDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const scaleFactor = currentDist / modalState.initialDist;
        modalState.scale = Math.min(
          Math.max(0.1, modalState.initialScale * scaleFactor),
          8
        );
        requestUpdate();
        return;
      }

      // Pan Action
      if (!modalState.isDragging) return;

      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = x - modalState.startX;
      const deltaY = y - modalState.startY;

      modalState.pX = modalState.lastX + deltaX;
      modalState.pY = modalState.lastY + deltaY;

      requestUpdate();
    };

    const endDrag = () => {
      modalState.isDragging = false;
      modalState.initialDist = 0;
      const img = document.getElementById("zbe-modal-img");
      if (img) img.style.cursor = "grab";
    };

    // Listeners Mouse
    modalContainer.addEventListener("mousedown", startDrag);
    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", endDrag);

    // Listeners Touch
    modalContainer.addEventListener("touchstart", startDrag, {
      passive: false,
    });
    window.addEventListener("touchmove", doDrag, { passive: false });
    window.addEventListener("touchend", endDrag);
  }
});

// Cerrar al hacer click fuera (Backdrop click)
document.addEventListener("click", function (event) {
  const modal = document.getElementById("readme-modal");
  // Si el modal está abierto y el click fue en el fondo oscuro (no dentro del div blanco)
  if (modal && !modal.classList.contains("hidden") && event.target === modal) {
    closeReadmeModal();
  }
});
// ======================================================================
// 19. SISTEMA DE ACTUALIZACIÓN (PWA / SW)
// ======================================================================

window.lanzarAvisoActualizacion = function (worker) {
  // Evitar duplicados si ya existe el banner
  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className =
    "fixed bottom-4 left-4 right-4 z-[5000] bg-gray-900 text-white p-4 rounded-xl shadow-2xl border border-gray-700 flex items-center justify-between transform translate-y-20 transition-transform duration-500";

  banner.innerHTML = `
    <div class="flex items-center gap-3">
        <span class="text-2xl">🚀</span>
        <div>
            <p class="font-bold text-sm">Actualización disponible</p>
            <p class="text-xs text-gray-400">Mejoras y nuevos datos listos.</p>
        </div>
    </div>
    <button id="btn-update-now" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-lg transition-transform active:scale-95">
        ACTUALIZAR
    </button>
  `;

  document.body.appendChild(banner);

  // Animación de entrada
  requestAnimationFrame(() => {
    banner.classList.remove("translate-y-20");
  });

  // Listener para el botón
  document.getElementById("btn-update-now").addEventListener("click", () => {
    // Feedback visual
    const btn = document.getElementById("btn-update-now");
    btn.innerHTML = "Instalando...";
    btn.classList.add("opacity-50", "cursor-wait");

    // Le decimos al Service Worker que tome el control (esto disparará el reload en index.html)
    if (worker) {
      worker.postMessage({ action: "skipWaiting" });
    }
  });
};

// ======================================================================
// 12. MÓDULO: GASOLINERAS Y PRECIOS (CON NAVEGACIÓN GPS)
// ======================================================================

let mapGasolineras = null;
let gasolinerasLayerGroup = null;
let allGasolinerasData = [];
let userGasLat = null;
let userGasLon = null;
let gasUserMarker = null;

// Variables de Navegación
let gasRouteControl = null;
let gasWatchId = null;

// Estado de filtros especiales
let specialFilterMode = "none";

const GRANADA_ID = "18087";
const API_GAS_URL =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/?IDMunicipio=" +
  GRANADA_ID;

// Normalización
const normalizeKey = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Mapeo
const GAS_KEYS = {
  NINGUNO: "rotulo",
  G95: "gasolina 95 e5",
  G97: "gasolina 97",
  G98: "gasolina 98 e5",
  A_HABITUAL: "gasoleo a",
  A_MEJORADO: "gasoleo premium",
  B: "gasoleo b",
  C: "gasoleo c",
  BIODIESEL: "biodiesel",
  GLP: "gases licuados",
  GNC: "gas natural comprimido",
  GNL: "gas natural licuado",
  ADBLUE: "adblue",
  DIESEL_REN: "diesel renovable",
  GASOLINA_REN: "gasolina renovable",
};

const DEFAULT_GAS_KEY = "NINGUNO";

window.initGasolinerasMap = function () {
  if (!mapGasolineras) {
    mapGasolineras = createBaseMap("map-gasolineras", [37.1773, -3.5986], 13);
    gasolinerasLayerGroup = L.layerGroup().addTo(mapGasolineras);

    // Control manual de ubicación
    addLocationControl(mapGasolineras, () => {
      actualizarUbicacionGasolineras();
    });

    // Cargar datos
    fetchGasolineras();

    // --- CAMBIO AQUÍ: AUTO-ZOOM AL INICIAR ---
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userGasLat = pos.coords.latitude;
          userGasLon = pos.coords.longitude;

          // 1. Pintar el punto azul
          updateUserGasMarker();

          // 2. Hacer zoom suave hacia el usuario (Nivel 15)
          if (mapGasolineras) {
            mapGasolineras.flyTo([userGasLat, userGasLon], 15, {
              duration: 1.5, // Animación suave de 1.5 segundos
            });
          }
        },
        () => {
          console.log(
            "Ubicación no disponible o denegada, manteniendo vista por defecto."
          );
        }
      );
    }
  } else {
    // Si ya existía el mapa (vuelves a la pestaña), solo reajustamos el tamaño
    setTimeout(() => mapGasolineras.invalidateSize(), 200);
  }
};

window.actualizarUbicacionGasolineras = function () {
  if (!mapGasolineras) return;
  mapGasolineras.locate({
    setView: true,
    maxZoom: 14,
    enableHighAccuracy: true,
  });
  mapGasolineras.once("locationfound", (e) => {
    userGasLat = e.latlng.lat;
    userGasLon = e.latlng.lng;
    updateUserGasMarker();
    if (specialFilterMode === "near") filterGasStations();
  });
};

function updateUserGasMarker() {
  if (!mapGasolineras || !userGasLat) return;
  if (gasUserMarker) mapGasolineras.removeLayer(gasUserMarker);
  const icon = createCustomUserIcon("#2563eb", true); // Azul usuario
  gasUserMarker = L.marker([userGasLat, userGasLon], {
    icon: icon,
    zIndexOffset: 1000,
  })
    .addTo(mapGasolineras)
    .bindPopup("Tu ubicación");
}

// ---------------------------------------------------------
// LÓGICA DE NAVEGACIÓN (Ruta Coche)
// ---------------------------------------------------------
window.iniciarRutaGasolinera = function (destLat, destLon) {
  if (!navigator.geolocation) {
    alert("Se necesita GPS para calcular la ruta.");
    return;
  }

  // 1. Limpiar rutas previas
  detenerRutaGasolinera();
  mapGasolineras.closePopup();

  // 2. Obtener posición actual e iniciar
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;

      // Dibujar ruta (OSRM Driving Profile)
      dibujarRutaCoche(userLat, userLon, destLat, destLon);

      // Mostrar botón cancelar
      const btnCancel = document.getElementById("btn-cancel-gas-route");
      if (btnCancel) btnCancel.classList.remove("hidden");

      // Centrar mapa
      mapGasolineras.flyTo([userLat, userLon], 15);

      // Iniciar vigilancia
      monitorizarLlegadaGasolinera(destLat, destLon);
    },
    (err) => {
      alert("Error al obtener tu ubicación: " + err.message);
    },
    { enableHighAccuracy: true }
  );
};

function dibujarRutaCoche(startLat, startLon, endLat, endLon) {
  gasRouteControl = L.Routing.control({
    waypoints: [L.latLng(startLat, startLon), L.latLng(endLat, endLon)],
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
      profile: "driving", // PERFIL COCHE
    }),
    lineOptions: {
      styles: [{ color: "#2563eb", opacity: 0.8, weight: 6 }],
    },
    createMarker: function () {
      return null;
    }, // No crear marcadores extra
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false,
  }).addTo(mapGasolineras);
}

function monitorizarLlegadaGasolinera(destLat, destLon) {
  if (gasWatchId) navigator.geolocation.clearWatch(gasWatchId);

  gasWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      userGasLat = pos.coords.latitude;
      userGasLon = pos.coords.longitude;

      // 1. Actualizar el icono del usuario
      updateUserGasMarker();

      // 2. NUEVO: Mover la cámara del mapa siguiendo al usuario
      mapGasolineras.panTo([userGasLat, userGasLon]);

      // 3. NUEVO: Actualizar la línea de ruta desde la nueva posición
      // (Esto hace que la línea azul se redibuje desde donde estás ahora)
      if (gasRouteControl) {
        gasRouteControl.setWaypoints([
          L.latLng(userGasLat, userGasLon), // Inicio: Tu posición actual
          L.latLng(destLat, destLon), // Fin: Gasolinera
        ]);
      }

      // 4. Comprobar si has llegado
      const dist = mapGasolineras.distance(
        [userGasLat, userGasLon],
        [destLat, destLon]
      );

      if (dist < 40) {
        // Si estás a menos de 40 metros
        ejecutarLlegada();
        detenerRutaGasolinera();
      }
    },
    (err) => console.warn(err),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
    }
  );
}

window.detenerRutaGasolinera = function () {
  if (gasRouteControl) {
    mapGasolineras.removeControl(gasRouteControl);
    gasRouteControl = null;
  }
  if (gasWatchId) {
    navigator.geolocation.clearWatch(gasWatchId);
    gasWatchId = null;
  }
  const btnCancel = document.getElementById("btn-cancel-gas-route");
  if (btnCancel) btnCancel.classList.add("hidden");
};

// ---------------------------------------------------------
// FUNCIONES DE DATOS Y FILTRADO
// ---------------------------------------------------------

window.fetchGasolineras = async function () {
  const updateBtn = document.querySelector(
    "#gasolineras-view button[onclick='fetchGasolineras()']"
  );
  if (updateBtn) {
    updateBtn.innerHTML =
      '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>';
    updateBtn.disabled = true;
  }
  const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(API_GAS_URL);
  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Error fetching gas data");
    const data = await res.json();
    if (!data.ListaEESSPrecio || data.ListaEESSPrecio.length === 0)
      throw new Error("Sin datos");

    allGasolinerasData = data.ListaEESSPrecio.filter(
      (g) => g.IDProvincia === "18"
    ).map((g) => {
      g.Latitud = g.Latitud ? g.Latitud.replace(",", ".") : null;
      g["Longitud (WGS84)"] = g["Longitud (WGS84)"]
        ? g["Longitud (WGS84)"].replace(",", ".")
        : null;
      return g;
    });

    populateBrandSelect();

    if (updateBtn) {
      updateBtn.innerHTML =
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>';
      updateBtn.disabled = false;
    }
    filterGasStations();
  } catch (e) {
    console.error(e);
    if (updateBtn) {
      updateBtn.textContent = "Error";
      updateBtn.disabled = false;
    }
  }
};

function populateBrandSelect() {
  const select = document.getElementById("gas-brand-select");
  if (!select) return;
  const brands = new Set();
  allGasolinerasData.forEach((g) => {
    if (g.Rótulo) brands.add(getCleanBrandName(g.Rótulo));
  });
  const sortedBrands = Array.from(brands).sort();
  const currentVal = select.value;
  select.innerHTML = '<option value="ALL">Todas las Marcas</option>';
  sortedBrands.forEach(
    (brand) =>
      (select.innerHTML += `<option value="${brand}">${brand}</option>`)
  );
  if (sortedBrands.includes(currentVal)) select.value = currentVal;
}

window.resetSpecialFilters = function () {
  specialFilterMode = "none";
  updateFilterButtonsUI();
};

window.activarFiltroEspecial = function (mode) {
  const fuelSelect = document.getElementById("gas-fuel-select");
  if (fuelSelect.value === "NINGUNO") {
    alert("Por favor, selecciona primero un tipo de combustible.");
    return;
  }
  if (mode === "near" && !userGasLat) {
    alert("Necesitamos tu ubicación. Permite el acceso al GPS.");
    actualizarUbicacionGasolineras();
    return;
  }
  specialFilterMode = specialFilterMode === mode ? "none" : mode;
  updateFilterButtonsUI();
  filterGasStations();
};

function updateFilterButtonsUI() {
  const btnCheap = document.getElementById("btn-gas-cheap");
  const btnNear = document.getElementById("btn-gas-near");
  btnCheap.classList.remove("ring-2", "ring-green-600", "bg-green-100");
  btnNear.classList.remove("ring-2", "ring-blue-600", "bg-blue-100");
  if (specialFilterMode === "cheap")
    btnCheap.classList.add("ring-2", "ring-green-600", "bg-green-100");
  else if (specialFilterMode === "near")
    btnNear.classList.add("ring-2", "ring-blue-600", "bg-blue-100");
}

function createGasLogoIcon(rotulo) {
  let color = "#2563EB";
  let text = rotulo.substring(0, 3).toUpperCase();
  let bg = "#E5E7EB";
  if (rotulo.includes("REPSOL")) {
    color = "#EF4444";
    bg = "#FEE2E2";
    text = "RSP";
  } else if (rotulo.includes("CEPSA")) {
    color = "#F59E0B";
    bg = "#FFFBEB";
    text = "CEP";
  } else if (rotulo.includes("BP")) {
    color = "#10B981";
    bg = "#D1FAE5";
    text = "BP";
  } else if (rotulo.includes("SHELL")) {
    color = "#EAB308";
    bg = "#FEF3C7";
    text = "SHL";
  } else if (rotulo.includes("LOW")) {
    color = "#6366F1";
    bg = "#E0E7FF";
    text = "LOW";
  } else if (rotulo.includes("PETROL")) {
    color = "#374151";
    bg = "#D1D5DB";
    text = "PTL";
  } else if (rotulo.includes("ALCAMPO") || rotulo.includes("CARREFOUR")) {
    color = "#ef4444";
    bg = "#fee2e2";
    text = "CC";
  }

  return L.divIcon({
    className: "gas-price-pin gas-logo-pin",
    html: `<div class="gas-logo-icon" style="background-color: ${color}; color: white; border: 3px solid ${bg};">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="${ICONS.pin}" fill="white" opacity="0.8"/>
                <text x="12" y="17" font-size="12" font-weight="900" text-anchor="middle" fill="white" class="notranslate">${text}</text>
            </svg>
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
  });
}

function getCleanBrandName(rawName) {
  if (!rawName) return "OTRAS";
  const upper = rawName.toUpperCase();
  if (upper.includes("REPSOL")) return "REPSOL";
  if (upper.includes("CEPSA")) return "CEPSA";
  if (upper.includes("BP")) return "BP";
  if (upper.includes("SHELL")) return "SHELL";
  if (upper.includes("GALP")) return "GALP";
  if (upper.includes("CARREFOUR")) return "CARREFOUR";
  if (upper.includes("ALCAMPO")) return "ALCAMPO";
  if (upper.includes("BALLENOIL")) return "BALLENOIL";
  if (upper.includes("PLENOIL")) return "PLENOIL";
  if (upper.includes("PETROPRIX")) return "PETROPRIX";
  if (upper.includes("Q8")) return "Q8";
  if (upper.includes("MEROIL")) return "MEROIL";
  if (upper.includes("AVIA")) return "AVIA";
  if (upper.includes("E.S.", "E.S", "E. S.")) return "E.S.";
  return rawName.trim().toUpperCase();
}

const findPriceKey = (gasStation, searchTerm) => {
  if (!searchTerm) return null;
  const keys = Object.keys(gasStation);
  return keys.find((key) => {
    const cleanKey = normalizeKey(key);
    return cleanKey.includes(searchTerm) && cleanKey.startsWith("precio");
  });
};

window.filterGasStations = function () {
  if (!mapGasolineras || allGasolinerasData.length === 0) return;

  const fuelSelect = document.getElementById("gas-fuel-select");
  const brandSelect = document.getElementById("gas-brand-select");

  const selectedFuel = fuelSelect.value;
  const selectedBrand = brandSelect ? brandSelect.value : "ALL";
  const fuelName = fuelSelect.options[fuelSelect.selectedIndex].text;

  gasolinerasLayerGroup.clearLayers();

  const isLogoMode = selectedFuel === DEFAULT_GAS_KEY;
  const targetSearchTerm = isLogoMode ? null : GAS_KEYS[selectedFuel];

  // 1. FILTRADO INICIAL
  let filteredData = allGasolinerasData.filter((g) => {
    // Filtro Marca
    if (
      selectedBrand !== "ALL" &&
      getCleanBrandName(g.Rótulo) !== selectedBrand
    )
      return false;

    // Filtro Coordenadas válidas
    if (!g.Latitud || !g["Longitud (WGS84)"]) return false;

    // Si es modo precio, verificar que tenga precio válido
    if (!isLogoMode) {
      const pk = findPriceKey(g, targetSearchTerm);
      if (!pk || !g[pk] || parseFloat(g[pk].replace(",", ".")) <= 0)
        return false;
      g._tempPrice = parseFloat(g[pk].replace(",", "."));
    }
    return true;
  });

  // 2. FILTROS ESPECIALES (Baratas / Cercanas)
  if (!isLogoMode && specialFilterMode !== "none") {
    if (specialFilterMode === "cheap") {
      filteredData.sort((a, b) => a._tempPrice - b._tempPrice);
      filteredData = filteredData.slice(0, 3);
    } else if (specialFilterMode === "near") {
      if (userGasLat && userGasLon) {
        filteredData.forEach((g) => {
          const lat = parseFloat(g.Latitud);
          const lon = parseFloat(g["Longitud (WGS84)"]);
          g._tempDist = mapGasolineras.distance(
            [userGasLat, userGasLon],
            [lat, lon]
          );
        });

        // Filtro de 5km
        filteredData = filteredData.filter((g) => g._tempDist <= 5000);

        filteredData.sort((a, b) => a._tempDist - b._tempDist);
        filteredData = filteredData.slice(0, 5);
      } else {
        console.warn("Ubicación no disponible para filtro cercanía");
      }
    }
  }

  // Calcular precio mínimo global
  let minPrice = Infinity;
  if (!isLogoMode && filteredData.length > 0) {
    minPrice = Math.min(...filteredData.map((g) => g._tempPrice));
  }

  const bounds = [];

  // 3. RENDERIZADO
  filteredData.forEach((g) => {
    const lat = parseFloat(g.Latitud);
    const lon = parseFloat(g["Longitud (WGS84)"]);
    const finalIcon = createGasLogoIcon(g.Rótulo);

    let priceHtml = "";

    if (isLogoMode) {
      priceHtml = `<p class="text-xs text-gray-400 mt-2 italic">Selecciona combustible para ver precios.</p>`;
    } else {
      const priceDisplay = g._tempPrice.toFixed(3).replace(".", ",");
      let color = "#1f2937";
      let badge = "";

      if (specialFilterMode === "cheap") {
        color = "#10B981";
        badge =
          '<span class="block text-[10px] text-white bg-green-500 rounded px-1 py-0.5 font-bold mt-1 w-fit mx-auto">🏆 TOP BARATA</span>';
      } else if (specialFilterMode === "near") {
        const distKm = (g._tempDist / 1000).toFixed(1);
        if (g._tempPrice <= minPrice * 1.02) color = "#10B981";
        else if (g._tempPrice >= minPrice * 1.1) color = "#DC2626";
        else color = "#F59E0B";
        badge = `<span class="block text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 rounded px-1">📍 a ${distKm} km</span>`;
      } else {
        if (g._tempPrice <= minPrice * 1.03) color = "#10B981";
        else if (g._tempPrice >= minPrice * 1.15) color = "#DC2626";
        else color = "#F59E0B";
      }

      priceHtml = `
            <div class="mt-2 pt-2 border-t border-gray-100">
                <p class="text-[10px] text-gray-400 uppercase tracking-wide font-bold">${fuelName}</p>
                <div class="flex flex-col items-center justify-center mt-1">
                    <span class="text-2xl font-black leading-none" style="color: ${color}">${priceDisplay} €</span>
                    ${badge}
                </div>
            </div>
        `;
    }

    const popupHtml = `
        <div class="font-sans text-center min-w-[180px]">
            <div class="flex items-center justify-center gap-2 mb-1">
                 <span class="w-2 h-2 rounded-full" style="background-color: ${
                   g.Rótulo.includes("REPSOL") ? "#ff8200" : "#3b82f6"
                 }"></span>
                 <h3 class="font-bold text-gray-800 text-sm leading-tight notranslate">${
                   g.Rótulo
                 }</h3>
            </div>
            <p class="text-xs text-gray-500 leading-snug px-2">${
              g.Dirección
            }</p>
            ${priceHtml}
            <button onclick="iniciarRutaGasolinera(${lat}, ${lon})" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-2 text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95">
                <span>🚗 IR ALLÍ</span>
            </button>
        </div>`;

    const marker = L.marker([lat, lon], { icon: finalIcon }).bindPopup(
      popupHtml
    );
    gasolinerasLayerGroup.addLayer(marker);
    bounds.push([lat, lon]);
  });

  if (bounds.length > 0) {
    const group = new L.featureGroup(gasolinerasLayerGroup.getLayers());
    mapGasolineras.fitBounds(group.getBounds(), {
      padding: [50, 50],
      maxZoom: 15,
    });
  } else {
    // === LÓGICA DE ALERTA Y RESET ===
    if (specialFilterMode === "near") {
      alert(
        "No se encontraron gasolineras con ese combustible a menos de 5km."
      );
    } else if (specialFilterMode === "cheap") {
      alert("No se encontraron precios para ese combustible.");
    } else if (!isLogoMode) {
      alert("Actualmente no hay gasolineras con ese combustible.");

      // 1. Resetear el select al valor por defecto (NINGUNO)
      fuelSelect.value = "NINGUNO";

      // 2. Limpiar filtros especiales por si acaso
      resetSpecialFilters();

      // 3. Volver a ejecutar para mostrar el mapa base
      filterGasStations();
    }
  }
};
