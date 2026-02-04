/**
 * Copyright (C) 2026 GranáGo - https://github.com/granago/granago.github.io
 * Este programa es software libre: puedes redistribuirlo y/o modificarlo
 * bajo los términos de la Licencia Pública General GNU publicada por
 * la Free Software Foundation, ya sea la versión 3 de la Licencia, o
 * (a tu elección) cualquier versión posterior.
 *
 * Este programa se distribuye con la esperanza de que sea útil,
 * pero SIN NINGUNA GARANTÍA; incluso sin la garantía implícita de
 * COMERCIALIZACIÓN o APTITUD PARA UN PROPÓSITO PARTICULAR.
 * Consulte la Licencia Pública General GNU para más detalles.
 *
 * Deberías haber recibido una copia de la Licencia Pública General GNU
 * junto con este programa. Si no es así, consulte <https://www.gnu.org/licenses/>.
 */

const GRANADA_COORDS = { lat: 37.1773, lon: -3.5986 };
const API_BASE = "https://movgr.apis.mianfg.me";
const UNAVAILABLE_MESSAGE = "Sin llegadas próximas...";

let newWorker;
let deferredPrompt;
let isManualUpdate = false;
let weatherCache = {};
let currentWeatherData = null;
let weatherLocationActive = null;
let tempHomeLayout = [];
let supportTimeout = null;

let mapInstance = null;
let currentTileLayer = null;
let userMarker = null;
let mapLayers = {
  metro: null,
  urbano: null,
  interurbano: null,
};
let isMapDataLoaded = false;
let allSearchableStops = [];
let isNearbyPanelOpen = false;
let realtimeCache = new Map();
let currentRadioIdx = -1;
let radioIsPlaying = false;
let RADIO_STATIONS = [];
let currentRTController = null;
let radioStartedFromHUD = false;
let radioMainIndices = [];
let radioItemsDisplayed = 0;
const RADIO_PAGE_SIZE = 30;
let radioScrollObserver = null;
let radioImageObserver = null;

let lineMapInstance = null;
let currentLineTileLayer = null;
let lineLayersGroup = null;
let currentLineId = null;
let currentLineColor = null;
let currentLineName = null;
let currentTransportType = "urbano";

let placesMapInstance = null;
let currentPlacesTileLayer = null;
let placesLayers = {};
let placesDataLoaded = false;
let allSearchablePlaces = [];

let cortesMapInstance = null;
let cortesLayersGroup = null;
let cortesTileLayer = null;
let cortesDataLoaded = false;
let placesClusterGroup = null;
let allMobilityEvents = [];
let currentCortesFilter = "all";

let repostarMap = null;
let repostarLayerGroup = null;
let repostarUserMarker = null;
let currentFuelType = null;
let allStationsData = [];
let repostarTileLayer = null;

let restriccionesMap = null;
let restriccionesLayer = null;

let camarasMapInstance = null;
let camarasClusterGroup = null;
let camarasTileLayer = null;
let camarasDataLoaded = false;
let drivingModeActive = false;
let watchId = null;
let wakeLock = null;
let lastAlertTime = 0;
const ALERT_RADIUS = 0.3;
let currentDisplayedSpeed = 0;
let targetSpeed = 0;
let speedAnimationId = null;
let currentStreetFeature = null;
let lastAnnouncedLimit = null;
let hudUpdateInterval = null;

let parkingsMapInstance = null;
let parkingsLayerGroup = null;
let parkingsDataLoaded = false;
let parkingInterval = null;

let oraMapInstance = null;
let oraLayerGroup = null;
let oraDataLoaded = false;
let parkingsTileLayer = null;
let motoParkingsLayerGroup = null;
let oraTileLayer = null;
let staticParkingsLayerGroup = null;
let vehicleConfig = {
  isResident: localStorage.getItem("granaGo_is_resident") === "true",
  badge: localStorage.getItem("granaGo_vehicle_badge") || "NONE"
};
let zbePolygon = null;
let lastZBEAlertTime = 0;

let sostenibleMap = null;
let sostenibleTileLayer = null;
let carrilBiciLayer = null;
let parkingBiciLayer = null;
let sostenibleDataLoaded = false;
let sostenibleUserMarker = null;
let dragStartIndex = null;

let wordleSetupHTML = "";
let isMuted = false;
let speedLimitsData = null;
let slotBet = 10;
let slotsSpinning = false;
let shopItemsCache = null;

let currentFeedbackType = 'Error';
const ECO_CONFIG = {
  PT_AVG_KM: 3.5,
  BIKE_AVG_KM: 2.5,
  CO2_SAVED_PER_KM: 0.15,
  EURO_SAVED_PER_KM: 0.2
};

let geoMapInstance = null;
let geoLayer = null;
let geoConfig = {
  mode: '',
  round: 0,
  score: 0,
  targetFeatures: [],
  currentTarget: null,
  isAnswered: false
};

let minesConfig = {
  rows: 8,
  cols: 8,
  mines: 10,
  board: [],
  gameOver: false,
  flags: 0,
  diff: 'easy',
  firstClick: true
};

let taxiMapInstance = null;
let taxiLayersGroup = null;
let taxiTileLayer = null;
let taxiDataLoaded = false;

let zbeMapInstance = null;
let zbeTileLayer = null;
let zbeDataLoaded = false;

const ACHIEVEMENTS_DATA = {
  'eco_start': { title: 'Primer paso verde', desc: 'Ahorra tu primer kg de CO2', goal: 1, reward: 100, icon: 'ri-leaf-line', type: 'eco' },
  'eco_hero': { title: 'Héroe de Granada', desc: 'Ahorra 10 kg de CO2', goal: 10, reward: 500, icon: 'ri-plant-fill', type: 'eco' },
  'bus_fan': { title: 'Viajero Frecuente', desc: 'Consulta 25 paradas', goal: 25, reward: 150, icon: 'ri-bus-fill', type: 'stps' },
  'cycling': { title: 'A piñón fijo', desc: 'Registra 10km en bici', goal: 10, reward: 200, icon: 'ri-riding-fill', type: 'bike' },
  'wordle_win': { title: 'Linguista', desc: 'Adivina 5 Granádles', goal: 5, reward: 200, icon: 'ri-chat-check-fill', type: 'game' },
  'sudoku_master': { title: 'Mente Analítica', desc: 'Resuelve 3 Sudokus', goal: 3, reward: 250, icon: 'ri-grid-fill', type: 'game' },
  'quiz_perfect': { title: 'Granadino de Pura Cepa', desc: 'Saca un 10/10 en el Quiz', goal: 1, reward: 300, icon: 'ri-medal-fill', type: 'game' },
  'memory_fast': { title: 'Memoria de Lince', desc: 'Gana en Granámory', goal: 10, reward: 100, icon: 'ri-brain-fill', type: 'game' },
  'mind_expert': { title: 'Descifrador', desc: 'Gana en Granámind', goal: 10, reward: 150, icon: 'ri-lock-unlock-fill', type: 'game' },
  'chain_pro': { title: 'Encadenado', desc: 'Llega a 35 puntos en Encadenadas', goal: 35, reward: 200, icon: 'ri-link', type: 'game' },
  'bj_lucky': { title: 'As del Tapete', desc: 'Gana 10 manos de Blackjack', goal: 10, reward: 200, icon: 'ri-playing-cards-fill', type: 'game' },
  'slot_jackpot': { title: '¡Jackpot!', desc: 'Consigue una línea de Metros', goal: 1, reward: 400, icon: 'ri-money-euro-box-fill', type: 'game' },
  'geo_expert': { title: 'Guía Turístico', desc: 'Acierta 10 municipios en GeoGraná', goal: 10, reward: 250, icon: 'ri-map-2-fill', type: 'game' },
  'mines_expert': { title: 'Barrendero Mayor', desc: 'Gana 5 partidas de BuscaGraná', goal: 5, reward: 200, icon: 'ri-blur-off-fill', type: 'game' },
  'shopper': { title: 'Con Estilo', desc: 'Compra tu primer color de acento', goal: 1, reward: 100, icon: 'ri-palette-fill', type: 'shop' },
  'collector': { title: 'Coleccionista', desc: 'Desbloquea 3 colores distintos', goal: 3, reward: 300, icon: 'ri-paint-brush-fill', type: 'shop' },
  'powerup_user': { title: 'Ventaja Táctica', desc: 'Usa 5 power-ups', goal: 5, reward: 150, icon: 'ri-flashlight-fill', type: 'shop' },
  'ambassador': { title: 'Embajador', desc: 'Comparte la app con amigos', goal: 5, reward: 200, icon: 'ri-share-forward-fill', type: 'soc' },
  'night_owl': { title: 'Búho Nocturno', desc: 'Usa la app después de medianoche', goal: 5, reward: 100, icon: 'ri-moon-clear-fill', type: 'app' },
  'driver_mode': { title: 'Al volante', desc: 'Activa el Modo Conducción', goal: 10, reward: 100, icon: 'ri-steering-2-fill', type: 'app' },
  'loyal': { title: 'Vecino Fiel', desc: 'Abre la app 5 días distintos', goal: 5, reward: 500, icon: 'ri-calendar-check-fill', type: 'app' }
};

function getShopItems() {
  if (shopItemsCache) return shopItemsCache;

  shopItemsCache = {
    colors: [
      { id: "color-default", name: "GranáGo", hex: "#2563eb", price: 0 },
      { id: "color-alhambra", name: "Atardecer Alhambra", hex: "#d97706", price: 5000 },
      { id: "color-sierra", name: "Nieve Sierra", hex: "#06b6d4", price: 6500 },
      { id: "color-generalife", name: "Verde Generalife", hex: "#10b981", price: 7000 },
      { id: "color-sacromonte", name: "Cueva Sacromonte", hex: "#8b5cf6", price: 8000 },
      { id: "color-albaicin", name: "Oro Albaicín", hex: "#f59e0b", price: 10000 },
      { id: "color-darro", name: "Río Darro", hex: "#14b8a6", price: 15000 },
      { id: "color-realejo", name: "Barrio Realejo", hex: "#ec4899", price: 20000 },
    ],
    powerups: [
      { id: "pista-wordle", name: "Lupa Granádle", desc: "Revela una letra", price: 500, icon: "ri-search-eye-line", game: "wordle" },
      { id: "celda-sudoku", name: "Saber-doku", desc: "Resuelve una celda", price: 500, icon: "ri-lightbulb-flash-line", game: "sudoku" },
      { id: "ojo-memory", name: "Ojo de Lince", desc: "Mira las cartas 2s", price: 750, icon: "ri-eye-fill", game: "memory" },
      { id: "mitad-quiz", name: "Cincuenta%", desc: "Quita 2 respuestas", price: 500, icon: "ri-scissors-2-fill", game: "quiz" },
      { id: "codigo-mind", name: "Eco-Código", desc: "Revela 1 posición", price: 500, icon: "ri-radar-line", game: "mastermind" },
      { id: "tiempo-encadenadas", name: "Reloj de Arena", desc: "+15s extra", price: 750, icon: "ri-hourglass-2-fill", game: "encadenadas" },
      { id: "auto-encadenadas", name: "Auto-Cadena", desc: "Encuentra una palabra por ti", price: 1000, icon: "ri-magic-line", game: "encadenadas" },
      { id: "seguro-bj", name: "Seguro GranáJack", desc: "Recupera 50% si pierdes", price: 1000, icon: "ri-shield-check-fill", game: "blackjack" },
      { id: "geo-lince", name: "Geo-Lince", desc: "Marca la respuesta correcta", price: 750, icon: "ri-eye-fill", game: "geograna" },
      { id: "geo-5050", name: "Geo 50/50", desc: "Quita 2 respuestas falsas", price: 500, icon: "ri-scissors-2-fill", game: "geograna" },
    ],
    visualizers: [
      { id: 'vis-cat', name: 'Gato Vibes', price: 10000, file: 'images/cat.gif', icon: 'ri-music-fill' },
      { id: 'vis-rat', name: 'Rata Bailando', price: 7500, file: 'images/rat.gif', icon: 'ri-disc-fill' },
      { id: 'vis-seal', name: 'Foca con Saxofon', price: 5000, file: 'images/seal.gif', icon: 'ri-music-fill' },
      { id: 'vis-pepo', name: 'Pepo DJ', price: 2500, file: 'images/pepo.gif', icon: 'ri-disc-fill' },
      { id: 'vis-top', name: 'Indescriptible', price: 15000, file: 'images/top.gif', icon: 'ri-music-fill' },
      { id: 'vis-homer', name: 'Homer Shakira', price: 12500, file: 'images/homer.gif', icon: 'ri-disc-fill' },
      { id: 'vis-racoon', name: 'Mapache de Fiesta', price: 2500, file: 'images/racoon.gif', icon: 'ri-music-fill' },
      { id: 'vis-dog', name: 'Perreo', price: 5000, file: 'images/dog.gif', icon: 'ri-disc-fill' }
    ]
  };
  return shopItemsCache;
}

function hexToHSL(hex) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

window.useInventoryItem = function (itemId) {
  let inventory = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  if (inventory[itemId] > 0) {
    inventory[itemId]--;
    localStorage.setItem("granaGo_inventory", JSON.stringify(inventory));
    if (document.getElementById("tienda-view").classList.contains("active"))
      renderShop();
    return true;
  }
  showNotification(
    "Sin existencias",
    "Compra este objeto en la GranáTienda",
    "error",
  );
  return false;
};

window.applyAccentColor = function (hex) {
  localStorage.setItem("granaGo_accent_color", hex);

  const isDark = document.body.classList.contains("dark-mode");
  const hsl = hexToHSL(hex);

  const root = document.documentElement;

  root.style.setProperty("--text-accent", hex);
  root.style.setProperty("--color-primary", hex);

  if (isDark) {
    root.style.setProperty(
      "--bg-app",
      `hsl(${hsl.h}, ${Math.min(hsl.s, 30)}%, 8%)`,
    );
    root.style.setProperty(
      "--bg-surface",
      `hsla(${hsl.h}, ${Math.min(hsl.s, 25)}%, 12%, 0.85)`,
    );
    root.style.setProperty(
      "--bg-card",
      `hsl(${hsl.h}, ${Math.min(hsl.s, 20)}%, 15%)`,
    );
  } else {
    root.style.setProperty(
      "--bg-app",
      `hsl(${hsl.h}, ${Math.min(hsl.s, 20)}%, 96%)`,
    );
    root.style.setProperty(
      "--bg-surface",
      `hsla(${hsl.h}, ${Math.min(hsl.s, 15)}%, 98%, 0.85)`,
    );
    root.style.setProperty("--bg-card", `#ffffff`);
  }

  if (document.getElementById("tienda-view")?.classList.contains("active"))
    renderShop();
  const metaColor = document.querySelector('meta[name="theme-color"]');
  if (metaColor)
    metaColor.content = getComputedStyle(root).getPropertyValue("--bg-app");
};

const savedColor = localStorage.getItem("granaGo_accent_color");
if (savedColor) applyAccentColor(savedColor);

async function getGPSLocationName(lat, lon) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
    const data = await res.json();

    return data.locality || data.city || data.principalSubdivision || "Zona desconocida";
  } catch (e) {
    console.error("Error en geocodificación inversa:", e);
    return "Granada";
  }
}

const loadedScripts = {};
let googleTranslateScriptLoaded = false;
let linesDataCache = {
  urbano: { paradas: null, rutas: null, horarios: null },
  metro: { paradas: null, rutas: null, horarios: null },
  interurbano: { paradas: null, rutas: null, horarios: null },
};

const FARE_DATA = {
  urbano: [
    {
      title: "Billete Ordinario",
      price: "1,60€",
      desc: "Pago directo al conductor o en máquinas. Sin transbordo.",
      color: "#D9281C",
    },
    {
      title: "Bus Búho (Nocturno)",
      price: "1,70€",
      desc: "Tarifa para líneas 111 y 121. Pago directo al conductor.",
      badge: "Nocturno",
      color: "#1e293b",
    },
    {
      title: "Credibús 5€",
      price: "0,54€",
      per_trip: true,
      desc: "Tarjeta recargable. Transbordo gratuito (60 min).",
      badge: "Recargable",
      color: "#D9281C",
    },
    {
      title: "Credibús 10€ / 20€",
      price: "0,53€",
      per_trip: true,
      desc: "Máximo ahorro urbano al recargar 10€ o 20€.",
      badge: "Más usado",
      color: "#D9281C",
    },
    {
      title: "Tarjeta Consorcio (Urbano)",
      price: "0,63€",
      per_trip: true,
      desc: "Válida tanto para Joven como para 0 saltos en la capital.",
      badge: "Intermodal",
      color: "#2757f5",
    },
    {
      title: "Bono Mensual",
      price: "24,60€",
      desc: "Viajes ilimitados durante 30 días en toda la red urbana.",
      badge: "Ilimitado",
      color: "#D9281C",
    },
    {
      title: "Bono Joven",
      price: "0,33€",
      per_trip: true,
      desc: "Para residentes en Granada (6-25 años).",
      badge: "Jóvenes",
      color: "#D9281C",
    },
    {
      title: "Bono Pensionista / PMR",
      price: "Gratis",
      desc: "Uso ilimitado para mayores de 65 años o personas con discapacidad.",
      badge: "Especial",
      color: "#10b981",
    },
    {
      title: "Transbordo",
      price: "Gratis",
      desc: "Permitido entre distintas líneas durante 60 min con cualquier bono.",
      color: "#475569",
    }
  ],
  metro: [
    {
      title: "Tarjeta Monedero",
      price: "0,49€",
      per_trip: true,
      desc: "Precio rebajado 2026 (Antes 0,82€). Saldo no caduca.",
      badge: "Mejor Precio",
      color: "#009a44",
    },
    {
      title: "Univiaje",
      price: "1,35€",
      desc: "Billete sencillo para un solo trayecto.",
      color: "#009a44",
    },
    {
      title: "Ida y Vuelta",
      price: "2,70€",
      desc: "Para realizar dos viajes (ida y retorno).",
      color: "#009a44",
    },
    {
      title: "Tarjeta Turística 1 Día",
      price: "4,50€",
      desc: "Viajes ilimitados durante 1 día completo.",
      badge: "Turista",
      color: "#009a44",
    },
    {
      title: "Tarjeta Turística 2 Días",
      price: "9,00€",
      desc: "Viajes ilimitados durante 2 días.",
      color: "#009a44",
    },
    {
      title: "Tarjeta Turística 3 Días",
      price: "13,00€",
      desc: "Viajes ilimitados durante 3 días.",
      color: "#009a44",
    },
    {
      title: "Tarjeta Turística 5 Días",
      price: "20,00€",
      desc: "Viajes ilimitados durante 5 días.",
      color: "#009a44",
    },
    {
      title: "Soporte Flexible (Cartón)",
      price: "0,30€",
      desc: "Coste de la tarjeta física. Reutilizable durante 1 año.",
      color: "#475569",
    },
    {
      title: "Soporte Rígido (PVC)",
      price: "1,80€",
      desc: "Tarjeta de plástico duradera. Reutilizable indefinidamente.",
      color: "#475569",
    },
  ],
  interurbano: [
    {
      title: "Billete Sencillo (0 Saltos)",
      price: "1,55€",
      desc: "Pago directo. Trayectos dentro de la misma zona.",
      color: "#2757f5",
    },
    {
      title: "Tarjeta Consorcio (0 Saltos)",
      price: "0,63€",
      per_trip: true,
      desc: "Precio bonificado. Trayectos sin cambio de zona.",
      badge: "Zona A",
      color: "#2757f5",
    },
    {
      title: "Billete Sencillo (1 Salto)",
      price: "1,60€",
      desc: "Pago directo. Cruce de 1 zona tarifaria.",
      color: "#2757f5",
    },
    {
      title: "Tarjeta Consorcio (1 Salto)",
      price: "0,64€",
      per_trip: true,
      desc: "Precio bonificado. Cruce de 1 zona.",
      badge: "Zona B",
      color: "#2757f5",
    },
    {
      title: "Billete Sencillo (2 Saltos)",
      price: "1,90€",
      desc: "Pago directo. Cruce de 2 zonas tarifarias.",
      color: "#2757f5",
    },
    {
      title: "Tarjeta Consorcio (2 Saltos)",
      price: "0,76€",
      per_trip: true,
      desc: "Precio bonificado. Cruce de 2 zonas.",
      badge: "Zona C",
      color: "#2757f5",
    },
    {
      title: "Billete Sencillo (3 Saltos)",
      price: "3,15€",
      desc: "Pago directo. Cruce de 3 zonas tarifarias.",
      color: "#2757f5",
    },
    {
      title: "Tarjeta Consorcio (3 Saltos)",
      price: "1,30€",
      per_trip: true,
      desc: "Precio bonificado. Cruce de 3 zonas.",
      badge: "Zona D",
      color: "#2757f5",
    },
  ],
};

const PLACES_CONFIG = {
  Parking: { color: "#64748b", icon: "ri-parking-box-fill" },
  "Estación de Autobuses": { color: "#2563eb", icon: "ri-bus-fill" },
  Biblioteca: { color: "#3b82f6", icon: "ri-book-read-fill" },
  Fuente: { color: "#06b6d4", icon: "ri-drop-fill" },
  Comida: { color: "#ef4444", icon: "ri-restaurant-fill" },
  "Lugar de Culto": { color: "#6366f1", icon: "ri-bank-fill" },
  Discoteca: { color: "#a855f7", icon: "ri-music-2-fill" },
  Cine: { color: "#ec4899", icon: "ri-film-fill" },
  Policía: { color: "#1e3a8a", icon: "ri-shield-user-fill" },
  "Guardia Civil": { color: "#064e3b", icon: "ri-shield-star-fill" },
  Bomberos: { color: "#ef4444", icon: "ri-fire-fill" },
  Hospital: { color: "#059669", icon: "ri-hospital-fill" },
  "Centro de Salud": { color: "#10b981", icon: "ri-heart-add-fill" },
  Ayuntamiento: { color: "#475569", icon: "ri-government-fill" },
  Universidad: { color: "#1d4ed8", icon: "ri-graduation-cap-fill" },
  "Oficina de Turismo": { color: "#f59e0b", icon: "ri-information-fill" },
  Mirador: { color: "#0891b2", icon: "ri-landscape-fill" },
  Museo: { color: "#b45309", icon: "ri-bank-line" },
  Monumento: { color: "#78350f", icon: "ri-mickey-fill" },
  Castillo: { color: "#451a03", icon: "ri-ancient-gate-fill" },
  "Sitio Arqueológico": { color: "#92400e", icon: "ri-rest-time-fill" },
  Memorial: { color: "#57534e", icon: "ri-medal-fill" },
  Palacio: { color: "#1e1b4b", icon: "ri-hotel-fill" },
  Estadio: { color: "#15803d", icon: "ri-cup-fill" },
  Jardín: { color: "#166534", icon: "ri-leaf-fill" },
  "Plaza de Toros": { color: "#991b1b", icon: "ri-focus-3-fill" },
  "Centro Comercial": { color: "#db2777", icon: "ri-shopping-bag-3-fill" },
  "Estación de Tren": { color: "#009a44", icon: "ri-train-fill" },
  Iglesia: { color: "#4338ca", icon: "ri-empathize-fill" },
  Catedral: { color: "#3730a3", icon: "ri-ancient-pavilion-fill" },
  Capilla: { color: "#4f46e5", icon: "ri-home-heart-fill" },
  Mezquita: { color: "#065f46", icon: "ri-moon-clear-fill" },
  Monasterio: { color: "#312e81", icon: "ri-infusion-fill" },
  Abadía: { color: "#1e1b4b", icon: "ri-door-lock-fill" },
  default: { color: "#64748b", icon: "ri-map-pin-2-fill" },
};

const DYNAMIC_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

const ICON_RULES = [
  {
    keywords: ["total", "prohibido", "cortado", "cerrado"],
    icon: "ri-prohibited-line",
  },
  {
    keywords: ["parcial", "estrechamiento", "carril"],
    icon: "ri-traffic-light-line",
  },
  {
    keywords: [
      "obra",
      "asfaltado",
      "reparación",
      "mantenimiento",
      "grúa",
      "andamio",
    ],
    icon: "ri-hammer-line",
  },
  {
    keywords: ["mani", "protesta", "concentración", "marcha", "huelga"],
    icon: "ri-megaphone-line",
  },
  {
    keywords: [
      "evento",
      "carrera",
      "deport",
      "maratón",
      "procesión",
      "cabalgata",
      "desfile",
      "vía crucis",
    ],
    icon: "ri-flag-line",
  },
  { keywords: ["agua", "canal", "tubería", "emasagra"], icon: "ri-drop-line" },
  {
    keywords: ["luz", "eléctri", "cable", "endesa"],
    icon: "ri-flashlight-line",
  },
  {
    keywords: ["poda", "árbol", "jardín", "limpieza", "residuos"],
    icon: "ri-leaf-line",
  },
  { keywords: ["rodaje", "película", "cine", "film"], icon: "ri-movie-2-line" },
  { keywords: ["bus", "autobús", "parada", "transporte"], icon: "ri-bus-fill" },
  { keywords: ["mudanza", "carga", "descarga"], icon: "ri-truck-line" },
  {
    keywords: ["emergencia", "bomberos", "policía", "accidente"],
    icon: "ri-alarm-warning-line",
  },
];

const FUEL_MAP = {
  gas95: { key: "Precio Gasolina 95 E5", label: "Gasolina 95" },
  gas98: { key: "Precio Gasolina 98 E5", label: "Gasolina 98" },
  dieselA: { key: "Precio Gasoleo A", label: "Diésel A" },
  dieselPlus: { key: "Precio Gasoleo Premium", label: "Diésel A+" },
  glp: { key: "Precio Gases licuados del petróleo", label: "GLP" },
  electrico: { label: "Carga Eléctrica" },
};

const PARKING_COORDS = {
  alhambra: { lat: 37.1734841, lng: -3.5836266 },
  boutiquelunacentrogranada: { lat: 37.1711898, lng: -3.5991936 },
  escolapios: { lat: 37.166763, lng: -3.594829 },
  estadionuevoloscarmenes: { lat: 37.1513787, lng: -3.595468 },
  ganivet: { lat: 37.1729959, lng: -3.5979376 },
  garajerex: { lat: 37.1715682, lng: -3.6035171 },
  granadacentroalsina: { lat: 37.1746698, lng: -3.6087335 },
  hhmaristas: { lat: 37.1753681, lng: -3.6062214 },
  lacaleta: { lat: 37.1868552, lng: -3.6093206 },
  lahipica: { lat: 37.1612563, lng: -3.5959081 },
  lunadegranada: { lat: 37.176514, lng: -3.6123517 },
  mondragones: { lat: 37.19005, lng: -3.611207 },
  mendeznunez: { lat: 37.1770892, lng: -3.614249 },
  palaciodecongresos: { lat: 37.1663304, lng: -3.5987707 },
  pedroantoniodealarcon: { lat: 37.1733032, lng: -3.6065272 },
  puertareal: { lat: 37.171659, lng: -3.598588 },
  sanagustin: { lat: 37.1778097, lng: -3.5990428 },
  sanjuandedios: { lat: 37.1799589, lng: -3.6034918 },
  sanlazaro: { lat: 37.1866765, lng: -3.606559 },
  socrates: { lat: 37.1751064, lng: -3.6063477 },
  traumatologia: { lat: 37.192952, lng: -3.605983 },
  triunfoave: { lat: 37.184731, lng: -3.605899 },
  victoria: { lat: 37.172974, lng: -3.6000821 },
  violon: { lat: 37.1670793, lng: -3.5984144 },
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (loadedScripts[src]) {
      return resolve();
    }

    if (document.querySelector(`script[src="${src}"]`)) {
      loadedScripts[src] = true;
      return resolve();
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      loadedScripts[src] = true;
      resolve();
    };
    script.onerror = () => {
      console.error(`Error cargando el script: ${src}`);
      reject(new Error(`Fallo al cargar ${src}`));
    };
    document.body.appendChild(script);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  window.history.replaceState({ view: "home" }, "", "#home");
  initTheme();
  initWeather();
  initHomeDashboard();
  initCookieConsent();
  initSupportTimers();
  initConnectionTracker();
  const hasSeenWelcome = localStorage.getItem("granaGo_welcome_seen");
  if (!hasSeenWelcome) {
    document.getElementById("welcome-modal").classList.add("visible");
  }
  const savedLang = localStorage.getItem("granaGo_selected_lang");
  const consent = localStorage.getItem("granaGo_cookie_consent");

  if (consent === "accepted" && savedLang && savedLang !== "es") {
    setTimeout(() => {
      changeLanguage(savedLang);
    }, 1000);
  }
  const homeBtn = document.querySelector(".dock-item-home");
  if (homeBtn) homeBtn.classList.add("active");
});

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.view) {
    navigateTo(event.state.view, false);
  } else {
    navigateTo("home", false);
  }
});

function ensureMapContainerIsClean(elementId) {
  const container = document.getElementById(elementId);
  if (container && container._leaflet_id) {
    container._leaflet_id = null;
    container.innerHTML = "";
  }
}

window.navigateTo = async function (viewId, addToHistory = true) {
  if (viewId !== 'radio') {
    const radioInput = document.getElementById("radio-search-input");
    if (radioInput && radioInput.value !== "") {
      radioInput.value = "";
      const clearBtn = document.getElementById("clear-radio-search-btn");
      if (clearBtn) clearBtn.style.display = "none";

      if (RADIO_STATIONS.length > 0) {
        renderRadioList();
      }
    }
  }

  if (typeof destroyUnusedMaps === "function") {
    destroyUnusedMaps();
  }

  if (addToHistory) {
    window.history.pushState({ view: viewId }, "", `#${viewId}`);
  }

  document
    .querySelectorAll(".view-section")
    .forEach((el) => el.classList.remove("active"));

  const target = document.getElementById(viewId + "-view");
  if (target) target.classList.add("active");

  const fullScreenMapViews = [
    "paradas",
    "lugares",
    "repostar-map",
    "camaras",
    "parkings",
    "ora",
    "zonas-restringidas",
    "zbe",
    "taxi-vtc",
    "movilidad-sostenible",
    "weather"
  ];
  if (fullScreenMapViews.includes(viewId)) {
    document.body.classList.add("noscroll");
  } else {
    document.body.classList.remove("noscroll");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".dock-item, .dock-item-home").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.target === viewId) btn.classList.add("active");
  });

  try {
    const viewsWithMap = [
      "paradas",
      "cortes",
      "lugares",
      "repostar-map",
      "zonas-restringidas",
      "camaras",
      "parkings",
      "ora",
      "linea-detalle",
      "taxi-vtc",
      "zbe",
      "movilidad-sostenible",
    ];

    if (viewsWithMap.includes(viewId)) {
      if (document.getElementById("map-loader")) showLoader(true);
      await loadScript("js/leaflet.js");

      const extraScripts = [];
      if (["paradas", "lugares", "camaras", "repostar-map"].includes(viewId)) {
        extraScripts.push(loadScript("js/leaflet.markercluster.js"));
      }
      if (
        [
          "camaras",
          "ora",
          "zonas-restringidas",
          "taxi-vtc",
          "parkings",
          "movilidad-sostenible",
        ].includes(viewId)
      ) {
        extraScripts.push(loadScript("js/leaflet-omnivore.min.js"));
      }
      await Promise.all(extraScripts);
    }
  } catch (error) {
    console.error("Error cargando scripts:", error);
    showLoader(false);
    return;
  }

  if (viewId === "home") {
    updateHomeRecentWidgets();
    updateHomeEcoWidget();
    updateHomeAchievementsWidget();
  } else if (viewId === "weather") {
    if (!weatherLocationActive) {
      const favs = getWeatherFavorites();
      const locations = [];
      const savedLat = localStorage.getItem("granaGo_last_lat");
      const savedLng = localStorage.getItem("granaGo_last_lng");
      const gpsName = localStorage.getItem("granaGo_gps_name") || "Tu Ubicación";

      if (savedLat && savedLng) {
        locations.push({ lat: savedLat, lon: savedLng, name: gpsName, isGPS: true });
      }
      locations.push({ lat: GRANADA_COORDS.lat, lon: GRANADA_COORDS.lon, name: "Granada" });
      favs.forEach(f => {
        if (f.name !== "Granada" && f.name !== gpsName) locations.push(f);
      });

      const savedIdx = parseInt(localStorage.getItem("granaGo_weather_active_idx") || "0");
      weatherLocationActive = locations[savedIdx] || locations[0];
    }

    initWeatherView(weatherLocationActive.lat, weatherLocationActive.lon, weatherLocationActive.name);
  } else if (viewId === "paradas") {
    showLoader(true);
    setTimeout(() => initMapParadas(), 400);
  } else if (viewId === "lineas") {
    loadLinesData();
  } else if (viewId === "tarifas") {
    renderFares("urbano", document.querySelector("#tarifas-view .tab-pill"));
  } else if (viewId === "favoritos") {
    renderFavoritesList();
  } else if (viewId === "cortes") {
    renderMobilityEvents();
  } else if (viewId === "lugares") {
    initLugaresMap();
  } else if (viewId === "zonas-restringidas") {
    setTimeout(() => initRestriccionesMap(), 200);
  } else if (viewId === "camaras") {
    setTimeout(() => initCamarasMap(), 200);
  } else if (viewId === "parkings") {
    setTimeout(() => initParkingsMap(), 200);
  } else if (viewId === "ora") {
    setTimeout(() => initORAMap(), 200);
  } else if (viewId === "repostar-map") {
    if (typeof initRepostarMap === "function") {
      setTimeout(() => initRepostarMap(), 200);
    }
  } else if (viewId === "taxi-vtc") {
    setTimeout(() => initTaxiMap(), 200);
  } else if (viewId === "zbe") {
    setTimeout(() => initZBEMap(), 200);
  } else if (viewId === "juegos") {
    hideAllGameContainers();
    updateGamesMenuBalance();
    checkDailyReward();
  } else if (viewId === "movilidad-sostenible") {
    setTimeout(() => initSostenibleMap(), 200);
    logAutomatedEcoTrip('bike');
  } else if (viewId === "tienda") {
    hideAllGameContainers();
    updateGamesMenuBalance();
    renderShop();
    const juegosBtn = document.querySelector(
      '.dock-item[data-target="juegos"]',
    );
    if (juegosBtn) juegosBtn.classList.add("active");
  } else if (viewId === "radio") {
    if (RADIO_STATIONS.length === 0) {
      cargarRadiosDesdeAPI();
    } else {
      renderRadioList();
      actualizarUIPlayer();
    }
  }
};

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function normalizeStr(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeName(str) {
  if (!str) return "Cabecera";
  return str
    .toLowerCase()
    .replace(/(?:^|\s|['"([{])+\S/g, (match) => match.toUpperCase())
    .replace(/\(.*\)/, "")
    .trim();
}

function showLoader(visible) {
  const loader = document.getElementById("map-loader");
  if (visible) loader.classList.add("visible");
  else loader.classList.remove("visible");
}

function showPlacesLoader(visible) {
  const loader = document.getElementById("map-loader-places");
  if (loader) {
    if (visible) loader.classList.add("visible");
    else loader.classList.remove("visible");
  }
}

window.showNotification = function (title, message, type = "info", duration = 2500) {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const lastToast = container.lastElementChild;
  if (lastToast) {
    const lastTitle = lastToast.querySelector(".notification-title")?.textContent;
    const lastMessage = lastToast.querySelector(".notification-message")?.textContent;

    if (lastTitle === title && lastMessage === message) {
      return;
    }
  }

  let iconName = "ri-information-fill";
  if (type === "error") iconName = "ri-error-warning-fill";
  if (type === "success") iconName = "ri-checkbox-circle-fill";

  const toast = document.createElement("div");
  toast.className = `notification-toast toast-${type} gpu-accelerated`;

  toast.innerHTML = `
    <i class="notification-icon icon ${iconName}"></i>
    <div class="notification-content">
      <h4 class="notification-title">${title}</h4>
      <p class="notification-message">${message}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hiding");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, duration);
};

function initTheme() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem('last_visit_achievement');
  if (lastVisit !== today) {
    updateAchievement('loyal', 1);
    localStorage.setItem('last_visit_achievement', today);
  }
  const toggle =
    document.getElementById("theme-toggle-view") ||
    document.getElementById("theme-toggle");
  const body = document.body;
  const savedTheme = localStorage.getItem("theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && systemDark)) {
    body.classList.add("dark-mode");
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      const isDark = body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");

      const currentThemeHex =
        localStorage.getItem("granaGo_accent_color") || "#2563eb";
      applyAccentColor(currentThemeHex);

      checkMapTheme();
      checkMapThemePlaces();
      checkMapThemeCortes();
      checkMapThemeRepostar();
    });
  }
}

function getWeatherFavorites() {
  return JSON.parse(localStorage.getItem("granaGo_weather_favs") || "[]");
}

window.toggleWeatherFavorite = function () {
  if (!weatherLocationActive) return;

  if (weatherLocationActive.name === "Granada") {
    showNotification("Información", "Granada es una ubicación fija de la app", "info");
    return;
  }

  let favs = getWeatherFavorites();
  const index = favs.findIndex(f => f.name === weatherLocationActive.name);

  if (index > -1) {
    favs.splice(index, 1);
    showNotification("Eliminado", "Ubicación quitada de favoritos", "info");
  } else {
    favs.push(weatherLocationActive);
    showNotification("Guardado", "Ubicación añadida a favoritos", "success");
  }

  localStorage.setItem("granaGo_weather_favs", JSON.stringify(favs));
  updateWeatherFavIcon();
  initWeather();
};

function updateWeatherFavIcon() {
  const btn = document.getElementById('btn-fav-weather');
  if (!btn || !weatherLocationActive) return;

  if (weatherLocationActive.name === "Tu Ubicación") {
    btn.style.display = "none";
    return;
  } else {
    btn.style.display = "flex";
  }

  const favs = getWeatherFavorites();
  const isFav = favs.some(f => f.name === weatherLocationActive.name) || weatherLocationActive.name === "Granada";

  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = isFav ? 'ri-star-fill' : 'ri-star-line';
    btn.style.color = isFav ? '#fbbf24' : 'inherit';
  }
}

async function initWeather() {
  const container = document.getElementById('weather-widget-carousel');
  if (!container) return;

  const favs = getWeatherFavorites();
  const locations = [];

  const savedLat = localStorage.getItem("granaGo_last_lat");
  const savedLng = localStorage.getItem("granaGo_last_lng");
  const gpsName = localStorage.getItem("granaGo_gps_name") || "Tu Ubicación";

  if (savedLat && savedLng) {
    locations.push({ lat: savedLat, lon: savedLng, name: gpsName, isGPS: true });
  }

  locations.push({ lat: GRANADA_COORDS.lat, lon: GRANADA_COORDS.lon, name: "Granada" });

  favs.forEach(f => {
    if (f.name !== "Granada" && f.name !== gpsName) locations.push(f);
  });

  container.innerHTML = "";

  locations.forEach((loc, index) => {
    const card = document.createElement('div');
    card.className = "weather-card-snap notranslate";
    card.onclick = () => {
      weatherLocationActive = loc;
      navigateTo('weather');
    };
    card.innerHTML = `<div class="skeleton-text" style="height:80px; width:100%"></div>`;
    container.appendChild(card);
    fetchWidgetData(loc, card);
  });

  const savedIndex = parseInt(localStorage.getItem("granaGo_weather_active_idx") || "0");
  setTimeout(() => {
    const cardWidth = container.querySelector('.weather-card-snap')?.offsetWidth || 0;
    container.scrollTo({ left: savedIndex * (cardWidth + 10), behavior: 'auto' });
  }, 100);

  container.onscroll = debounce(() => {
    const idx = Math.round(container.scrollLeft / container.offsetWidth);
    localStorage.setItem("granaGo_weather_active_idx", idx);
  }, 150);
}

async function fetchWidgetData(loc, cardElement) {
  try {
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=european_aqi`)
    ]);

    if (!weatherRes.ok || !aqiRes.ok) throw new Error("Error API");

    const data = await weatherRes.json();
    const aqiData = await aqiRes.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const humidity = data.current.relative_humidity_2m;
    const aqi = aqiData.current.european_aqi;
    const weatherIconName = getWeatherIconName(code);
    const weatherDesc = getWeatherDesc(code);

    let aqiText = "Excelente", aqiColor = "#10b981";
    if (aqi > 20) { aqiText = "Bueno"; aqiColor = "#84cc16"; }
    else if (aqi > 40) { aqiText = "Regular"; aqiColor = "#f59e0b"; }
    else if (aqi > 60) { aqiText = "Pobre"; aqiColor = "#ef4444"; }
    else if (aqi > 80) { aqiText = "Muy Pobre"; aqiColor = "#991b1b"; }

    cardElement.innerHTML = `
            <div class="weather-card-premium">
                <div class="weather-left">
                    <div class="location-badge notranslate">
                        <i class="icon ${loc.isGPS ? 'ri-map-pin-user-fill' : 'ri-map-pin-2-fill'}"></i> ${loc.name}
                    </div>
                    <div class="weather-temp notranslate">${temp}°</div>
                    <div class="weather-desc">${weatherDesc}</div>
                </div>
                
                <div class="weather-right">
                    <i class="icon weather-icon-lg ${weatherIconName}"></i>
                    <div class="weather-meta-row">
                        <div class="weather-meta-item">
                            <i class="ri-drop-line"></i> <span>${humidity}%</span>
                        </div>
                        <div class="weather-meta-item aq-badge" style="--aqi-color: ${aqiColor}">
                            <i class="ri-leaf-line"></i> <span>${aqiText}</span>
                        </div>
                    </div>
                </div>
            </div>`;

  } catch (e) {
    console.error("Error cargando tarjeta de carrusel:", e);
    cardElement.innerHTML = `
            <div class="weather-card-premium" style="justify-content: center; opacity: 0.7;">
                <span class="text-sm"><i class="ri-cloud-off-line"></i> Error de conexión</span>
            </div>`;
  }
}

function getWeatherIconName(code) {
  if (code === 0) return "ri-sun-line";
  if (code === 1 || code === 2) return "ri-sun-cloudy-line";
  if (code === 3) return "ri-cloudy-line";
  if (code >= 45 && code <= 48) return "ri-foggy-line";
  if (code >= 51 && code <= 67) return "ri-showers-line";
  if (code >= 71) return "ri-snowy-line";
  if (code >= 95) return "ri-thunderstorms-line";
  return "ri-temp-hot-line";
}

function getWeatherDesc(code) {
  if (code === 0) return "Despejado";
  if (code >= 1 && code <= 3) return "Nublado";
  if (code >= 45 && code <= 48) return "Niebla";
  if (code >= 51 && code <= 67) return "Lluvia";
  if (code >= 71) return "Nieve";
  if (code >= 95) return "Tormenta";
  return "Normal";
}

function updateMapTheme(map, currentLayer) {
  if (!map) return currentLayer;

  const isDark = document.body.classList.contains("dark-mode");
  const targetUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  if (currentLayer && currentLayer._url === targetUrl) {
    return currentLayer;
  }

  if (currentLayer) {
    map.removeLayer(currentLayer);
  }

  const newLayer = L.tileLayer(targetUrl, {
    maxZoom: 19,
    subdomains: "abcd",
    preferCanvas: true,
  }).addTo(map);
  newLayer.bringToBack();
  return newLayer;
}

function checkMapTheme() {
  currentTileLayer = updateMapTheme(mapInstance, currentTileLayer);
  currentLineTileLayer = updateMapTheme(lineMapInstance, currentLineTileLayer);

  if (typeof placesMapInstance !== "undefined") {
    currentPlacesTileLayer = updateMapTheme(
      placesMapInstance,
      currentPlacesTileLayer,
    );
  }

  if (typeof cortesMapInstance !== "undefined") {
    cortesTileLayer = updateMapTheme(cortesMapInstance, cortesTileLayer);
  }

  if (typeof repostarMap !== "undefined" && repostarMap) {
    repostarTileLayer = updateMapTheme(repostarMap, repostarTileLayer);
  }

  if (typeof camarasMapInstance !== "undefined") {
    camarasTileLayer = updateMapTheme(camarasMapInstance, camarasTileLayer);
  }

  if (typeof parkingsMapInstance !== "undefined") {
    parkingsTileLayer = updateMapTheme(parkingsMapInstance, parkingsTileLayer);
  }

  if (typeof oraMapInstance !== "undefined") {
    oraTileLayer = updateMapTheme(oraMapInstance, oraTileLayer);
  }

  if (typeof restriccionesMap !== "undefined") {
  }

  if (typeof taxiMapInstance !== "undefined" && taxiMapInstance) {
    taxiTileLayer = updateMapTheme(taxiMapInstance, taxiTileLayer);
  }

  if (zbeMapInstance) {
    zbeTileLayer = updateMapTheme(zbeMapInstance, zbeTileLayer);
  }

  if (sostenibleMap) {
    sostenibleTileLayer = updateMapTheme(sostenibleMap, sostenibleTileLayer);
  }
}

function checkMapThemePlaces() {
  currentPlacesTileLayer = updateMapTheme(
    placesMapInstance,
    currentPlacesTileLayer,
  );
}

function checkMapThemeCortes() {
  cortesTileLayer = updateMapTheme(cortesMapInstance, cortesTileLayer);
}

function checkMapThemeRepostar() {
  repostarTileLayer = updateMapTheme(repostarMap, repostarTileLayer);
}

function destroyUnusedMaps() {
  if (mapInstance) {
    mapInstance.off();
    mapInstance.remove();
    mapInstance = null;
    isMapDataLoaded = false;
    currentTileLayer = null;
    userMarker = null;
  }
  const cParadas = document.getElementById("map-paradas");
  if (cParadas) {
    cParadas._leaflet_id = null;
    cParadas.innerHTML = "";
  }

  if (cortesMapInstance) {
    cortesMapInstance.off();
    cortesMapInstance.remove();
    cortesMapInstance = null;
    cortesLayersGroup = null;
    cortesDataLoaded = false;
    cortesTileLayer = null;
  }
  const cCortes = document.getElementById("map-cortes");
  if (cCortes) {
    cCortes._leaflet_id = null;
    cCortes.innerHTML = "";
  }

  if (placesMapInstance) {
    placesMapInstance.off();
    placesMapInstance.remove();
    placesMapInstance = null;
    placesLayers = {};
    placesClusterGroup = null;
    placesDataLoaded = false;
    currentPlacesTileLayer = null;
  }
  const cLugares = document.getElementById("map-lugares");
  if (cLugares) {
    cLugares._leaflet_id = null;
    cLugares.innerHTML = "";
  }
  if (lineMapInstance) {
    lineMapInstance.off();
    lineMapInstance.remove();
    lineMapInstance = null;
    lineLayersGroup = null;
    currentTileLayer = null;
  }
  const cLinea = document.getElementById("map-linea");
  if (cLinea) {
    cLinea._leaflet_id = null;
    cLinea.innerHTML = "";
  }

  if (camarasMapInstance) {
    camarasMapInstance.off();
    camarasMapInstance.remove();
    camarasMapInstance = null;
    camarasClusterGroup = null;
    camarasDataLoaded = false;
    camarasTileLayer = null;
  }
  const cCamaras = document.getElementById("map-camaras");
  if (cCamaras) {
    cCamaras._leaflet_id = null;
    cCamaras.innerHTML = "";
  }

  if (parkingsMapInstance) {
    parkingsMapInstance.off();
    parkingsMapInstance.remove();
    parkingsMapInstance = null;
    parkingsLayerGroup = null;
    motoParkingsLayerGroup = null;
    staticParkingsLayerGroup = null;
    parkingsDataLoaded = false;
    if (parkingInterval) clearInterval(parkingInterval);
    parkingsTileLayer = null;
  }
  const cParkings = document.getElementById("map-parkings");
  if (cParkings) {
    cParkings._leaflet_id = null;
    cParkings.innerHTML = "";
  }

  if (oraMapInstance) {
    oraMapInstance.off();
    oraMapInstance.remove();
    oraMapInstance = null;
    oraLayerGroup = null;
    oraDataLoaded = false;
    oraTileLayer = null;
  }
  const cOra = document.getElementById("map-ora");
  if (cOra) {
    cOra._leaflet_id = null;
    cOra.innerHTML = "";
  }

  if (repostarMap) {
    repostarMap.off();
    repostarMap.remove();
    repostarMap = null;
    repostarLayerGroup = null;
    repostarTileLayer = null;
    repostarUserMarker = null;
  }
  const cRepostar = document.getElementById("map-repostar");
  if (cRepostar) {
    cRepostar._leaflet_id = null;
    cRepostar.innerHTML = "";
  }

  if (restriccionesMap) {
    restriccionesMap.off();
    restriccionesMap.remove();
    restriccionesMap = null;
    currentTileLayer = null;
  }
  const cRestricciones = document.getElementById("map-restricciones");
  if (cRestricciones) {
    cRestricciones._leaflet_id = null;
    cRestricciones.innerHTML = "";
  }

  if (taxiMapInstance) {
    taxiMapInstance.off();
    taxiMapInstance.remove();
    taxiMapInstance = null;
    taxiLayersGroup = null;
    taxiDataLoaded = false;
    taxiTileLayer = null;
  }
  const cTaxi = document.getElementById("map-taxis");
  if (cTaxi) {
    cTaxi._leaflet_id = null;
    cTaxi.innerHTML = "";
  }

  if (zbeMapInstance) {
    zbeMapInstance.off();
    zbeMapInstance.remove();
    zbeMapInstance = null;
    zbeDataLoaded = false;
    zbeTileLayer = null;
  }
  const cZbe = document.getElementById("map-zbe");
  if (cZbe) {
    cZbe._leaflet_id = null;
    cZbe.innerHTML = "";
  }

  if (sostenibleMap) {
    sostenibleMap.off();
    sostenibleMap.remove();
    sostenibleMap = null;
    sostenibleDataLoaded = false;
    sostenibleTileLayer = null;
    sostenibleUserMarker = null;
  }
  const cSM = document.getElementById("map-sostenible");
  if (cSM) {
    cSM._leaflet_id = null;
    cSM.innerHTML = "";
  }

  if (geoMapInstance) {
    geoMapInstance.off();
    geoMapInstance.remove();
    geoMapInstance = null;
  }
  const cGeo = document.getElementById("map-geo");
  if (cGeo) {
    cGeo._leaflet_id = null;
    cGeo.innerHTML = "";
  }
}

function hideAllGameContainers() {
  const containers = [
    "wordle-game-container",
    "sudoku-game-container",
    "memory-game-container",
    "quiz-game-container",
    "mastermind-game-container",
    "encadenadas-game-container",
    "blackjack-game-container",
    "slots-game-container",
    "geograna-game-container",
    "minesweeper-game-container",
  ];

  containers.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const menu = document.getElementById("games-menu");
  if (menu) menu.style.display = "flex";
}

async function initMapParadas() {
  const mapContainer = document.getElementById("map-paradas");
  if (!mapContainer) return;
  ensureMapContainerIsClean("map-paradas");

  try {
    const minimumTimePromise = new Promise((resolve) =>
      setTimeout(resolve, 1000),
    );

    if (!mapInstance) {
      mapInstance = L.map("map-paradas", {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        maxZoom: 19,
      }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);

      L.control
        .attribution({
          prefix: false,
        })
        .addTo(mapInstance);

      mapInstance.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true,
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latlng = [position.coords.latitude, position.coords.longitude];
          mapInstance.flyTo(latlng, 16);

          if (!userMarker) {
            const gpsIcon = L.divIcon({
              className: "gps-marker-container",
              html: `<div class="gps-dot-animated"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });
            userMarker = L.marker(latlng, { icon: gpsIcon }).addTo(mapInstance);
          } else {
            userMarker.setLatLng(latlng);
          }
        },
        (e) => {
          console.log("Auto-gps no disponible o denegado");
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );

      mapInstance.on("popupopen", (e) => {
        const popupNode = e.popup.getElement();
        const btn = popupNode.querySelector(".btn-fav-popup");
        if (btn) {
          const id = btn.getAttribute("data-id");
          const favs = getFavorites();
          const isFav = favs.some((f) => f.id == id);
          if (isFav) {
            btn.classList.add("active");
            btn.innerHTML = '<i class="icon ri-star-fill"></i>';
          } else {
            btn.classList.remove("active");
            btn.innerHTML = '<i class="icon ri-star-line"></i>';
          }
        }
      });

      checkMapTheme();
      const createTransportCluster = (customClass) => {
        return L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 25,
          disableClusteringAtZoom: 16,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            let sizeClass = "cluster-small";
            if (count > 20) sizeClass = "cluster-medium";

            return L.divIcon({
              html: `<span>${count}</span>`,
              className: `custom-cluster ${sizeClass} ${customClass}`,
              iconSize: L.point(40, 40),
            });
          },
        });
      };

      mapLayers.metro = createTransportCluster("cluster-metro-theme").addTo(
        mapInstance,
      );
      mapLayers.urbano = createTransportCluster("cluster-urbano-theme").addTo(
        mapInstance,
      );
      mapLayers.interurbano = createTransportCluster(
        "cluster-inter-theme",
      ).addTo(mapInstance);
    }

    checkMapTheme();

    let dataLoadingPromise = Promise.resolve();
    if (!isMapDataLoaded) {
      dataLoadingPromise = loadAndProcessStops();
      isMapDataLoaded = true;
    }

    await Promise.all([dataLoadingPromise, minimumTimePromise]);

    if (mapInstance) {
      mapInstance.invalidateSize();
    }
  } catch (error) {
    console.error("Error inicializando mapa:", error);
    showNotification("Error", "No se pudo cargar el mapa.", "error");
  } finally {
    showLoader(false);
  }
}

window.toggleMapLayer = function (type, btnElement) {
  if (!mapInstance || !mapLayers[type]) return;
  const isActive = btnElement.classList.contains("active");

  if (isActive) {
    mapInstance.removeLayer(mapLayers[type]);
    btnElement.classList.remove("active");
  } else {
    mapInstance.addLayer(mapLayers[type]);
    btnElement.classList.add("active");
  }
};

window.locateUser = function () {
  if (!mapInstance) return;
  showNotification("Buscando GPS", "Obteniendo tu ubicación...", "info");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const latlng = [lat, lng];

      mapInstance.flyTo(latlng, 16);

      if (userMarker) {
        userMarker.setLatLng(latlng);
      } else {
        const gpsIcon = L.divIcon({
          className: "gps-marker-container",
          html: `<div class="gps-dot-animated"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        userMarker = L.marker(latlng, { icon: gpsIcon }).addTo(mapInstance);
      }

      showNotification(
        "Ubicación encontrada",
        "Te hemos localizado",
        "success",
      );
    },
    (error) => {
      console.warn("Error GPS:", error);
      let msg = "No pudimos acceder a tu ubicación.";
      if (error.code === 1) msg = "Permiso denegado. Activa el GPS.";
      if (error.code === 2) msg = "Señal GPS no disponible.";
      if (error.code === 3) msg = "Tiempo de espera agotado.";

      showNotification("Error GPS", msg, "error");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
};

async function loadAndProcessStops() {
  try {
    const [
      metroStops,
      metroColors,
      urbanoStops,
      urbanoColors,
      interStops,
      interColors,
    ] = await Promise.all([
      fetch("data/metro/paradas.json")
        .then((r) => r.json())
        .catch(() => ({})),
      fetch("data/metro/colores.json")
        .then((r) => r.json())
        .catch(() => ({})),
      fetch("data/urbano/paradas.json")
        .then((r) => r.json())
        .catch(() => ({})),
      fetch("data/urbano/colores.json")
        .then((r) => r.json())
        .catch(() => ({})),
      fetch("data/interurbano/paradas.json")
        .then((r) => r.json())
        .catch(() => ({})),
      fetch("data/interurbano/colores.json")
        .then((r) => r.json())
        .catch(() => ({})),
    ]);

    if (!window.appColors) window.appColors = {};
    window.appColors.urbano = urbanoColors;
    window.appColors.metro = metroColors;
    window.appColors.interurbano = interColors;

    processStops(
      metroStops,
      metroColors,
      mapLayers.metro,
      "#009a44",
      "ri-train-fill",
      "popup-border-metro",
      "metro",
    );
    processStops(
      urbanoStops,
      urbanoColors,
      mapLayers.urbano,
      "#D9281C",
      "ri-bus-fill",
      "popup-border-urbano",
      "urbano",
    );
    processStops(
      interStops,
      interColors,
      mapLayers.interurbano,
      "#2757f5",
      "ri-bus-2-fill",
      "popup-border-inter",
      "interurbano",
    );
  } catch (e) {
    console.error("Error cargando paradas:", e);
    showLoader(false);
  }
}

function processStops(
  stopsJson,
  colorsJson,
  layerGroup,
  mainColor,
  iconName,
  popupClass,
  layerKey,
) {
  const uniqueStops = new Map();

  Object.values(stopsJson).forEach((lineaData) => {
    ["ida", "vuelta"].forEach((dir) => {
      if (!lineaData[dir]) return;
      lineaData[dir].forEach((stop) => {
        const key = `${stop.lat},${stop.lon}`;
        if (!uniqueStops.has(key)) {
          uniqueStops.set(key, { lineas: new Set([stop.linea]), ...stop });
        } else {
          uniqueStops.get(key).lineas.add(stop.linea);
        }
      });
    });
  });

  uniqueStops.forEach((stop) => {
    let lineasArr = Array.from(stop.lineas).sort((a, b) => {
      const strA = String(a);
      const strB = String(b);
      return isNaN(a) || isNaN(b)
        ? strA.localeCompare(strB)
        : parseInt(a) - parseInt(b);
    });

    let badgesHTML = '<div class="line-badges-container">';
    lineasArr.forEach((linea) => {
      const colorLinea = colorsJson[linea] || "#64748b";
      badgesHTML += `<span class="line-badge" style="--line-color: ${colorLinea}">${linea}</span>`;
    });
    badgesHTML += "</div>";

    const customIcon = L.divIcon({
      className: "",
      html: `
        <div class="transport-marker-container" style="background-color: ${mainColor};">
          <i class="icon ${iconName}"></i>
        </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const marker = L.marker([stop.lat, stop.lon], { icon: customIcon });
    let buttonHTML = "";

    if (layerKey === "urbano" || layerKey === "metro" || layerKey === "interurbano") {
      let apiId = "";
      if (layerKey === "urbano") apiId = stop.stop_code;
      else if (layerKey === "metro") apiId = stop.stop_id;
      else if (layerKey === "interurbano") apiId = stop.stop_id;

      if (apiId) {
        const safeName = stop.n.replace(/'/g, "\\'");
        const safeLines = Array.from(stop.lineas)
          .join(", ")
          .replace(/'/g, "\\'");
        const favs = getFavorites();
        const isFav = favs.some((f) => f.id == apiId);
        const starClass = isFav ? "active" : "";
        const starIcon = isFav ? "ri-star-fill" : "ri-star-line";

        buttonHTML = `
                <div class="popup-actions">
                    <button class="btn-realtime-popup"
                            onclick="mapInstance.closePopup(); openRealTimeModal('${apiId}', '${layerKey}', '${safeName}')"
                            aria-label="Ver tiempos">
                        <i class="icon ri-search-line"></i>
                    </button>
                    <button class="btn-fav-popup ${starClass}"
                            data-id="${apiId}" 
                            data-type="${layerKey}"
                            onclick="toggleFavorite('${apiId}', '${layerKey}', '${safeName}', '${safeLines}', this)"
                            aria-label="Favorito">
                        <i class="icon ${starIcon}"></i>
                    </button>
                </div>`;
      }
    }

    marker.bindPopup(
      `<div style="text-align:center; min-width: 150px;">
        <strong class="notranslate" style="font-size:1.1rem; display:block; margin-bottom:4px;">${stop.n}</strong>
        ${badgesHTML}
        ${buttonHTML}
      </div>`,
      {
        className: popupClass,
        autoPan: true,
        closeButton: false,
        offset: [0, -10],
      },
    );

    marker.addTo(layerGroup);

    let idParaGuardar = null;
    if (layerKey === "urbano") idParaGuardar = stop.stop_code;
    else if (layerKey === "metro") idParaGuardar = stop.stop_id;
    else if (layerKey === "interurbano") idParaGuardar = stop.stop_id;

    allSearchableStops.push({
      id: idParaGuardar,
      name: stop.n,
      lat: stop.lat,
      lon: stop.lon,
      marker: marker,
      lines: Array.from(stop.lineas).join(", "),
      typeIcon: iconName,
      layerKey: layerKey,
    });
  });
}

const searchInput = document.getElementById("stop-search-input");
const searchList = document.getElementById("search-results-list");
const clearBtn = document.getElementById("clear-search-btn");

if (searchInput) {
  const handleStopSearch = (e) => {
    const term = e.target.value.toLowerCase().trim();
    clearBtn.style.display = term.length > 0 ? "flex" : "none";

    if (term.length < 2) {
      searchList.classList.remove("visible");
      searchList.innerHTML = "";
      return;
    }
    const results = allSearchableStops
      .filter(
        (stop) =>
          stop.name.toLowerCase().includes(term) ||
          stop.lines.toLowerCase().includes(term),
      )
      .slice(0, 10);
    renderSearchResults(results);
  };
  searchInput.addEventListener("input", debounce(handleStopSearch, 250));
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchList.classList.remove("visible");
    clearBtn.style.display = "none";
  });
}

function renderSearchResults(results) {
  searchList.innerHTML = "";
  if (results.length === 0) {
    searchList.classList.remove("visible");
    return;
  }

  const fragment = document.createDocumentFragment();

  results.forEach((stop) => {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.innerHTML = `
      <i class="icon ${stop.typeIcon} result-icon"></i>
      <div class="result-info">
        <strong>${stop.name}</strong>
        <span>Líneas: ${stop.lines}</span>
      </div>`;

    item.addEventListener("click", () => {
      if (mapInstance) {
        const layerKey = stop.layerKey;
        if (!mapInstance.hasLayer(mapLayers[layerKey])) {
          mapInstance.addLayer(mapLayers[layerKey]);
          const filterBtn = document.querySelector(
            `.filter-chip[data-layer="${layerKey}"]`,
          );
          if (filterBtn) filterBtn.classList.add("active");
          showNotification(
            "Filtro activado",
            `Se ha activado la capa ${layerKey} para mostrar la parada.`,
            "info",
          );
        }
        mapInstance.flyTo([stop.lat, stop.lon], 18, { duration: 1.5 });
        setTimeout(() => {
          stop.marker.openPopup();
        }, 1500);
      }
      searchInput.value = "";
      searchList.classList.remove("visible");
      clearBtn.style.display = "none";
    });

    fragment.appendChild(item);
  });

  searchList.appendChild(fragment);
  searchList.classList.add("visible");
}

async function fetchTransportData(type) {
  showLoader(true);
  try {
    let pathPrefix = `data/${type}/`;
    const [paradas, rutas, horarios, colores] = await Promise.all([
      fetch(`${pathPrefix}paradas.json`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${pathPrefix}rutas.json`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${pathPrefix}horarios.json`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${pathPrefix}colores.json`)
        .then((r) => r.json())
        .catch(() => null),
    ]);

    linesDataCache[type] = { paradas, rutas, horarios };
    if (colores) {
      if (!window.appColors) window.appColors = {};
      window.appColors[type] = { ...window.appColors[type], ...colores };
    }
  } catch (e) {
    console.error(`Error cargando ${type}:`, e);
  } finally {
    showLoader(false);
  }
}

async function loadLinesData() {
  const typeToLoad = currentTransportType || "urbano";

  if (linesDataCache[typeToLoad].paradas) {
    restoreTabState(typeToLoad);
    return;
  }

  showLoader(true);
  try {
    await fetchTransportData(typeToLoad);
    restoreTabState(typeToLoad);
  } catch (e) {
    console.error("Error cargando líneas", e);
    showNotification("Error", "No se pudieron cargar las líneas", "error");
  } finally {
    showLoader(false);
  }
}

function restoreTabState(type) {
  const tabs = document.querySelectorAll("#lineas-view .tab-pill");
  let targetBtn = null;
  tabs.forEach((btn) => {
    const onclickAttr = btn.getAttribute("onclick") || "";
    if (onclickAttr.includes(`'${type}'`)) {
      targetBtn = btn;
    }
  });
  if (!targetBtn) {
    targetBtn = Array.from(tabs).find((t) =>
      t.innerText.toLowerCase().includes(type),
    );
  }
  if (targetBtn) {
    filterLines(type, targetBtn);
  } else if (tabs.length > 0) {
    filterLines(type, tabs[0]);
  }
}

window.filterLines = async function (type, btn) {
  if (currentTransportType && currentTransportType !== type) {
    linesDataCache[currentTransportType] = {
      paradas: null,
      rutas: null,
      horarios: null,
    };
  }
  currentTransportType = type;

  if (btn) {
    document
      .querySelectorAll(".tab-pill")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  const container = document.getElementById("lines-list-container");
  if (!container) return;
  container.className = "lines-list-container fade-in-up";
  container.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';

  if (!linesDataCache[type].paradas) {
    await fetchTransportData(type);
  }

  const data = linesDataCache[type].paradas;
  container.innerHTML = "";

  if (!data) {
    container.innerHTML =
      '<div class="empty-state"><p>No hay datos disponibles.</p></div>';
    return;
  }

  const allIds = Object.keys(data);
  let filteredIds = [];

  if (type === "metro") {
    filteredIds = allIds.filter(
      (id) => id === "1" || id.toUpperCase().includes("M"),
    );
  } else if (type === "interurbano") {
    filteredIds = allIds.filter(
      (id) => !isNaN(id) && id.length >= 3 && id !== "111" && id !== "121",
    );
  } else {
    filteredIds = allIds.filter((id) => {
      const isMetro = id === "1" || id.toUpperCase().includes("M");
      const isInter =
        !isNaN(id) && id.length >= 3 && id !== "111" && id !== "121";
      const isExcluded = id === "1123";
      return !isMetro && !isInter && !isExcluded;
    });
  }

  filteredIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (filteredIds.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Sin líneas.</p></div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  filteredIds.forEach((id) => {
    const lineInfo = data[id];
    let color = "#333";
    if (
      window.appColors &&
      window.appColors[type] &&
      window.appColors[type][id]
    ) {
      color = window.appColors[type][id];
    } else if (
      window.appColors &&
      window.appColors.urbano &&
      window.appColors.urbano[id]
    ) {
      color = window.appColors.urbano[id];
    }

    let nombreLinea = `Línea ${id}`;
    if (
      lineInfo.ida &&
      lineInfo.ida.length > 0 &&
      lineInfo.ida[0].nombre_linea
    ) {
      nombreLinea = lineInfo.ida[0].nombre_linea;
    } else if (
      lineInfo.vuelta &&
      lineInfo.vuelta.length > 0 &&
      lineInfo.vuelta[0].nombre_linea
    ) {
      nombreLinea = lineInfo.vuelta[0].nombre_linea;
    }
    nombreLinea = nombreLinea.replace(/^L\.\s*[\w\d]+\s+/i, "");

    let subtexto = "Ver recorrido";
    if (type === "metro") subtexto = "Metropolitano de Granada";
    else if (type === "interurbano") subtexto = "Consorcio de Transporte";

    const row = document.createElement("div");
    row.className = "line-row-item";
    row.onclick = () => openLineDetail(id, type, color, nombreLinea);

    row.innerHTML = `
            <div class="line-icon-box" style="--line-color: ${color}">
                ${type === "metro"
        ? '<i class="ri-train-fill" style="font-size:1.2rem"></i>'
        : id
      }
            </div>
            <div class="line-info-col">
                <span class="line-info-title notranslate">${nombreLinea}</span>
                <span class="line-info-desc">${subtexto}</span>
            </div>
            <i class="icon ri-arrow-right-s-line line-arrow"></i>`;

    fragment.appendChild(row);
  });

  container.appendChild(fragment);
};

window.openLineDetail = function (lineId, type, color, lineName) {
  currentLineId = lineId;
  currentLineColor = color;
  currentTransportType = type;
  currentLineName = lineName;

  navigateTo("linea-detalle");

  document.getElementById("detail-line-title").innerText = `Línea ${lineId}`;
  document.getElementById("detail-line-desc").innerText = lineName;
  const badge = document.getElementById("detail-line-badge");
  badge.innerText = lineId;
  badge.style.background = color;

  updateLineFavIcon();
  switchLineTab("map");
};

window.switchLineTab = function (tabName) {
  document
    .querySelectorAll(".detail-tab")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));

  const tabs = document.querySelectorAll(".detail-tab");
  if (tabName === "map" && tabs[0]) tabs[0].classList.add("active");
  if (tabName === "list" && tabs[1]) tabs[1].classList.add("active");
  if (tabName === "schedule" && tabs[2]) tabs[2].classList.add("active");

  const content = document.getElementById(`tab-content-${tabName}`);
  if (content) content.classList.add("active");

  if (tabName === "map") renderLineMap();
  if (tabName === "list") renderLineStopsList();
  if (tabName === "schedule") renderLineSchedule();
};

function renderLineMap() {
  setTimeout(() => {
    const mapDiv = document.getElementById("map-linea");
    if (!mapDiv) return;
    ensureMapContainerIsClean("map-linea");
    if (!lineMapInstance) {
      lineMapInstance = L.map("map-linea", {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);
      L.control
        .attribution({
          prefix: false,
        })
        .addTo(lineMapInstance);
      const isDark = document.body.classList.contains("dark-mode");
      const url = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      currentLineTileLayer = L.tileLayer(url).addTo(lineMapInstance);
      lineLayersGroup = L.layerGroup().addTo(lineMapInstance);
    } else {
      lineMapInstance.invalidateSize();
    }

    if (lineLayersGroup) lineLayersGroup.clearLayers();

    const cache = linesDataCache[currentTransportType];
    if (!cache) return;

    const colorIda = currentLineColor;
    const colorVuelta = "#475569";

    const legendIda = document.getElementById("legend-box-ida");
    const legendVuelta = document.getElementById("legend-box-vuelta");
    if (legendIda) legendIda.style.background = colorIda;
    if (legendVuelta) legendVuelta.style.background = colorVuelta;

    const routeData = cache.rutas ? cache.rutas[currentLineId] : null;

    if (routeData) {
      if (routeData.ida && Array.isArray(routeData.ida)) {
        const polylineIda = L.polyline(routeData.ida, {
          color: colorIda,
          weight: 5,
          opacity: 0.8,
          lineJoin: "round",
          smoothFactor: 2.0,
        });
        polylineIda.addTo(lineLayersGroup);
        lineMapInstance.fitBounds(polylineIda.getBounds(), {
          padding: [30, 30],
        });
      }
      if (routeData.vuelta && Array.isArray(routeData.vuelta)) {
        const polylineVuelta = L.polyline(routeData.vuelta, {
          color: colorVuelta,
          weight: 5,
          opacity: 0.7,
          lineJoin: "round",
          dashArray: "1, 6",
          smoothFactor: 2.0,
        });
        polylineVuelta.addTo(lineLayersGroup);
      }
    }

    const stopsData = cache.paradas ? cache.paradas[currentLineId] : null;

    if (stopsData) {
      const drawStops = (list, color, label) => {
        if (!list) return;
        list.forEach((stop) => {
          const marker = L.circleMarker([stop.lat, stop.lon], {
            radius: 5,
            fillColor: color,
            color: "#ffffff",
            weight: 1.5,
            opacity: 1,
            fillOpacity: 1,
            renderer: L.canvas(),
          });
          marker.bindPopup(`
                <div style="text-align:center;">
                    <strong style="color:${color}">${label}</strong><br>
                    ${stop.n}
                </div>`);
          marker.addTo(lineLayersGroup);
        });
      };
      drawStops(stopsData.ida, colorIda, "IDA");
      drawStops(stopsData.vuelta, colorVuelta, "VUELTA");
    }
  }, 200);
}

function renderLineStopsList() {
  const container = document.getElementById("line-stops-list");
  if (!container) return;
  container.innerHTML = "";

  const cache = linesDataCache[currentTransportType];
  const lineData = cache.paradas ? cache.paradas[currentLineId] : null;

  if (!lineData) {
    container.innerHTML =
      '<p class="empty-state">Información de paradas no disponible.</p>';
    return;
  }

  const colorIda = currentLineColor;
  const colorVuelta = "#475569";

  const getTransfers = (stop) => {
    const isInter = currentTransportType === "interurbano";
    const compareKey = isInter ? "stop_id" : "stop_code";
    const myValue = stop[compareKey];
    if (!myValue) return [];

    const connections = [];
    const allLines = cache.paradas;
    Object.keys(allLines).forEach((otherLineId) => {
      if (otherLineId === currentLineId) return;
      const otherLine = allLines[otherLineId];
      const matchIda =
        otherLine.ida && otherLine.ida.some((s) => s[compareKey] === myValue);
      const matchVuelta =
        !matchIda &&
        otherLine.vuelta &&
        otherLine.vuelta.some((s) => s[compareKey] === myValue);
      if (matchIda || matchVuelta) connections.push(otherLineId);
    });
    return connections.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  };

  const createColumn = (stops, title, columnColor) => {
    const colDiv = document.createElement("div");
    colDiv.className = "stops-column";
    colDiv.style.setProperty("--column-color", columnColor);

    const header = document.createElement("div");
    header.className = "stops-column-header";
    header.innerText = title;
    colDiv.appendChild(header);

    if (!stops || stops.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.style.padding = "10px";
      emptyMsg.style.fontSize = "0.75rem";
      emptyMsg.style.color = "var(--text-secondary)";
      emptyMsg.innerText = "Sin servicio";
      colDiv.appendChild(emptyMsg);
      return colDiv;
    }

    const fragment = document.createDocumentFragment();

    stops.forEach((stop) => {
      const item = document.createElement("div");
      item.className = "stop-item";
      const transfers = getTransfers(stop);
      let badgesHtml = "";

      if (transfers.length > 0) {
        badgesHtml = '<div class="transfers-container">';
        transfers.forEach((lineId) => {
          let badgeColor = "#94a3b8";
          if (
            window.appColors &&
            window.appColors[currentTransportType] &&
            window.appColors[currentTransportType][lineId]
          ) {
            badgeColor = window.appColors[currentTransportType][lineId];
          } else if (
            window.appColors &&
            window.appColors.urbano &&
            window.appColors.urbano[lineId]
          ) {
            badgeColor = window.appColors.urbano[lineId];
          }
          badgesHtml += `<span class="transfer-badge" style="--badge-color: ${badgeColor}">${lineId}</span>`;
        });
        badgesHtml += "</div>";
      }

      item.innerHTML = `
                <div class="stop-dot"></div>
                <div class="stop-info-wrapper">
                    <div class="stop-name notranslate" 
                         onclick="mapInstance.flyTo([${stop.lat}, ${stop.lon}], 18); navigateTo('paradas'); showNotification('Ubicación', 'Mostrando parada en mapa', 'info');">
                        ${stop.n}
                    </div>
                    ${badgesHtml}
                </div>`;

      fragment.appendChild(item);
    });

    colDiv.appendChild(fragment);
    return colDiv;
  };

  const gridContainer = document.createElement("div");
  gridContainer.className = "stops-two-columns";
  const colIda = createColumn(lineData.ida, "IDA", colorIda);
  const colVuelta = createColumn(lineData.vuelta, "VUELTA", colorVuelta);

  gridContainer.appendChild(colIda);
  gridContainer.appendChild(colVuelta);
  container.appendChild(gridContainer);
}

function renderLineSchedule() {
  const container = document.getElementById("schedule-container");
  if (!container) return;
  container.innerHTML = "";

  const cache = linesDataCache[currentTransportType];
  const scheduleData = cache.horarios ? cache.horarios[currentLineId] : null;

  if (!scheduleData) {
    container.innerHTML =
      '<div class="empty-state"><p>Horarios no disponibles.</p></div>';
    return;
  }

  const gridDiv = document.createElement("div");
  gridDiv.style.display = "grid";
  gridDiv.style.gridTemplateColumns = "1fr 1fr";
  gridDiv.style.gap = "15px";

  const createScheduleCard = (title, daysObj, colorTitle) => {
    const col = document.createElement("div");
    col.innerHTML = `<h4 style="color:${colorTitle}; margin:0 0 10px 0; text-align:center; text-transform:uppercase; font-size:0.9rem;">${title}</h4>`;
    const order = ["L-J", "V", "S", "D"];
    const labels = {
      "L-J": "Lunes a Jueves",
      V: "Viernes",
      S: "Sábados",
      D: "Domingos y Festivos",
    };

    order.forEach((dayKey) => {
      const data = daysObj[dayKey];
      const card = document.createElement("div");
      card.style.background = "var(--bg-surface)";
      card.style.border = "1px solid var(--border-subtle)";
      card.style.borderRadius = "10px";
      card.style.padding = "10px";
      card.style.marginBottom = "8px";
      card.style.textAlign = "center";

      if (data) {
        if (Array.isArray(data)) {
          let timesHtml = '<div class="times-grid">';
          data.forEach((time) => {
            timesHtml += `<span class="time-chip">${time}</span>`;
          });
          timesHtml += "</div>";
          card.innerHTML = `<div class="schedule-day-title">${labels[dayKey]}</div>${timesHtml}`;
        } else {
          card.innerHTML = `
                <div class="schedule-day-title">${labels[dayKey]}</div>
                <div style="display:flex; justify-content:space-around; align-items:center;">
                    <div>
                        <span style="display:block; font-size:0.7rem; color:var(--text-secondary);">Primera Salida</span>
                        <span style="font-weight:800; font-size:1.1rem; color:var(--text-primary);">${data.inicio}</span>
                    </div>
                    <div style="width:1px; height:20px; background:var(--border-subtle);"></div>
                    <div>
                        <span style="display:block; font-size:0.7rem; color:var(--text-secondary);">Última Salida</span>
                        <span style="font-weight:800; font-size:1.1rem; color:var(--text-primary);">${data.fin}</span>
                    </div>
                </div>`;
        }
      } else {
        card.style.opacity = "0.6";
        card.innerHTML = `
            <div class="schedule-day-title">${labels[dayKey]}</div>
            <div style="font-size:0.85rem; margin-top:4px;">Sin servicio</div>`;
      }
      col.appendChild(card);
    });
    return col;
  };

  const colIda = createScheduleCard("IDA", scheduleData.ida, currentLineColor);
  const colVuelta = createScheduleCard(
    "VUELTA",
    scheduleData.vuelta,
    "#64748b",
  );

  gridDiv.appendChild(colIda);
  gridDiv.appendChild(colVuelta);
  container.appendChild(gridDiv);
}

window.openRealTimeModal = function (apiId, type, stopName) {
  const modal = document.getElementById("realtime-modal");
  const title = document.getElementById("realtime-stop-title");
  const content = document.getElementById("realtime-content");

  title.innerText = stopName;
  content.innerHTML = '<div class="spinner" style="margin: 30px auto;"></div>';
  modal.classList.add("visible");
  if (type === "urbano" || type === "metro" || type === "interurbano") {
    trackRecentItem("granaGo_recent_stops", {
      id: apiId,
      type,
      name: stopName,
    });
  }
  updateAchievement('bus_fan', 1);
  logAutomatedEcoTrip('pt');
  fetchRealTimeData(apiId, type);
};

window.closeRealTimeModal = function () {
  const modal = document.getElementById("realtime-modal");
  if (modal) modal.classList.remove("visible");
};

document.addEventListener("click", (e) => {
  const modal = document.getElementById("realtime-modal");
  if (modal && e.target === modal && modal.classList.contains("visible")) {
    closeRealTimeModal();
  }
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("home-editor-modal");
  if (modal && e.target === modal && modal.classList.contains("visible")) {
    closeHomeEditor();
  }
});

async function fetchRealTimeData(id, type) {
  const content = document.getElementById("realtime-content");
  const cacheKey = `${type}_${id}`;
  const now = Date.now();

  if (realtimeCache.has(cacheKey)) {
    const cached = realtimeCache.get(cacheKey);
    if (now - cached.timestamp < 20000) {
      renderRealTimeResults(cached.data, type);
      return;
    }
  }

  if (currentRTController) currentRTController.abort();
  currentRTController = new AbortController();

  try {
    let url = "";
    if (type === "urbano") {
      url = `${API_BASE}/bus/llegadas/${id}`;
    } else if (type === "metro") {
      const numericId = parseInt(id);
      const finalId = 100 + numericId;
      url = `${API_BASE}/metro/llegadas/${finalId}`;
    } else if (type === "interurbano") {
      const [resTiempos, resParadas] = await Promise.all([
        fetch("data/interurbano/tiempos_proximos.json"),
        fetch("data/interurbano/paradas.json")
      ]);

      const allData = await resTiempos.json();
      const paradasInfo = await resParadas.json();
      const stopData = allData[id];

      if (!stopData) {
        content.innerHTML = `<div class="status-message" style="text-align:center; padding:20px;">Sin horarios disponibles para esta parada.</div>`;
        return;
      }

      const proximos = [];
      const nowDate = new Date();
      const currentTime = nowDate.getHours().toString().padStart(2, '0') + ":" +
        nowDate.getMinutes().toString().padStart(2, '0');

      const day = nowDate.getDay();
      let dayKey = "L-J";
      if (day === 5) dayKey = "V";
      else if (day === 6) dayKey = "S";
      else if (day === 0) dayKey = "D";

      for (const [lineaId, schedule] of Object.entries(stopData)) {
        const times = schedule[dayKey] || [];
        const nextTimes = times.filter(t => t > currentTime).slice(0, 2);
        const lineName = paradasInfo[lineaId]?.ida[0]?.nombre_linea || `Línea ${lineaId}`;

        nextTimes.forEach(t => {
          const [h, m] = t.split(":").map(Number);
          const arrivalDate = new Date();
          arrivalDate.setHours(h, m, 0, 0);
          const diffMin = Math.round((arrivalDate - nowDate) / 60000);

          proximos.push({
            linea: lineaId,
            destino: lineName,
            minutos: diffMin,
            horaExacta: t
          });
        });
      }

      proximos.sort((a, b) => a.minutos - b.minutos);

      renderRealTimeResults({ proximos }, "interurbano");
      realtimeCache.set(cacheKey, { data: { proximos }, timestamp: Date.now() });
      return;
    }

    const res = await fetch(url, { priority: 'high' });
    if (!res.ok) throw new Error("Error API");
    const data = await res.json();
    realtimeCache.set(cacheKey, { data, timestamp: now });
    renderRealTimeResults(data, type);
  } catch (e) {
    if (e.name === 'AbortError') return;
    console.error("Error Tiempos:", e);
    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 0 && currentHour < 7;
    const errorIcon = isNightTime ? "🌙" : "⚠️";
    const errorMsg = isNightTime ? "Servicio nocturno" : UNAVAILABLE_MESSAGE;

    content.innerHTML = `
      <div class="status-message" style="text-align:center; padding:20px; color:var(--text-secondary);">
         <span style="font-size:2rem; display:block; margin-bottom:10px;">${errorIcon}</span>
         <span style="font-weight:600;">${errorMsg}</span>
         ${isNightTime
        ? '<p style="font-size:0.8rem; margin-top:5px;">Sin estimaciones en este horario</p>'
        : ""
      }
      </div>`;
  }
}

function renderRealTimeResults(data, type) {
  const content = document.getElementById("realtime-content");
  let html = "";
  let arrivals = data.proximos || [];

  if (!arrivals.length) {
    content.innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--text-secondary);">
            <span style="font-size:2rem; display:block; margin-bottom:10px;">🚍</span>
            <span>Sin estimaciones próximas</span>
        </div>`;
    return;
  }

  html += `<div class="arrival-list">`;

  if (type === "metro") {
    const grouped = {};
    arrivals.forEach((p) => {
      const dest = p.direccion;
      if (!grouped[dest]) grouped[dest] = [];
      grouped[dest].push(p);
    });

    Object.keys(grouped).forEach((dest) => {
      html += `<div style="margin-bottom:15px;">`;
      html += `<div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">HACIA ${dest}</div>`;
      grouped[dest].forEach((p) => {
        const timeObj = formatTime(p.minutos, "metro");
        html += createRowHTML(
          timeObj,
          "M",
          "#009a44",
          "ri-train-fill",
          "Metro",
        );
      });
      html += `</div>`;
    });
  } else {
    arrivals.sort((a, b) => a.minutos - b.minutos);
    arrivals.forEach((p) => {
      const lineId = (p.linea?.id || p.linea || "?").toString();
      const regexRedundancy = new RegExp(
        `^(L[íi]nea\\s+)?${lineId}\\s*[-]?\\s*`,
        "i",
      );
      const destinoClean = p.destino.replace(regexRedundancy, "").trim();
      let timeObj;
      if (type === "interurbano" && p.minutos > 30) {
        timeObj = { text: p.horaExacta, class: "time-bus" };
      } else {
        timeObj = formatTime(p.minutos, "urbano");
      }
      const realColor =
        window.appColors &&
          window.appColors[type] &&
          window.appColors[type][lineId]
          ? window.appColors[type][lineId]
          : (type === "interurbano" ? "#2757f5" : "#D9281C");
      html += createRowHTML(timeObj, lineId, realColor, null, destinoClean);
    });
  }

  html += `</div>`;
  content.innerHTML = html;
}

function createRowHTML(
  timeObj,
  badgeText,
  badgeColor,
  iconClass,
  destinationName,
) {
  const leftContent = iconClass
    ? `<i class="icon ${iconClass}" style="color: ${badgeColor}; font-size: 1.4rem;"></i>
       <span class="arrival-dest-text">${destinationName}</span>`
    : `<span class="arrival-badge-box" style="background-color: ${badgeColor}">${badgeText}</span>
       <span class="arrival-dest-text">${destinationName}</span>`;

  return `
    <div class="arrival-item-row">
      <div class="flex items-center gap-3">
        ${leftContent}
      </div>
      <span class="${timeObj.class} arrival-time-value">${timeObj.text}</span>
    </div>`;
}

function formatTime(minutes, type) {
  const min = parseInt(minutes);
  if (isNaN(min)) return { text: "--", class: "" };
  if (min === 0) return { text: "AHORA", class: "time-llegando" };
  const colorClass = type === "metro" ? "time-metro" : "time-bus";
  return { text: `${min} min`, class: colorClass };
}

function getFavorites() {
  const saved = localStorage.getItem("granaGo_favs");
  return saved ? JSON.parse(saved) : [];
}

function getFavoriteLines() {
  const saved = localStorage.getItem("granaGo_fav_lines");
  return saved ? JSON.parse(saved) : [];
}

window.toggleFavorite = function (id, type, name, linesStr, btnElement) {
  let favs = getFavorites();
  const index = favs.findIndex((f) => f.id == id);
  const isFav = index !== -1;

  if (isFav) {
    favs.splice(index, 1);
    showNotification("Eliminado", "Parada borrada de favoritos", "info");
    if (btnElement) {
      btnElement.classList.remove("active");
      btnElement.innerHTML = '<i class="icon ri-star-line"></i>';
    }
  } else {
    favs.push({ id, type, name, lines: linesStr });
    showNotification("Guardado", "Parada añadida a favoritos", "success");
    if (btnElement) {
      btnElement.classList.add("active");
      btnElement.innerHTML = '<i class="icon ri-star-fill"></i>';
    }
  }
  localStorage.setItem("granaGo_favs", JSON.stringify(favs));
  if (document.getElementById("favoritos-view").classList.contains("active")) {
    renderFavoritesList();
  }
};

window.toggleCurrentLineFav = function () {
  let favs = getFavoriteLines();
  const index = favs.findIndex(
    (f) => f.id === currentLineId && f.type === currentTransportType,
  );

  if (index !== -1) {
    favs.splice(index, 1);
    showNotification("Eliminada", "Línea quitada de favoritos", "info");
  } else {
    favs.push({
      id: currentLineId,
      type: currentTransportType,
      color: currentLineColor,
      name: currentLineName,
    });
    showNotification("Guardada", "Línea añadida a favoritos", "success");
  }
  localStorage.setItem("granaGo_fav_lines", JSON.stringify(favs));
  updateLineFavIcon();
};

window.deleteFavLine = function (id, type) {
  let favs = getFavoriteLines();
  const index = favs.findIndex((f) => f.id === id && f.type === type);
  if (index !== -1) {
    favs.splice(index, 1);
    localStorage.setItem("granaGo_fav_lines", JSON.stringify(favs));
    renderFavoritesList();
    showNotification("Eliminada", "Línea borrada de favoritos", "info");
  }
};

function updateLineFavIcon() {
  const btn = document.getElementById("btn-fav-line");
  if (!btn) return;
  const favs = getFavoriteLines();
  const isFav = favs.some(
    (f) => f.id === currentLineId && f.type === currentTransportType,
  );
  if (isFav) {
    btn.innerHTML = '<i class="icon ri-star-fill" style="color:#fbbf24"></i>';
  } else {
    btn.innerHTML = '<i class="icon ri-star-line"></i>';
  }
}

function renderFavoritesList() {
  const container = document.getElementById("favorites-list");
  const favLines = getFavoriteLines();
  const favStops = getFavorites();
  container.innerHTML = "";

  if (favLines.length === 0 && favStops.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="icon ri-heart-add-line" style="font-size: 3rem; opacity:0.3; margin-bottom:10px;"></i>
                <p>No tienes favoritos guardados.</p>
                <div style="font-size:0.85rem; margin-top:5px; opacity:0.7;">Guarda paradas desde el mapa o líneas desde su ficha.</div>
            </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  if (favLines.length > 0) {
    const header = document.createElement("h3");
    header.innerText = "Líneas Guardadas";
    header.style.margin = "10px 0 10px 5px";
    header.style.fontSize = "0.95rem";
    header.style.opacity = "0.7";
    fragment.appendChild(header);

    favLines.forEach((l) => {
      const card = document.createElement("div");
      card.className = "fav-card";
      card.innerHTML = `
                <div class="fav-info" onclick="openLineDetail('${l.id}', '${l.type
        }', '${l.color}', '${l.name}')" style="cursor:pointer; flex:1;">
                    <div class="fav-icon-box" style="background-color:${l.color
        }; color:white; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.1rem;">
                        ${l.type === "metro"
          ? '<i class="ri-train-fill"></i>'
          : l.id
        }
                    </div>
                    <div class="fav-text">
                        <h4>Línea ${l.id}</h4>
                        <p>${l.name}</p>
                    </div>
                </div>
                <div class="fav-actions">
                    <button class="icon-btn-small" onclick="deleteFavLine('${l.id
        }', '${l.type}')">
                         <i class="icon ri-delete-bin-line" style="color:#ef4444; font-size:1.2rem;"></i>
                    </button>
                </div>`;
      fragment.appendChild(card);
    });
  }

  if (favStops.length > 0) {
    const header = document.createElement("h3");
    header.innerText = "Paradas Guardadas";
    header.style.margin = "20px 0 10px 5px";
    header.style.fontSize = "0.95rem";
    header.style.opacity = "0.7";
    fragment.appendChild(header);

    favStops.forEach((f) => {
      let iconClass = f.type === "metro" ? "ri-train-fill" : "ri-bus-fill";
      let bgStyle = f.type === "metro"
        ? "background: rgba(0, 154, 68, 0.1); color:#009a44;"
        : "background: rgba(217, 40, 28, 0.1); color:#D9281C;";

      if (f.type === "interurbano") {
        iconClass = "ri-bus-2-fill";
        bgStyle = "background: rgba(39, 87, 245, 0.1); color:#2757f5;";
      }
      const safeName = f.name.replace(/'/g, "\\'");

      const card = document.createElement("div");
      card.className = "fav-card";
      card.innerHTML = `
                <div class="fav-info" onclick="openRealTimeModal('${f.id}', '${f.type
        }', '${safeName}')" style="cursor:pointer; flex:1;">
                    <div class="fav-icon-box" style="${bgStyle}">
                        <i class="icon ${iconClass}"></i>
                    </div>
                    <div class="fav-text">
                        <h4>${f.name}</h4>
                        <p>${f.type === "metro"
          ? "Metro de Granada"
          : "Líneas: " + f.lines
        }</p>
                    </div>
                </div>
                <div class="fav-actions">
                    <button class="icon-btn-small" onclick="openRealTimeModal('${f.id
        }', '${f.type}', '${safeName}')">
                         <i class="icon ri-time-line" style="color:var(--text-accent); font-size:1.2rem;"></i>
                    </button>
                    <button class="icon-btn-small" onclick="toggleFavorite('${f.id
        }', '${f.type}', '${safeName}', '', null)">
                         <i class="icon ri-delete-bin-line" style="color:#ef4444; font-size:1.2rem;"></i>
                    </button>
                </div>`;
      fragment.appendChild(card);
    });
  }

  container.appendChild(fragment);
}

window.renderFares = function (type, btn) {
  if (btn) {
    document
      .querySelectorAll(".tab-pill")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  const container = document.getElementById("fares-container");
  if (!container) return;
  container.innerHTML = "";

  const data = FARE_DATA[type] || [];

  const fragment = document.createDocumentFragment();

  data.forEach((item) => {
    const perTripHtml = item.per_trip ? "<span>/viaje</span>" : "";
    const badgeHtml = item.badge
      ? `<span class="fare-badge">${item.badge}</span>`
      : "";
    const card = document.createElement("div");
    card.className = "fare-card";
    card.style.setProperty("--fare-color", item.color);

    card.innerHTML = `
            <div class="fare-header">
                <h3 class="fare-title">${item.title}</h3>
                ${badgeHtml}
            </div>
            <div class="fare-price">
                ${item.price}${perTripHtml}
            </div>
            <p class="fare-desc">${item.desc}</p>`;
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
};

async function initLugaresMap() {
  const mapContainer = document.getElementById("map-lugares");
  if (!mapContainer) return;
  ensureMapContainerIsClean("map-lugares");
  showPlacesLoader(true);

  if (!placesMapInstance) {
    placesMapInstance = L.map("map-lugares", {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      maxZoom: 19,
    }).setView([37.1773, -3.5986], 14);
    L.control
      .attribution({
        prefix: false,
      })
      .addTo(placesMapInstance);
    placesMapInstance.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
    });

    checkMapThemePlaces();

    placesClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 25,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let cClass = "cluster-small";
        if (count > 10) cClass = "cluster-medium";
        if (count > 50) cClass = "cluster-large";

        return L.divIcon({
          html: `<span>${count}</span>`,
          className: `custom-cluster ${cClass}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    placesMapInstance.addLayer(placesClusterGroup);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        placesMapInstance.flyTo(latlng, 16);

        const gpsIcon = L.divIcon({
          className: "gps-marker-container",
          html: `<div class="gps-dot-animated"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker(latlng, { icon: gpsIcon }).addTo(placesMapInstance);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 3000 },
    );
  }

  if (!placesDataLoaded) {
    try {
      const response = await fetch("data/poi_final.geojson");
      const data = await response.json();
      const filterContainer = document.getElementById("filters-container-list");

      allSearchablePlaces = [];

      L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          const lon = feature.geometry.coordinates[0];
          const lat = feature.geometry.coordinates[1];

          if (lat < 35 || lat > 44 || lon < -10 || lon > 4) {
            console.warn(
              "Punto descartado por estar fuera de España:",
              feature.properties.name,
            );
            return null;
          }
          const category = feature.properties.category || "default";
          const config = PLACES_CONFIG[category] || PLACES_CONFIG["default"];

          const marker = L.marker(latlng, {
            icon: L.divIcon({
              className: "",
              html: `<div class="transport-marker-container" style="background-color: ${config.color}; border: 2px solid white;">
                        <i class="icon ${config.icon}" style="font-size: 16px; color: white;"></i>
                     </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -15],
            }),
          });

          marker.bindPopup(
            `<div style="text-align:center; padding: 5px 0;">
      <strong style="font-size:1rem; display:block; line-height:1.2; margin-bottom:4px;">${feature.properties.name}</strong>
      <small style="color:var(--text-secondary); display:block; margin-bottom:10px;">${category}</small>
      
      <button class="btn-navigate-popup" onclick="openMapsApp(${lat}, ${lon})">
          <i class="icon ri-direction-fill"></i> IR
      </button>
  </div>`,
            { closeButton: false },
          );

          if (!placesLayers[category]) {
            placesLayers[category] = L.layerGroup();
            if (filterContainer)
              createFilterItem(category, config, filterContainer);
          }
          marker.addTo(placesLayers[category]);
          placesClusterGroup.addLayer(marker);

          allSearchablePlaces.push({
            name: feature.properties.name || "",
            category: category,
            latlng: latlng,
            icon: config.icon,
          });

          return marker;
        },
      });

      setupPlacesSearch();
      placesDataLoaded = true;
    } catch (e) {
      console.error("Error cargando lugares:", e);
      showNotification(
        "Error",
        "No se pudieron cargar los puntos de interés",
        "error",
      );
    }
  }

  setTimeout(() => {
    placesMapInstance.invalidateSize();
    showPlacesLoader(false);
  }, 400);
}

function createFilterItem(category, config, container) {
  if (!container) return;
  const label = document.createElement("label");
  label.style = `
        display: flex; align-items: center; gap: 8px; 
        padding: 10px 12px; background: var(--bg-app); border-radius: 14px;
        cursor: pointer; transition: transform 0.1s; border: 1px solid var(--border-subtle);
    `;
  label.innerHTML = `
        <input type="checkbox" checked data-cat="${category}" 
               onchange="toggleCategoryLayer('${category}', this.checked)" 
               style="width: 18px; height: 18px; accent-color: ${config.color}; cursor: pointer; flex-shrink: 0;">
        <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${category}
        </span>
    `;
  label.addEventListener(
    "touchstart",
    () => (label.style.transform = "scale(0.96)"),
  );
  label.addEventListener(
    "touchend",
    () => (label.style.transform = "scale(1)"),
  );
  container.appendChild(label);
}

window.togglePlacesFilters = function () {
  const overlay = document.getElementById("places-filters-overlay");
  const panel = document.getElementById("places-filters-panel");
  if (!overlay || !panel) return;

  if (overlay.style.display === "none" || overlay.style.display === "") {
    overlay.style.display = "block";
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      panel.style.transform = "translateY(0)";
    });
  } else {
    overlay.style.opacity = "0";
    panel.style.transform = "translateY(calc(100% + 150px))";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }
};

window.toggleCategoryLayer = function (category, isVisible) {
  if (!placesLayers[category] || !placesClusterGroup) return;

  if (isVisible) {
    placesClusterGroup.addLayer(placesLayers[category]);
  } else {
    placesClusterGroup.removeLayer(placesLayers[category]);
  }
};

window.setAllFilters = function (state) {
  const checkboxes = document.querySelectorAll(
    '#filters-container-list input[type="checkbox"]',
  );
  checkboxes.forEach((cb) => {
    const category = cb.getAttribute("data-cat");
    cb.checked = state;
    toggleCategoryLayer(category, state);
  });
  showNotification(
    state ? "Capas activadas" : "Capas ocultas",
    state ? "Mostrando todos los puntos" : "Mapa despejado",
    "info",
  );
};

function setupPlacesSearch() {
  const input = document.getElementById("places-search-input");
  const results = document.getElementById("places-search-results");
  const clearBtn = document.getElementById("clear-places-btn");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();
    clearBtn.style.display = val.length > 0 ? "block" : "none";
    if (val.length < 2) {
      results.classList.remove("visible");
      return;
    }
    const filtered = allSearchablePlaces
      .filter(
        (p) =>
          p.name.toLowerCase().includes(val) ||
          p.category.toLowerCase().includes(val),
      )
      .slice(0, 6);

    results.innerHTML = filtered
      .map(
        (p) => `
            <div class="search-result-item" onclick="focusPlace(${p.latlng.lat}, ${p.latlng.lng}, '${p.category}')">
                <i class="icon ${p.icon}" style="font-size: 18px; color: var(--text-secondary);"></i>
                <div class="result-info">
                    <strong>${p.name}</strong>
                    <span>${p.category}</span>
                </div>
            </div>`,
      )
      .join("");
    results.classList.add("visible");
  });
}

window.focusPlace = function (lat, lng, category) {
  const results = document.getElementById("places-search-results");
  if (results) results.classList.remove("visible");

  if (
    placesLayers[category] &&
    !placesMapInstance.hasLayer(placesLayers[category])
  ) {
    toggleCategoryLayer(category, true);
    const cb = document.querySelector(`input[data-cat="${category}"]`);
    if (cb) cb.checked = true;
  }
  placesMapInstance.setView([lat, lng], 18, { animate: true, duration: 0.8 });
};

window.locateUserPlaces = function () {
  if (!placesMapInstance) return;
  showNotification("GPS", "Obteniendo ubicación...", "info");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latlng = [position.coords.latitude, position.coords.longitude];
      placesMapInstance.flyTo(latlng, 16);

      const gpsIcon = L.divIcon({
        className: "gps-marker-container",
        html: `<div class="gps-dot-animated"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker(latlng, { icon: gpsIcon }).addTo(placesMapInstance);

      showNotification("Ubicación encontrada", "", "success");
    },
    (error) => {
      showNotification(
        "Error GPS",
        "Revisa los permisos de ubicación",
        "error",
      );
    },
    { enableHighAccuracy: true, timeout: 5000 },
  );
};

window.openMapsApp = function (lat, lng) {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    window.open(
      `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      "_system",
    );
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_system",
    );
  }
};

function getStyleForType(typeText) {
  const lower = typeText.toLowerCase();

  let selectedIcon = "ri-map-pin-line";

  for (const rule of ICON_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      selectedIcon = rule.icon;
      break;
    }
  }

  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % DYNAMIC_COLORS.length;
  const selectedColor = DYNAMIC_COLORS[colorIndex];

  return {
    color: selectedColor,
    icon: selectedIcon,
    bg: selectedColor + "1A",
  };
}

window.setCortesFilter = function (mode, btn) {
  currentCortesFilter = mode;

  const container = btn.parentElement;
  container
    .querySelectorAll(".tab-pill")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  applyCortesFilters();

  showNotification(
    mode === "active" ? "Eventos Activos" : "Todos los Eventos",
    mode === "active"
      ? "Mostrando incidencias vigentes en este momento"
      : "Mostrando agenda completa",
    "info",
  );
};

function getLocalTodayDate() {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  const localISOTime = new Date(d.getTime() - offsetMs)
    .toISOString()
    .slice(0, 10);
  return localISOTime;
}

async function renderMobilityEvents() {
  ensureMapContainerIsClean("map-cortes");
  if (!cortesMapInstance) {
    cortesMapInstance = L.map("map-cortes", {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);
    L.control
      .attribution({
        prefix: false,
      })
      .addTo(cortesMapInstance);
    const isDark = document.body.classList.contains("dark-mode");
    const url = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    cortesTileLayer = L.tileLayer(url).addTo(cortesMapInstance);
    cortesLayersGroup = L.layerGroup().addTo(cortesMapInstance);

    setupCortesControls();
  } else {
    setTimeout(() => cortesMapInstance.invalidateSize(), 200);
  }

  if (cortesDataLoaded) {
    applyCortesFilters();
    return;
  }

  const loader = document.getElementById("cortes-loader");
  loader.style.display = "block";

  try {
    const RSS_URL = "http://www.movilidadgranada.com/app/noticias/rss.php";
    const PROXY_URL =
      "https://proxy.contacto-granago.workers.dev/?url=" +
      encodeURIComponent(RSS_URL);

    const response = await fetch(PROXY_URL);
    const strXML = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(strXML, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    allMobilityEvents = [];

    items.forEach((item) => {
      const title = item.querySelector("title").textContent;
      const descriptionHTML = item.querySelector("description").textContent;

      const coordsMatch = descriptionHTML.match(
        /Ubicación.*?\(([\d.-]+),\s*([\d.-]+)\)/i,
      );
      const typeMatch = descriptionHTML.match(/Tipo de corte:\s*(.*?)<\/p>/i);
      const endDateMatch = descriptionHTML.match(
        /Fin de la publicación:\s*([\d-]+)/i,
      );

      let cleanDesc = descriptionHTML
        .replace(/<[^>]*>?/gm, " ")
        .replace(/Fin de la publicación:[\s\S]*/i, "")
        .replace(/Ubicación[\s\S]*/i, "")
        .trim();

      let rawType = typeMatch ? typeMatch[1].trim() : "Incidencia";
      let formattedType = rawType
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const style = getStyleForType(formattedType);

      if (coordsMatch) {
        allMobilityEvents.push({
          title: title,
          desc: cleanDesc,
          lat: parseFloat(coordsMatch[1]),
          lng: parseFloat(coordsMatch[2]),
          typeKey: formattedType,
          style: style,
          endDate: endDateMatch ? endDateMatch[1] : "Indefinido",
        });
      }
    });

    allMobilityEvents.sort((a, b) => {
      if (a.endDate === "Indefinido") return 1;
      if (b.endDate === "Indefinido") return -1;
      return new Date(a.endDate) - new Date(b.endDate);
    });

    loader.style.display = "none";
    cortesDataLoaded = true;

    applyCortesFilters();
  } catch (e) {
    console.error("Error RSS Cortes:", e);
    loader.style.display = "none";
    document.getElementById("cortes-list-container").innerHTML = `
            <div class="error-msg">Error cargando eventos.</div>`;
  }
}

function setupCortesControls() {
  const input = document.getElementById("cortes-search-input");
  const clearBtn = document.getElementById("clear-cortes-search-btn");

  if (input) {
    input.addEventListener("input", (e) => {
      const val = e.target.value;
      clearBtn.style.display = val.length > 0 ? "flex" : "none";
      applyCortesFilters();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.style.display = "none";
      applyCortesFilters();
    });
  }
}

function applyCortesFilters() {
  const container = document.getElementById("cortes-list-container");
  const searchInput = document.getElementById("cortes-search-input");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const todayStr = getLocalTodayDate();

  cortesLayersGroup.clearLayers();
  container.innerHTML = "";

  const filtered = allMobilityEvents.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm) ||
      evt.desc.toLowerCase().includes(searchTerm) ||
      evt.typeKey.toLowerCase().includes(searchTerm);

    if (!matchesSearch) return false;

    if (currentCortesFilter === "active") {
      const fullText = evt.title + " " + evt.desc;
      if (!isDayTimeActive(fullText)) return false;
      if (evt.endDate === todayStr) return true;
      if (isDateActive(fullText)) return true;
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No se encontraron eventos con este filtro.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((evt, idx) => {
    const style = evt.style;
    const uniqueId = `event-card-${idx}`;

    const customIcon = L.divIcon({
      className: "",
      html: `<div class="transport-marker-container" style="background-color: ${style.color}; border: 2px solid white;">
                    <i class="icon ${style.icon}" style="font-size: 16px;"></i>
                   </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -10],
    });

    const popupContent = `
        <div style="text-align:center;">
            <strong style="font-size:0.9rem; color:${style.color}">${evt.typeKey}</strong>
            <p style="margin:4px 0 8px 0; font-size:0.85rem; line-height:1.3;">${evt.title}</p>
            <button onclick="focusEventInList('${uniqueId}')" 
                    style="background:var(--bg-app); border:1px solid var(--border-subtle); padding:4px 10px; border-radius:8px; font-size:0.75rem; font-weight:600; cursor:pointer; color:var(--text-primary);">
                Ver detalles <i class="ri-arrow-down-line"></i>
            </button>
        </div>`;

    L.marker([evt.lat, evt.lng], { icon: customIcon })
      .bindPopup(popupContent, { closeButton: false, minWidth: 160 })
      .addTo(cortesLayersGroup);

    const card = document.createElement("div");
    card.className = "event-card";
    card.id = uniqueId;
    card.style.setProperty("--event-color", style.color);
    card.style.setProperty("--event-bg-light", style.bg);

    card.innerHTML = `
            <div class="event-header">
                <div class="event-type-badge">
                    <i class="${style.icon}"></i> ${evt.typeKey}
                </div>
            </div>
            <h3 class="event-title">${evt.title}</h3>

            <div class="desc-wrapper">
                <p class="event-desc">${evt.desc}</p>
            </div>

            <div class="event-footer">
                <div class="event-date">
                    <i class="ri-calendar-event-line"></i> Hasta: ${evt.endDate}
                </div>
                <button class="btn-locate-event" onclick="locateEventOnMap(${evt.lat}, ${evt.lng})">
                    Ver Mapa <i class="ri-map-pin-line"></i>
                </button>
            </div>
        `;
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

window.scrollToCortesList = function () {
  const wrapper = document.getElementById("cortes-list-wrapper");

  if (wrapper) {
    wrapper.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    wrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

window.focusEventInList = function (elementId) {
  const targetCard = document.getElementById(elementId);
  if (!targetCard) return;

  if (cortesMapInstance) cortesMapInstance.closePopup();
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

  targetCard.classList.remove("highlight-flash");
  void targetCard.offsetWidth;
  targetCard.classList.add("highlight-flash");

  showNotification("Localizado", "Evento resaltado en la lista", "info");
};

window.locateEventOnMap = function (lat, lng) {
  if (!cortesMapInstance) return;

  const view = document.getElementById("cortes-view");
  if (view) {
    view.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const wrapper = document.getElementById("cortes-list-wrapper");
  if (wrapper) {
    wrapper.scrollTo({ top: 0, behavior: "smooth" });
  }

  let targetLayer = null;
  if (cortesLayersGroup) {
    cortesLayersGroup.eachLayer((layer) => {
      const layerLatLng = layer.getLatLng();
      if (
        Math.abs(layerLatLng.lat - lat) < 0.00001 &&
        Math.abs(layerLatLng.lng - lng) < 0.00001
      ) {
        targetLayer = layer;
      }
    });
  }

  if (targetLayer) {
    cortesMapInstance.flyTo([lat, lng], 16, {
      animate: true,
      duration: 1.5,
    });

    cortesMapInstance.once("moveend", () => {
      targetLayer.openPopup();
    });

    setTimeout(() => targetLayer.openPopup(), 1500);
  } else {
    cortesMapInstance.setView([lat, lng], 16);
  }
};

window.openFuelMap = function (type) {
  currentFuelType = type;

  navigateTo("repostar-map");

  setupFuelHeader(type);

  setTimeout(() => {
    initRepostarMap();

    const loader = document.getElementById("repostar-loader");
    if (loader) loader.classList.add("visible");

    if (type === "electrico") {
      fetchEVDataForMap();
    } else {
      fetchFuelDataForMap(type);
    }
  }, 200);
};

function setupFuelHeader(type) {
  const filtersContainer = document.getElementById("fuel-map-filters");
  const searchWrapper = document.getElementById("fuel-search-wrapper");

  filtersContainer.innerHTML = "";

  if (type === "electrico") {
    if (searchWrapper) searchWrapper.style.display = "none";
    filtersContainer.innerHTML = `
            <button class="filter-chip" onclick="filterEVMap('paid', this)" style="--chip-color: #8b5cf6;">
                <i class="icon ri-wallet-3-line"></i> Pago
            </button>
            <button class="filter-chip" onclick="filterEVMap('free', this)" style="--chip-color: #10b981;">
                <i class="icon ri-emotion-happy-line"></i> Gratis
            </button>
        `;
  } else {
    if (searchWrapper) searchWrapper.style.display = "flex";

    filtersContainer.innerHTML = `
            <button class="filter-chip" onclick="filterFuelMap('top3', this)" style="--chip-color: #f59e0b;">
                <i class="icon ri-trophy-line"></i> Top 3
            </button>
            <button class="filter-chip" onclick="filterFuelMap('near', this)" style="--chip-color: #2563eb;">
                <i class="icon ri-map-pin-user-line"></i> Cerca
            </button>
        `;
    setupFuelSearch();
  }
}

function initRepostarMap() {
  const mapContainer = document.getElementById("map-repostar");
  if (!mapContainer) return;
  ensureMapContainerIsClean("map-repostar");

  if (!repostarMap) {
    repostarMap = L.map("map-repostar", {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      maxZoom: 19,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);
    repostarMap.locate({
      setView: true,
      maxZoom: 14,
      enableHighAccuracy: true,
    });

    checkMapTheme();

    repostarLayerGroup = L.markerClusterGroup({
      maxClusterRadius: 25,
      iconCreateFunction: function (cluster) {
        return L.divIcon({
          html: `<span>${cluster.getChildCount()}</span>`,
          className: "custom-cluster cluster-small",
          iconSize: L.point(30, 30),
        });
      },
    }).addTo(repostarMap);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        repostarMap.flyTo(latlng, 15);

        if (!repostarUserMarker) {
          const gpsIcon = L.divIcon({
            className: "gps-marker-container",
            html: `<div class="gps-dot-animated"></div>`,
            iconSize: [24, 24],
          });
          repostarUserMarker = L.marker(latlng, { icon: gpsIcon }).addTo(
            repostarMap,
          );
        } else {
          repostarUserMarker.setLatLng(latlng);
        }
      },
      () => { },
      { enableHighAccuracy: true, timeout: 3000 },
    );
  } else {
    repostarMap.invalidateSize();
  }

  if (typeof repostarTileLayer === "undefined") {
    repostarTileLayer = null;
    checkMapTheme();
  }
}

function dismissRepostarLoader() {
  const loader = document.getElementById("repostar-loader");
  if (loader) {
    loader.classList.remove("visible");
    setTimeout(() => {
      loader.style.display = "none";
    }, 300);
  }
}

async function fetchFuelDataForMap(type) {
  try {
    const PROXY = "https://proxy.contacto-granago.workers.dev/?url=";
    const TARGET = encodeURIComponent(
      "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia/18",
    );
    const res = await fetch(PROXY + TARGET);
    const data = await res.json();

    const rawList = data.ListaEESSPrecio;
    const priceKey = FUEL_MAP[type].key;

    allStationsData = rawList
      .filter((s) => {
        const priceStr = s[priceKey];
        return priceStr && priceStr !== "";
      })
      .map((s) => {
        s._priceVal = parseFloat(s[priceKey].replace(",", "."));
        s._cleanName = s["Rótulo"];
        s._lat = parseFloat(s["Latitud"].replace(",", "."));
        s._lng = parseFloat(s["Longitud (WGS84)"].replace(",", "."));
        return s;
      });

    renderFuelMarkers(allStationsData, false);
    dismissRepostarLoader();
  } catch (e) {
    console.error("Error Fuel Map:", e);
    dismissRepostarLoader();
    showNotification("Error", "Fallo al cargar precios.", "error");
  }
}

function renderFuelMarkers(list, isRanking) {
  repostarLayerGroup.clearLayers();
  const priceKey = FUEL_MAP[currentFuelType].key;

  list.forEach((s, index) => {
    let iconHtml = `<i class="ri-gas-station-fill"></i>`;
    let markerClass = "transport-marker-container";
    let bgColor = "#64748b";

    const label = s._cleanName.toLowerCase();
    if (label.includes("repsol")) bgColor = "#ff8200";
    else if (label.includes("bp")) bgColor = "#009900";
    else if (label.includes("cepsa")) bgColor = "#c8102e";
    else if (
      label.includes("plenoil") ||
      label.includes("petroprix") ||
      label.includes("ballenoil")
    )
      bgColor = "#2563eb";

    if (isRanking) {
      bgColor = "#fbbf24";
      if (index === 0) iconHtml = "1º";
      if (index === 1) {
        iconHtml = "2º";
        bgColor = "#94a3b8";
      }
      if (index === 2) {
        iconHtml = "3º";
        bgColor = "#b45309";
      }
      if (index > 2) {
        iconHtml = index + 1 + "º";
        bgColor = "#2563eb";
      }
      markerClass += " ranking-marker";
    }

    const icon = L.divIcon({
      className: "",
      html: `<div class="${markerClass}" style="background-color: ${bgColor}; border: 2px solid white; width: ${isRanking ? 40 : 32
        }px; height: ${isRanking ? 40 : 32}px; font-weight:800;">
                     ${iconHtml}
                   </div>`,
      iconSize: [isRanking ? 40 : 32, isRanking ? 40 : 32],
      iconAnchor: [isRanking ? 20 : 16, isRanking ? 20 : 16],
    });

    const marker = L.marker([s._lat, s._lng], { icon: icon });

    marker.bindPopup(
      `
            <div style="text-align:center; min-width:160px;">
                <h3 class="notranslate" style="margin:0 0 5px 0; font-size:1rem;">${s["Rótulo"]}</h3>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px;">${s["Dirección"]}</div>
                <div style="background:var(--bg-app); padding:8px; border-radius:8px; border:1px solid var(--border-subtle);">
                    <div style="font-size:0.75rem;">${FUEL_MAP[currentFuelType].label}</div>
                    <div style="font-size:1.6rem; font-weight:800; color:${bgColor}; line-height:1;">
                        ${s[priceKey]} <span style="font-size:1rem;">€</span>
                    </div>
                </div>
                <button class="btn-navigate-popup" onclick="openMapsApp(${s._lat}, ${s._lng})">
                    <i class="ri-direction-fill"></i> Ir
                </button>
            </div>
        `,
      { closeButton: false },
    );

    repostarLayerGroup.addLayer(marker);

    if (isRanking && index === 0) {
      setTimeout(() => marker.openPopup(), 500);
    }
  });
}

window.filterFuelMap = function (mode, btn) {
  const isActive = btn.classList.contains("active");
  document
    .querySelectorAll("#fuel-map-filters .filter-chip")
    .forEach((b) => b.classList.remove("active"));

  if (isActive) {
    renderFuelMarkers(allStationsData, false);
    repostarMap.fitBounds(repostarLayerGroup.getBounds());
    return;
  }

  btn.classList.add("active");

  if (mode === "top3") {
    const sorted = [...allStationsData].sort(
      (a, b) => a._priceVal - b._priceVal,
    );
    const top3 = sorted.slice(0, 3);
    renderFuelMarkers(top3, true);

    const group = L.featureGroup(top3.map((s) => L.marker([s._lat, s._lng])));
    repostarMap.fitBounds(group.getBounds(), { padding: [50, 50] });
    showNotification("Top 3", "Mostrando las más baratas", "success");
  } else if (mode === "near") {
    if (!repostarUserMarker) {
      showNotification("Ubicación necesaria", "Activa el GPS", "error");
      repostarMap.locate({ setView: true });
      btn.classList.remove("active");
      return;
    }

    const userLatLng = repostarUserMarker.getLatLng();
    const nearStations = allStationsData.filter((s) => {
      const dist = userLatLng.distanceTo([s._lat, s._lng]);
      s._dist = dist;
      return dist <= 5000;
    });

    if (nearStations.length === 0) {
      showNotification(
        "Nada cerca",
        "No hay gasolineras a menos de 5km",
        "info",
      );
      return;
    }

    nearStations.sort((a, b) => a._priceVal - b._priceVal);
    const top5Near = nearStations.slice(0, 5);
    renderFuelMarkers(top5Near, true);

    const group = L.featureGroup(
      top5Near.map((s) => L.marker([s._lat, s._lng])),
    );
    repostarMap.fitBounds(group.getBounds(), { padding: [50, 50] });
    showNotification("Cerca de ti", "Las 5 más baratas en tu radio", "success");
  }
};

function setupFuelSearch() {
  const input = document.getElementById("fuel-search-input");
  const results = document.getElementById("fuel-search-results");
  const clear = document.getElementById("clear-fuel-search");

  if (!input) return;

  const clearResults = () => {
    input.value = "";
    results.classList.remove("visible");
    while (results.firstChild) {
      results.removeChild(results.firstChild);
    }
    clear.style.display = "none";
  };

  input.oninput = (e) => {
    const val = e.target.value.toLowerCase().trim();
    clear.style.display = val ? "flex" : "none";

    results.innerHTML = "";

    if (val.length < 2) {
      results.classList.remove("visible");
      return;
    }

    const matches = allStationsData
      .filter(
        (s) =>
          s._cleanName.toLowerCase().includes(val) ||
          s["Dirección"].toLowerCase().includes(val) ||
          s["Municipio"].toLowerCase().includes(val),
      )
      .slice(0, 5);

    if (matches.length === 0) {
      results.classList.remove("visible");
      return;
    }

    const fragment = document.createDocumentFragment();

    matches.forEach((s) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.addEventListener("click", () => focusOnStation(s._lat, s._lng));
      const priceVal = s[FUEL_MAP[currentFuelType].key] || "-";
      item.innerHTML = `
          <i class="ri-gas-station-line result-icon"></i>
          <div class="result-info">
              <strong>${s._cleanName}</strong>
              <span>${priceVal} € - ${s["Municipio"]}</span>
          </div>
      `;

      fragment.appendChild(item);
    });

    results.appendChild(fragment);
    results.classList.add("visible");
  };

  clear.onclick = clearResults;
}

window.focusOnStation = function (lat, lng) {
  document.getElementById("fuel-search-results").classList.remove("visible");
  repostarMap.setView([lat, lng], 16, { animate: true });

  repostarLayerGroup.eachLayer((layer) => {
    const lLat = layer.getLatLng();
    if (
      Math.abs(lLat.lat - lat) < 0.0001 &&
      Math.abs(lLat.lng - lng) < 0.0001
    ) {
      setTimeout(() => layer.openPopup(), 500);
    }
  });
};

async function fetchEVDataForMap() {
  try {
    const query = `
            [out:json][timeout:25];
            (node["amenity"="charging_station"](around:20000,37.1773,-3.5986););
            out body;
        `;
    const url =
      "https://overpass-api.de/api/interpreter?data=" +
      encodeURIComponent(query);
    const res = await fetch(url);
    const data = await res.json();

    allStationsData = data.elements || [];
    renderEVMarkers(allStationsData);

    dismissRepostarLoader();
  } catch (e) {
    console.error("Error EV Map:", e);
    dismissRepostarLoader();
  }
}

function renderEVMarkers(list) {
  repostarLayerGroup.clearLayers();

  list.forEach((el) => {
    if (!el.tags) return;
    const fee = el.tags.fee || "unknown";
    const isFree = fee === "no";
    const color = isFree ? "#10b981" : "#8b5cf6";
    const iconClass = isFree
      ? "ri-emotion-happy-line"
      : "ri-charging-pile-2-fill";

    const icon = L.divIcon({
      className: "",
      html: `<div class="transport-marker-container" style="background-color: ${color}; border: 2px solid white;">
                     <i class="icon ${iconClass}" style="font-size:18px;"></i>
                   </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([el.lat, el.lon], { icon: icon });

    let details = "Conector estándar";
    if (el.tags["socket:type2"]) details = "Type 2 (Mennekes)";

    marker.bindPopup(
      `
             <div style="text-align:center;">
                <strong style="color:${color}">${isFree ? "GRATIS" : "DE PAGO"
      }</strong>
                <p style="margin:5px 0;">${el.tags.operator || "Cargador Público"
      }</p>
                <small>${details}</small>
                <button class="btn-navigate-popup" onclick="openMapsApp(${el.lat
      }, ${el.lon})">
                    <i class="ri-direction-fill"></i> Ir
                </button>
             </div>
        `,
      { closeButton: false },
    );

    repostarLayerGroup.addLayer(marker);
  });
}

window.filterEVMap = function (mode, btn) {
  const isActive = btn.classList.contains("active");
  document
    .querySelectorAll("#fuel-map-filters .filter-chip")
    .forEach((b) => b.classList.remove("active"));

  if (isActive) {
    renderEVMarkers(allStationsData);
    return;
  }

  btn.classList.add("active");

  const filtered = allStationsData.filter((el) => {
    const fee = el.tags?.fee || "unknown";
    if (mode === "free") return fee === "no";
    if (mode === "paid") return fee !== "no";
    return true;
  });

  renderEVMarkers(filtered);
  showNotification(
    "Filtro aplicado",
    `Mostrando cargadores ${mode === "free" ? "gratuitos" : "de pago"}`,
    "info",
  );
};

window.locateUserFuel = function () {
  if (!repostarMap) return;
  showNotification("GPS", "Localizando...", "info");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latlng = [position.coords.latitude, position.coords.longitude];
      repostarMap.flyTo(latlng, 15);

      if (!repostarUserMarker) {
        const gpsIcon = L.divIcon({
          className: "gps-marker-container",
          html: `<div class="gps-dot-animated"></div>`,
          iconSize: [24, 24],
        });
        repostarUserMarker = L.marker(latlng, { icon: gpsIcon }).addTo(
          repostarMap,
        );
      } else {
        repostarUserMarker.setLatLng(latlng);
      }
      showNotification("Localizado", "Ubicación actualizada", "success");
    },
    (error) => {
      showNotification("Error", "No se pudo obtener la ubicación", "error");
    },
    { enableHighAccuracy: true, timeout: 5000 },
  );
};

async function initCamarasMap() {
  const mapId = "map-camaras";
  const loader = document.getElementById("camaras-loader");
  if (!document.getElementById(mapId)) return;
  ensureMapContainerIsClean(mapId);

  if (loader) loader.classList.add("visible");

  if (!camarasMapInstance) {
    camarasMapInstance = L.map(mapId, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      maxZoom: 19,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);
    L.control
      .attribution({
        prefix: false,
      })
      .addTo(camarasMapInstance);
    camarasMapInstance.locate({
      setView: true,
      maxZoom: 14,
      enableHighAccuracy: true,
    });
    checkMapTheme();

    camarasClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 25,
      iconCreateFunction: function (cluster) {
        return L.divIcon({
          html: `<span>${cluster.getChildCount()}</span>`,
          className: "custom-cluster cluster-medium",
          iconSize: L.point(40, 40),
        });
      },
    });

    camarasMapInstance.addLayer(camarasClusterGroup);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        camarasMapInstance.flyTo(latlng, 15);

        L.marker(latlng, {
          icon: L.divIcon({
            className: "gps-marker-container",
            html: `<div class="gps-dot-animated"></div>`,
            iconSize: [24, 24],
          }),
        }).addTo(camarasMapInstance);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 3000 },
    );
  } else {
    camarasMapInstance.invalidateSize();
  }

  if (!camarasDataLoaded) {
    try {
      await Promise.all([
        loadLocalKMLCameras(),
        loadDGTXMLCameras(),
        loadRadares(),
      ]);
      camarasDataLoaded = true;
    } catch (e) {
      console.error("Error general cámaras:", e);
    } finally {
      if (loader) loader.classList.remove("visible");
    }
  } else {
    if (loader) loader.classList.remove("visible");
  }
}

function loadLocalKMLCameras() {
  return new Promise((resolve) => {
    const customLayer = L.geoJson(null, {
      pointToLayer: function (feature, latlng) {
        return createCameraMarker(latlng, "urbano");
      },
      onEachFeature: function (feature, layer) {
        const name = feature.properties.name || "Cámara Tráfico";
        const content = `
            <div style="text-align:center; min-width:150px;">
                <strong class="notranslate" style="color:var(--color-purple); font-size:1rem; display:block; margin-bottom:5px;">${name}</strong>
                <span style="font-size:0.8rem; color:var(--text-secondary); background:var(--bg-app); padding:4px 8px; border-radius:10px; border:1px solid var(--border-subtle);">
                    Ayto. Granada
                </span>
            </div>
        `;
        layer.bindPopup(content, { closeButton: false });
      },
    });

    omnivore
      .kml("data/camaras_granada.kml", null, customLayer)
      .on("ready", function () {
        camarasClusterGroup.addLayer(this);
        resolve();
      })
      .on("error", function (e) {
        console.warn("Error KML local:", e);
        resolve();
      });
  });
}

async function loadDGTXMLCameras() {
  const PROXY_URL = "https://proxy.contacto-granago.workers.dev/?url=";
  const DGT_URL =
    "https://nap.dgt.es/datex2/v3/dgt/DevicePublication/camaras_datex2_v36.xml";

  try {
    const response = await fetch(PROXY_URL + encodeURIComponent(DGT_URL));
    if (!response.ok) throw new Error("Error red DGT");

    const strXML = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(strXML, "text/xml");

    let devices = xmlDoc.getElementsByTagName("ns2:device");
    if (devices.length === 0) {
      devices = xmlDoc.getElementsByTagName("device");
    }

    if (devices.length === 0) {
      console.warn("DGT: No se encontraron etiquetas 'device' en el XML.");
      return;
    }

    let addedCount = 0;

    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];

      let latNodes = device.getElementsByTagName("loc:latitude");
      if (latNodes.length === 0)
        latNodes = device.getElementsByTagName("latitude");

      let lonNodes = device.getElementsByTagName("loc:longitude");
      if (lonNodes.length === 0)
        lonNodes = device.getElementsByTagName("longitude");

      if (latNodes.length === 0 || lonNodes.length === 0) continue;

      const lat = parseFloat(latNodes[0].textContent);
      const lon = parseFloat(lonNodes[0].textContent);

      if (isNaN(lat) || isNaN(lon)) continue;

      let provinceNodes = device.getElementsByTagName("lse:province");
      if (provinceNodes.length === 0)
        provinceNodes = device.getElementsByTagName("province");

      let isGranada = false;

      if (provinceNodes.length > 0) {
        if (provinceNodes[0].textContent.toUpperCase().includes("GRANADA")) {
          isGranada = true;
        }
      }

      if (!isGranada) {
        const dist = Math.sqrt(
          Math.pow(lat - GRANADA_COORDS.lat, 2) +
          Math.pow(lon - GRANADA_COORDS.lon, 2),
        );
        if (dist < 0.5) isGranada = true;
      }

      if (!isGranada) continue;

      let roadNodes = device.getElementsByTagName("loc:roadName");
      if (roadNodes.length === 0)
        roadNodes = device.getElementsByTagName("roadName");
      const roadName =
        roadNodes.length > 0 ? roadNodes[0].textContent : "Ctra. Desconocida";

      let kmNodes = device.getElementsByTagName("lse:kilometerPoint");
      if (kmNodes.length === 0)
        kmNodes = device.getElementsByTagName("kilometerPoint");
      const kmPoint = kmNodes.length > 0 ? kmNodes[0].textContent : "?";

      const name = `${roadName} - PK ${kmPoint}`;

      const marker = createCameraMarker([lat, lon], "dgt");

      const content = `
                <div style="text-align:center; min-width:150px;">
                    <strong class="notranslate" style="color:#0ea5e9; font-size:1.1rem; display:block; margin-bottom:5px;">${name}</strong>
                    <div style="font-size:0.9rem; color:var(--text-primary); margin-bottom:8px;">
                        <i class="ri-road-map-line"></i> ${roadName} <br>
                        <i class="ri-map-pin-range-line"></i> Km: ${kmPoint}
                    </div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); background:var(--bg-app); padding:4px 8px; border-radius:10px; border:1px solid var(--border-subtle);">
                        DGT - Tráfico
                    </span>
                </div>
            `;

      marker.bindPopup(content, { closeButton: false });
      camarasClusterGroup.addLayer(marker);
      addedCount++;
    }

    console.log(`DGT: Se han añadido ${addedCount} cámaras.`);
  } catch (e) {
    console.error("Error procesando XML DGT:", e);
    showNotification("Aviso", "Error leyendo datos de la DGT", "error");
  }
}

async function loadRadares() {
  const iconRadarFijo = L.divIcon({
    className: "radar-icon-container",
    html: '<div class="radar-circle"><i class="ri-camera-lens-fill"></i></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

  const iconRadarPunto = L.divIcon({
    className: "radar-icon-container",
    html: '<div class="radar-circle" style="border-color: #D9281C; background: #D9281C; color: #fff;"><i class="ri-car-fill" style="font-size:12px;"></i></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

  try {
    const response = await fetch("data/radares.json");
    if (!response.ok) return;

    const data = await response.json();
    window.radaresData = data;
    const radaresLayer = L.geoJSON(data, {
      style: function (feature) {
        if (feature.properties.type === "tramo") {
          return { color: "#8e44ad", weight: 6, opacity: 0.8, smoothFactor: 1 };
        }
        if (feature.properties.type === "movil") {
          return {
            color: "#D9281C",
            weight: 5,
            opacity: 0.7,
            dashArray: "12, 16",
            lineCap: "round",
            lineJoin: "round",
            smoothFactor: 1,
          };
        }
      },
      pointToLayer: function (feature, latlng) {
        if (feature.properties.type === "fijo") {
          return L.marker(latlng, { icon: iconRadarFijo });
        }
        return L.marker(latlng, { icon: iconRadarPunto });
      },
      onEachFeature: function (feature, layer) {
        const p = feature.properties;
        let badgeColor = "#D9281C";
        let typeText = "Radar Móvil";

        if (p.type === "fijo") {
          badgeColor = "#e67e22";
          typeText = "Radar Fijo";
        } else if (p.type === "tramo") {
          badgeColor = "#8e44ad";
          typeText = "Radar de Tramo";
        }

        let info =
          p.type === "fijo"
            ? `PK: <strong>${p.pk}</strong>`
            : `Tramo: <strong>${p.tramo}</strong>`;

        const content = `
            <div style="text-align:center; min-width:150px;">
                <strong class="notranslate" style="color:#D9281C; font-size:1.1rem; display:block; margin-bottom:5px;">
                    ${p.road}
                </strong>
                
                <span style="font-size:0.75rem; color:white; background:${badgeColor}; padding:4px 10px; border-radius:12px; display:inline-block; margin-bottom:8px; font-weight:700;">
                    ${typeText}
                </span>

                <div style="font-size:0.9rem; color:var(--text-primary); margin-bottom:5px;">
                    <i class="ri-map-pin-range-line"></i> ${info}
                </div>
                
                <div style="font-size:0.85rem; color:var(--text-secondary);">
                    Sentido: ${p.sentido}
                </div>
            </div>
        `;

        layer.bindPopup(content, { closeButton: false });
      },
    });

    if (camarasMapInstance) {
      radaresLayer.addTo(camarasMapInstance);
      console.log("Radares cargados correctamente.");
    }
  } catch (e) {
    console.warn("No se pudieron cargar los radares:", e);
  }
}

function createCameraMarker(latlng, type) {
  let color = type === "urbano" ? "#8b5cf6" : "#0ea5e9";

  const icon = L.divIcon({
    className: "",
    html: `<div class="transport-marker-container" style="background-color: ${color}; border: 2px solid white;">
                 <i class="icon ri-camera-lens-fill" style="font-size: 16px;"></i>
               </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10],
  });

  return L.marker(latlng, { icon: icon });
}

window.locateUserCamaras = function () {
  if (!camarasMapInstance) return;
  showNotification("GPS", "Localizando...", "info");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latlng = [position.coords.latitude, position.coords.longitude];
      camarasMapInstance.flyTo(latlng, 15);

      L.marker(latlng, {
        icon: L.divIcon({
          className: "gps-marker-container",
          html: `<div class="gps-dot-animated"></div>`,
          iconSize: [24, 24],
        }),
      }).addTo(camarasMapInstance);
    },
    () => showNotification("Error", "Fallo al localizar", "error"),
    { enableHighAccuracy: true },
  );
};

async function initParkingsMap() {
  const mapId = "map-parkings";
  const loader = document.getElementById("parkings-loader");
  if (!document.getElementById(mapId)) return;
  ensureMapContainerIsClean(mapId);

  if (loader) loader.classList.add("visible");

  if (!parkingsMapInstance) {
    parkingsMapInstance = L.map(mapId, {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);
    L.control
      .attribution({
        prefix: false,
      })
      .addTo(parkingsMapInstance);
    checkMapTheme();

    parkingsLayerGroup = L.layerGroup().addTo(parkingsMapInstance);
    staticParkingsLayerGroup = L.layerGroup().addTo(parkingsMapInstance);
  } else {
    parkingsMapInstance.invalidateSize();
  }

  if (parkingInterval) clearInterval(parkingInterval);

  if (!parkingsDataLoaded) {
    loadStaticParkingsCSV();
    loadMotoParkingsKML();
    await fetchParkingsData();
    parkingsDataLoaded = true;
  }

  parkingInterval = setInterval(() => {
    console.log("Actualizando datos de parking...");
    fetchParkingsData();
  }, 120000);

  if (loader) loader.classList.remove("visible");
}

async function fetchParkingsData() {
  const PROXY = "https://proxy.contacto-granago.workers.dev/?url=";
  const TABLE_URL =
    "http://www.movilidadgranada.com/aparcamientos/par_tabla.php";

  const container = document.getElementById("parkings-table-container");
  if (container.innerHTML === "") {
    container.innerHTML =
      '<div class="spinner" style="margin:20px auto"></div>';
  }

  try {
    const response = await fetch(PROXY + encodeURIComponent(TABLE_URL));
    if (!response.ok) throw new Error("Error red");

    const text = await response.text();

    const htmlDoc = new DOMParser().parseFromString(text, "text/html");
    const rows = htmlDoc.querySelectorAll("tr");

    parkingsLayerGroup.clearLayers();
    container.innerHTML = "";

    const fragment = document.createDocumentFragment();
    const bounds = L.latLngBounds();
    let foundCount = 0;

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return;

      const nameRaw = cells[0].textContent.trim();
      let statusRaw = cells[1].textContent.trim();

      if (nameRaw.toLowerCase().includes("aparcamiento") || nameRaw === "")
        return;

      const key = cleanString(nameRaw);
      const coords = PARKING_COORDS[key];

      const numberMatch = statusRaw.match(/(-?\d+)/);
      let plazasLibres = numberMatch ? parseInt(numberMatch[0]) : 0;

      let statusClass = "status-libre";
      let color = "#10b981";
      let iconClass = "ri-parking-box-fill";
      let displayText = statusRaw;

      if (statusRaw.toUpperCase().includes("CERRADO")) {
        statusClass = "status-cerrado";
        color = "#64748b";
        iconClass = "ri-forbid-2-fill";
        displayText = "CERRADO";
      } else if (
        statusRaw.toUpperCase().includes("COMPLETO") ||
        plazasLibres <= 3
      ) {
        statusClass = "status-completo";
        color = "#ef4444";
        iconClass = "ri-parking-fill";
        displayText = "COMPLETO";
      } else if (plazasLibres <= 30) {
        statusClass = "status-pocas";
        color = "#f59e0b";
        iconClass = "ri-alert-line";
      }

      const item = document.createElement("div");
      item.className = "parking-row";
      item.innerHTML = `
                <div class="parking-name notranslate">${nameRaw}</div>
                <div class="parking-status ${statusClass}">${displayText}</div>
            `;
      fragment.appendChild(item);

      if (coords) {
        foundCount++;
        const icon = L.divIcon({
          className: "",
          html: `<div class="transport-marker-container" style="background-color: ${color}; border: 2px solid white;">
                             <i class="icon ${iconClass}" style="font-size: 16px;"></i>
                           </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -10],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: icon });
        marker.bindPopup(
          `
                    <div style="text-align:center; min-width:150px;">
                        <strong class="notranslate" style="font-size:1rem; display:block; margin-bottom:5px;">${nameRaw}</strong>
                        <span class="${statusClass}" style="font-size:0.75rem; padding:4px 10px; border-radius:10px; font-weight:700;">${displayText}</span>
                        <button class="btn-navigate-popup" onclick="openMapsApp(${coords.lat}, ${coords.lng})">
                            <i class="ri-direction-fill"></i> Ir
                        </button>
                    </div>
                `,
          { closeButton: false },
        );

        parkingsLayerGroup.addLayer(marker);
        bounds.extend([coords.lat, coords.lng]);

        item.style.cursor = "pointer";
        item.onclick = () => {
          document
            .getElementById("parkings-view")
            .scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            parkingsMapInstance.flyTo([coords.lat, coords.lng], 16, {
              duration: 1.2,
            });
            marker.openPopup();
          }, 100);
        };
      }
    });

    container.appendChild(fragment);

    if (foundCount > 0 && parkingsMapInstance && !parkingsDataLoaded) {
      parkingsMapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  } catch (e) {
    console.error("Error Parkings Tabla:", e);
    if (container.innerHTML === "") {
      container.innerHTML = `<div class="error-msg">No se pudieron cargar los datos.</div>`;
    }
  }
}

async function loadStaticParkingsCSV() {
  try {
    const response = await fetch("data/parkings.csv");
    const text = await response.text();
    const realTimeKeys = Object.keys(PARKING_COORDS);
    const rows = text.split("\n").slice(1);

    rows.forEach((row) => {
      if (!row.trim()) return;

      const cols = row.split(";");
      if (cols.length < 3) return;

      const nombreRaw = cols[2]?.replace(/"/g, "") || "";
      const csvKey = cleanString(nombreRaw);

      if (realTimeKeys.includes(csvKey)) {
        console.log(`Omitiendo duplicado estático: ${nombreRaw}`);
        return;
      }

      const lon = parseFloat(cols[0]);
      const lat = parseFloat(cols[1]);
      const via = cols[6]?.replace(/"/g, "") || "";
      const acc = cols[7]?.replace(/"/g, "") || "";
      const uso = cols[11]?.replace(/"/g, "") || "";
      const tipo = cols[12]?.replace(/"/g, "") || "";

      if (!isNaN(lat) && !isNaN(lon)) {
        const marker = L.circleMarker([lat, lon], {
          radius: 7,
          fillColor: "#8b5cf6",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        const popupContent = `
          <div style="text-align:center; min-width:150px; padding: 5px;">
              <strong class="notranslate" style="font-size:0.95rem; display:block; margin-bottom:5px; color:var(--color-purple);">
                  ${nombreRaw}
              </strong>
              <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:10px;">
                  ${via} ${acc}<br>
                  <span style="text-transform: lowercase; font-weight:bold; opacity: 0.8;">
                      ${uso} - ${tipo}
                  </span>
              </div>
              <button class="btn-navigate-popup" onclick="openMapsApp(${lat}, ${lon})">
                  <i class="ri-direction-fill"></i> Cómo llegar
              </button>
          </div>
        `;

        marker.bindPopup(popupContent, { closeButton: false });
        marker.addTo(staticParkingsLayerGroup);
      }
    });
  } catch (e) {
    console.error("Error cargando el CSV de parkings:", e);
  }
}

async function loadMotoParkingsKML() {
  if (!parkingsMapInstance) return;

  const kmlPath = "data/parkingmotos.kml";
  const motoIcon = L.divIcon({
    className: "",
    html: `
      <div class="transport-marker-container" style="background-color: #6366f1; border: 2px solid white;">
        <i class="ri-motorbike-fill" style="font-size: 16px; color: white;"></i>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -10],
  });

  const customLayer = L.geoJson(null, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: motoIcon });
    },
    onEachFeature: function (feature, layer) {
      const name = feature.properties.name || "Parking de Motos";
      let desc = feature.properties.description || "";

      const content = `
        <div style="text-align:center; min-width:150px;">
            <strong class="notranslate" style="color:#6366f1; font-size:0.95rem; display:block; margin-bottom:5px;">
                ${name}
            </strong>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px;">
                Reserva para motocicletas
            </div>
            <button class="btn-navigate-popup" onclick="openMapsApp(${layer.getLatLng().lat
        }, ${layer.getLatLng().lng})">
                <i class="ri-direction-fill"></i> Ir ahora
            </button>
        </div>
      `;
      layer.bindPopup(content, { closeButton: false });
    },
  });

  motoParkingsLayerGroup = omnivore
    .kml(kmlPath, null, customLayer)
    .on("ready", function () {
      console.log("Capa de motos cargada");
    })
    .addTo(parkingsMapInstance);
}

window.toggleParkingLayer = function (type, btnElement) {
  if (!parkingsMapInstance) return;

  const isActive = btnElement.classList.contains("active");
  let layer =
    type === "moto" ? motoParkingsLayerGroup : staticParkingsLayerGroup;

  if (!layer) return;

  if (isActive) {
    parkingsMapInstance.removeLayer(layer);
    btnElement.classList.remove("active");
  } else {
    parkingsMapInstance.addLayer(layer);
    btnElement.classList.add("active");
  }
};

function cleanString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function initORAMap() {
  const mapId = "map-ora";
  if (!document.getElementById(mapId)) return;
  ensureMapContainerIsClean(mapId);

  if (!oraMapInstance) {
    oraMapInstance = L.map(mapId, {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 14);
    L.control
      .attribution({
        prefix: false,
      })
      .addTo(oraMapInstance);
    checkMapTheme();

    oraMapInstance.locate({ setView: true, maxZoom: 15 });
  } else {
    oraMapInstance.invalidateSize();
  }

  if (!oraDataLoaded) {
    loadORAKML();
    oraDataLoaded = true;
  }
}

function loadORAKML() {
  const customLayer = L.geoJson(null, {
    style: function (feature) {
      let color = "#2563eb";
      const desc = feature.properties.description || "";

      if (desc.includes("ROJA")) color = "#ef4444";
      else if (desc.includes("VERDE")) color = "#10b981";
      else if (desc.includes("AZUL")) color = "#2563eb";

      return {
        color: color,
        weight: 4,
        opacity: 0.8,
      };
    },
    onEachFeature: function (feature, layer) {
      const desc = feature.properties.description || "";

      let tipo = "Zona Azul";
      let colorHex = "#2563eb";
      if (desc.includes("ROJA")) {
        tipo = "Zona Roja";
        colorHex = "#ef4444";
      }
      if (desc.includes("VERDE")) {
        tipo = "Zona Verde";
        colorHex = "#10b981";
      }

      const tiempoMatch = desc.match(/Máximo\s+([\w\s]+)/i);
      const tiempo = tiempoMatch ? tiempoMatch[1] : "Consultar parquímetro";

      const content = `
                <div style="text-align:center; min-width:180px;">
                    <strong style="font-size:1rem; color:${colorHex}; display:block; margin-bottom:4px;">${tipo}</strong>
                    <div style="font-size:0.9rem; font-weight:700; margin-bottom:8px;">${feature.properties.name}</div>
                    <div style="background:var(--bg-app); padding:6px; border-radius:8px; border:1px solid var(--border-subtle); font-size:0.8rem; color:var(--text-secondary);">
                        <i class="ri-time-line"></i> Máx: ${tiempo}
                    </div>
                </div>
            `;
      layer.bindPopup(content, { closeButton: false });
    },
  });

  omnivore
    .kml("data/aparcamiento_limitado_granada.kml", null, customLayer)
    .addTo(oraMapInstance);
}

window.scrollToParkingsList = function () {
  const target = document.getElementById("parkings-list-title");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.scrollToORAInfo = function () {
  const target = document.getElementById("ora-info-container");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

async function initRestriccionesMap() {
  const mapId = "map-restricciones";
  const container = document.getElementById(mapId);
  if (!container) return;
  ensureMapContainerIsClean(mapId);

  if (!restriccionesMap) {
    restriccionesMap = L.map(mapId, {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 14);

    const isDark = document.body.classList.contains("dark-mode");
    const url = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    L.tileLayer(url).addTo(restriccionesMap);

    loadKMLData();
  } else {
    restriccionesMap.invalidateSize();
  }
}

function loadKMLData() {
  const kmlPath = "data/zonas_restringidas.kml";

  const customLayer = L.geoJson(null, {
    style: function (feature) {
      if (feature.geometry.type === "Polygon") {
        return {
          color: "#ef4444",
          fillColor: "#ef4444",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.15,
        };
      }
      return {};
    },
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, {
        icon: L.divIcon({
          className: "transport-marker-container",
          html: `<i class="icon ri-camera-lens-fill" style="font-size:16px;"></i>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          bgPos: [0, 0],
        }),
      });
    },
    onEachFeature: function (feature, layer) {
      if (feature.properties) {
        let content = `<div style="text-align:center; min-width:200px;">`;
        if (feature.properties.name)
          content += `<h4 style="margin:0 0 5px 0; color:var(--text-primary);">${feature.properties.name}</h4>`;

        if (feature.properties.description) {
          let desc = feature.properties.description;
          content += `<div style="font-size:0.85rem; color:var(--text-secondary); text-align:left;">${desc}</div>`;
        }
        content += `</div>`;
        layer.bindPopup(content, { closeButton: false });
      }
    },
  });

  const runLayer = omnivore
    .kml(kmlPath, null, customLayer)
    .on("ready", function () {
      restriccionesLayer = runLayer;
      runLayer.addTo(restriccionesMap);
      restriccionesMap.fitBounds(runLayer.getBounds(), { padding: [20, 20] });
    })
    .on("error", function (e) {
      console.error("Error cargando KML local:", e);
      showNotification(
        "Error",
        "No se pudo cargar el archivo KML local",
        "error",
      );
    });
}

function logAutomatedEcoTrip(type) {
  const now = Date.now();
  const lastLog = parseInt(localStorage.getItem(`granaGo_eco_last_${type}`) || "0");
  const COOLDOWN = 5 * 60 * 1000;

  let totalKm = parseFloat(localStorage.getItem("granaGo_eco_km") || "0");

  if (now - lastLog > COOLDOWN) {
    const kmToAdd = (type === 'pt') ? ECO_CONFIG.PT_AVG_KM : ECO_CONFIG.BIKE_AVG_KM;

    totalKm += kmToAdd;

    localStorage.setItem("granaGo_eco_km", totalKm);
    localStorage.setItem(`granaGo_eco_last_${type}`, now);

    if (document.getElementById("home-view").classList.contains("active")) {
      updateHomeEcoWidget();
    }

    addGranaSaldo(Math.floor(kmToAdd * 50), "movilidad sostenible");
  }

  updateAchievement('eco_start', totalKm * ECO_CONFIG.CO2_SAVED_PER_KM, true);
}

const ALL_WIDGETS = {
  event: { id: 'event', title: 'Eventos Hoy', icon: 'ri-calendar-event-fill', class: 'widget-event', action: "navigateTo('cortes')", render: updateHomeEventsWidget },
  eco: { id: 'eco', title: 'Impacto Ecológico', icon: 'ri-leaf-fill', class: 'widget-eco', action: "openEcoCalculator()", render: updateHomeEcoWidget },
  parking: { id: 'parking', title: 'Parkings', icon: 'ri-parking-box-fill', class: 'widget-parking', action: "navigateTo('parkings')", render: updateHomeParking },
  bus: { id: 'bus', title: 'Desvíos Bus', icon: 'ri-bus-fill', class: 'widget-bus', action: "navigateTo('paradas')", render: updateHomeBusWidget },
  fuel: { id: 'fuel', title: 'Combustible', icon: 'ri-gas-station-fill', class: 'widget-fuel', action: "navigateTo('repostar')", render: updateHomeFuel },
  achievements: { id: 'achievements', title: 'Próximos Logros', icon: 'ri-medal-line', class: 'widget-achievements', render: updateHomeAchievementsWidget },
  stops: { id: 'stops', title: 'Paradas Recientes', icon: 'ri-history-line', class: 'widget-recent-stops', action: "navigateTo('paradas')", render: updateHomeRecentWidgets },
  games: { id: 'games', title: 'Últimos Juegos', icon: 'ri-play-list-add-line', class: 'widget-recent-games', action: "navigateTo('juegos')", render: updateHomeRecentWidgets },
  driving: { id: 'driving', title: 'Modo Conducción', icon: 'ri-steering-2-fill', class: 'widget-driving', action: "toggleDrivingMode()", render: updateHomeDrivingWidget },
  radio: { id: 'radio', title: 'Radio Graná', icon: 'ri-radio-2-fill', class: 'widget-radio', action: "navigateTo('radio')", render: updateHomeRadioWidget }
};

const DEFAULT_LAYOUT = [
  { id: 'driving', active: true },
  { id: 'radio', active: true },
  { id: 'event', active: true },
  { id: 'eco', active: true },
  { id: 'parking', active: true },
  { id: 'bus', active: true },
  { id: 'fuel', active: true },
  { id: 'achievements', active: true },
  { id: 'stops', active: true },
  { id: 'games', active: true }
];

let homeLayout = [];
const savedLayout = JSON.parse(localStorage.getItem('granaGo_home_layout'));

if (savedLayout && Array.isArray(savedLayout)) {
  homeLayout = savedLayout.filter(item => ALL_WIDGETS[item.id]);
  DEFAULT_LAYOUT.forEach(def => {
    if (!homeLayout.find(item => item.id === def.id)) {
      homeLayout.push({ ...def });
    }
  });
} else {
  homeLayout = DEFAULT_LAYOUT.map(item => ({ ...item }));
}

async function renderHomeDashboard() {
  const container = document.getElementById('home-dashboard-grid');
  if (!container) return;

  const customConfig = localStorage.getItem('granaGo_home_layout');

  if (customConfig) {
    container.innerHTML = '';
    homeLayout.forEach(config => {
      if (!config.active) return;
      const w = ALL_WIDGETS[config.id];
      const card = document.createElement('div');
      card.className = `summary-card ${w.class}`;
      card.onclick = () => eval(w.action);
      card.innerHTML = `
        <div class="summary-header">
          <div class="summary-icon"><i class="${w.icon}"></i></div>
          <span class="summary-title" id="${w.id}-widget-title">${w.title}</span>
        </div>
        <div id="home-${w.id}-content" class="mini-list-container">
          <div class="skeleton-text"></div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  const priorityOrder = ['driving', 'radio', 'parking', 'fuel', 'stops', 'eco', 'achievements', 'games', 'bus', 'event'];

  priorityOrder.forEach((id, index) => {
    const w = ALL_WIDGETS[id];
    if (w && w.render && document.getElementById(`home-${id}-content`)) {
      setTimeout(() => w.render(), index * 100);
    }
  });
}

window.openHomeEditor = function () {
  tempHomeLayout = JSON.parse(JSON.stringify(homeLayout));
  document.getElementById('home-editor-modal').classList.add('visible');
  renderEditorList();
};

function renderEditorList() {
  const list = document.getElementById('home-editor-list');
  if (!list) return;
  list.innerHTML = '';

  tempHomeLayout.forEach((item, index) => {
    const w = ALL_WIDGETS[item.id];
    if (!w) return;

    const row = document.createElement('div');
    row.className = 'transport-card editor-row';
    row.style.cssText = 'padding: 10px 15px; justify-content: space-between; margin: 0; cursor: grab;';
    row.setAttribute('draggable', true);
    row.dataset.index = index;

    row.addEventListener('dragstart', (e) => {
      dragStartIndex = index;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      row.classList.add('drag-over');
    });

    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const dragEndIndex = index;
      swapWidgets(dragStartIndex, dragEndIndex);
      renderEditorList();
    });

    row.addEventListener('dragend', () => row.classList.remove('dragging'));

    const isActive = item.active;
    const switchBg = isActive ? 'var(--text-accent)' : '#cbd5e1';
    const handleTransform = isActive ? 'translateX(20px)' : 'translateX(0px)';

    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; pointer-events:none;">
        <i class="ri-drag-move-2-fill" aria-hidden="true"></i>
        <span style="font-weight:600;">${w.title}</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button onclick="moveWidget(${index}, -1)" class="icon-btn-small"><i class="ri-arrow-up-s-line"></i></button>
        <button onclick="moveWidget(${index}, 1)" class="icon-btn-small"><i class="ri-arrow-down-s-line"></i></button>
        <div role="switch" onclick="toggleWidget(${index}, this)" 
             class="theme-switch ${isActive ? 'active' : ''}" 
             style="background: ${switchBg};">
          <div class="switch-handle" style="transform: ${handleTransform};"></div>
        </div>
      </div>
    `;
    list.appendChild(row);
  });
}

function swapWidgets(from, to) {
  const item = tempHomeLayout.splice(from, 1)[0];
  tempHomeLayout.splice(to, 0, item);
}

window.moveWidget = function (idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= tempHomeLayout.length) return;
  [tempHomeLayout[idx], tempHomeLayout[newIdx]] = [tempHomeLayout[newIdx], tempHomeLayout[idx]];
  renderEditorList();
};

window.toggleWidget = function (idx, el) {
  if (!tempHomeLayout[idx]) return;

  tempHomeLayout[idx].active = !tempHomeLayout[idx].active;
  const isActive = tempHomeLayout[idx].active;

  el.classList.toggle('active', isActive);
  el.style.background = isActive ? 'var(--text-accent)' : '#cbd5e1';

  const handle = el.querySelector('.switch-handle');
  if (handle) {
    handle.style.transform = isActive ? 'translateX(20px)' : 'translateX(0px)';
  }
};

window.saveHomeConfig = function () {
  homeLayout = JSON.parse(JSON.stringify(tempHomeLayout));
  localStorage.setItem('granaGo_home_layout', JSON.stringify(homeLayout));
  closeHomeEditor();
  renderHomeDashboard();
  showNotification("Éxito", "Diseño de inicio actualizado", "success");
};

window.closeHomeEditor = function () {
  document.getElementById('home-editor-modal').classList.remove('visible');
};

async function initHomeDashboard() {
  const savedLat = localStorage.getItem("granaGo_last_lat");
  const savedLng = localStorage.getItem("granaGo_last_lng");

  if (savedLat && savedLng) {
    window.currentLat = parseFloat(savedLat);
    window.currentLng = parseFloat(savedLng);
  }

  await renderHomeDashboard();
  initWeather();

  setTimeout(() => {
    updateHomeBusWidget();
    updateHomeEventsWidget();
    updateHomeParking();
    updateHomeFuel();
  }, 1500);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        window.currentLat = lat;
        window.currentLng = lng;
        localStorage.setItem("granaGo_last_lat", lat);
        localStorage.setItem("granaGo_last_lng", lng);

        getGPSLocationName(lat, lng).then(name => {
          localStorage.setItem("granaGo_gps_name", name);
          initWeather();
          updateHomeFuel();
        });
      },
      null,
      { timeout: 10000, maximumAge: 60000 }
    );
  }
}

const PROXY_URL = "https://proxy.contacto-granago.workers.dev/?url=";
const URLS = {
  rss:
    PROXY_URL +
    encodeURIComponent("http://www.movilidadgranada.com/app/noticias/rss.php"),
  centro:
    PROXY_URL +
    encodeURIComponent("http://www.movilidadgranada.com/bus_cortecentro.php"),
  novedades:
    PROXY_URL +
    encodeURIComponent("http://www.movilidadgranada.com/bus_novedades.php"),
};

const VALID_LINES = new Set([
  "4",
  "5",
  "7",
  "8",
  "9",
  "11",
  "13",
  "21",
  "33",
  "N1",
  "N3",
  "N5",
  "N6",
  "N9",
  "S0",
  "S2",
  "C5",
  "C30",
  "C31",
  "C32",
  "C34",
  "C35",
  "U1",
  "U2",
  "U3",
  "111",
  "121",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
]);

function cleanHTML(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  doc
    .querySelectorAll(
      "script, style, nav, footer, header, .menu, #menu, .footer",
    )
    .forEach((e) => e.remove());
  return doc.body.innerText.replace(/\s+/g, " ").trim();
}

const MONTHS_MAP = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const NUM_WORDS = {
  un: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
};

function parseSmartDate(str) {
  if (!str) return null;
  const now = new Date();
  const currentYear = now.getFullYear();
  const cleanStr = str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const numericMatch = cleanStr.match(
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
  );
  if (numericMatch) {
    let d = parseInt(numericMatch[1]);
    let m = parseInt(numericMatch[2]) - 1;
    let y = parseInt(numericMatch[3]);
    if (y < 100) y += 2000;
    return new Date(y, m, d);
  }

  const textMatch = cleanStr.match(
    /(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+de\s+(\d{4}))?/,
  );
  if (textMatch) {
    let d = parseInt(textMatch[1]);
    let monthName = textMatch[2];
    let m = MONTHS_MAP[monthName];
    if (m === undefined) return null;
    let y = textMatch[3] ? parseInt(textMatch[3]) : currentYear;
    return new Date(y, m, d);
  }
  return null;
}

function addDuration(date, quantityStr, unitStr) {
  const result = new Date(date);
  let qty = parseInt(quantityStr);
  if (isNaN(qty)) qty = NUM_WORDS[quantityStr.toLowerCase()] || 1;

  const u = unitStr.toLowerCase();
  if (u.includes("dia") || u.includes("día"))
    result.setDate(result.getDate() + qty);
  else if (u.includes("semana")) result.setDate(result.getDate() + qty * 7);
  else if (u.includes("mes")) result.setMonth(result.getMonth() + qty);
  else if (u.includes("año")) result.setFullYear(result.getFullYear() + qty);
  return result;
}

function isDateActive(text) {
  if (!text) return false;
  const now = new Date();
  const currentYear = now.getFullYear();

  const clean = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

  const R_DATE =
    "(?:\\d{1,2}\\s+(?:de\\s+)?[a-z]+(?:\\s+de\\s+\\d{4})?|\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})";
  const rangeRegex = new RegExp(
    `(?:del?|desde(?:\\s+el)?|entre(?:\\s+el)?)\\s+(${R_DATE})\\s+(?:al?|a\\s+el|hasta(?:\\s+el)?|y(?:\\s+el)?)\\s+(${R_DATE})`,
    "i",
  );
  const rangeMatch = clean.match(rangeRegex);

  if (rangeMatch) {
    let start = parseSmartDate(rangeMatch[1]);
    let end = parseSmartDate(rangeMatch[2]);

    if (start && end) {
      if (start > end) {
        if (now.getMonth() <= 5) {
          start.setFullYear(currentYear - 1);
          end.setFullYear(currentYear);
        } else {
          start.setFullYear(currentYear);
          end.setFullYear(currentYear + 1);
        }
      } else {
        if (end < now && !rangeMatch[0].match(/\d{4}/)) {
        }
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return now >= start && now <= end;
    }
  }

  const durationRegex = new RegExp(
    `durante\\s+(\\d+|[a-z]+)\\s+(dias?|semanas?|meses|anos?)\\s+(?:a partir|desde|iniciando)(?:\\s+del?|\\s+el)?\\s+(${R_DATE})`,
    "i",
  );
  const durMatch = clean.match(durationRegex);

  if (durMatch) {
    const start = parseSmartDate(durMatch[3]);
    if (start) {
      if (
        start.getMonth() > now.getMonth() + 2 &&
        start.getFullYear() === currentYear
      ) {
        start.setFullYear(currentYear - 1);
      }

      const end = addDuration(start, durMatch[1], durMatch[2]);
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      return now >= start && now <= end;
    }
  }

  const singleRegex = new RegExp(
    `(?:el|dia|desde(?:\\s+el)?|a partir(?:\\s+del?)?)\\s+(${R_DATE})`,
    "i",
  );
  const singleMatch = clean.match(singleRegex);

  if (singleMatch) {
    const date = parseSmartDate(singleMatch[1]);
    if (date) {
      if (
        date.getMonth() > now.getMonth() + 2 &&
        date.getFullYear() === currentYear
      ) {
        date.setFullYear(currentYear - 1);
      }

      if (clean.includes("desde") || clean.includes("a partir")) {
        date.setHours(0, 0, 0, 0);
        return now >= date;
      }

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    }
  }
  if (
    clean.includes("hoy") ||
    clean.includes("ahora") ||
    clean.includes("actualmente") ||
    clean.includes("vigente")
  ) {
    return true;
  }

  return false;
}

function isDayTimeActive(text) {
  if (!text) return true;
  const clean = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeVal = hour + minutes / 60;

  if (clean.includes("laborables") || clean.includes("lunes a viernes")) {
    if (day === 0 || day === 6) return false;
  }
  if (clean.includes("fin de semana")) {
    if (day >= 1 && day <= 5) return false;
  }
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  let mentionedDays = [];
  dias.forEach((d, idx) => {
    if (new RegExp(`\\b${d}s?\\b`).test(clean)) mentionedDays.push(idx);
  });

  if (
    mentionedDays.length > 0 &&
    !mentionedDays.includes(day) &&
    !clean.includes("laborables")
  ) {
    return false;
  }

  const timeRegex =
    /(\d{1,2})(?::(\d{2}))?\s*(?:h|horas)?\s*(?:y|a|hasta)\s*(\d{1,2})(?::(\d{2}))?/gi;
  let match;
  let hasTimeRestrictions = false;
  let isInsideAnyRange = false;

  while ((match = timeRegex.exec(clean)) !== null) {
    hasTimeRestrictions = true;
    const h1 = parseInt(match[1]);
    const m1 = match[2] ? parseInt(match[2]) : 0;
    const h2 = parseInt(match[3]);
    const m2 = match[4] ? parseInt(match[4]) : 0;

    const startVal = h1 + m1 / 60;
    const endVal = h2 + m2 / 60;

    if (currentTimeVal >= startVal && currentTimeVal <= endVal) {
      isInsideAnyRange = true;
    }
  }

  if (hasTimeRestrictions && !isInsideAnyRange) return false;

  return true;
}

function extractLinesToSet(text, setObj) {
  const cleanText = text.replace(/<[^>]*>?/gm, " ").toUpperCase();
  const regex =
    /(?:L[IÍ]NEAS?|BUS(?:ES)?|AFECCI[ÓO]N)(?:[^:0-9]{0,30}[:])?\s*((?:(?:[NCSUFV]?\d+|[A-Z])(?:[,\sYEO./-]|AND)*)+)/gi;

  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    const rawLines = match[1].split(/[^A-Z0-9]+/i);

    rawLines.forEach((n) => {
      const cleanN = n.trim().toUpperCase();
      if (VALID_LINES.has(cleanN)) {
        setObj.add(cleanN);
      }
    });
  }
}

function updateHomeDrivingWidget() {
  const container = document.getElementById("home-driving-content");
  if (!container) return;
  container.innerHTML = `
    <div class="summary-value" style="color:var(--text-accent); font-size:1.1rem;">Asistente Activo</div>
    <div class="summary-sub">Toca para abrir el modo HUD, radares y velocidad.</div>
  `;
}

function updateHomeRadioWidget() {
  const container = document.getElementById("home-radio-content");
  if (!container) return;

  container.innerHTML = `
    <div class="summary-sub" style="font-size: 0.85rem; line-height: 1.4; opacity: 0.9;">
      Escucha tus radios favoritas, todas las radios españolas y las mas escuchadas del resto del mundo.
    </div>
  `;
}

async function updateHomeRecentWidgets() {
  const stopsContainer = document.getElementById("home-stops-content");
  const gamesContainer = document.getElementById("home-games-content");

  if (!stopsContainer && !gamesContainer) return;

  if (stopsContainer) {
    const recentStops = JSON.parse(localStorage.getItem("granaGo_recent_stops") || "[]");

    if (recentStops.length === 0) {
      stopsContainer.innerHTML = `<div class="summary-sub">No has consultado paradas todavía.</div>`;
    } else {
      if (!window.appColors || !window.appColors.urbano || !window.appColors.metro || !window.appColors.interurbano) {
        try {
          const [uCol, mCol, iCol] = await Promise.all([
            fetch("data/urbano/colores.json").then(r => r.json()),
            fetch("data/metro/colores.json").then(r => r.json()),
            fetch("data/interurbano/colores.json").then(r => r.json())
          ]);
          window.appColors = { ...window.appColors, urbano: uCol, metro: mCol, interurbano: iCol };
        } catch (e) {
          console.warn("Error cargando colores");
        }
      }

      const stopFrag = document.createDocumentFragment();
      recentStops.forEach((s) => {
        const btn = document.createElement("button");
        btn.className = "transport-card";
        btn.style.cssText = "width: 100%; padding: 10px; margin: 0; border-radius: 12px; border: 1px solid var(--border-subtle); justify-content: flex-start; gap: 10px; background: var(--bg-app); color: var(--text-primary); display: flex; align-items: center;";

        let icon = "ri-bus-fill";
        let brandColor = "#D9281C";
        if (s.type === "metro") {
          icon = "ri-train-fill";
          brandColor = "#009a44";
        } else if (s.type === "interurbano") {
          icon = "ri-bus-2-fill";
          brandColor = "#2757f5";
        }
        const safeName = s.name.replace(/'/g, "\\'");

        let linesHtml = "";
        if (s.lines) {
          const linesArr = s.lines.split(",").map(l => l.trim());
          linesHtml = `<div style="display:flex; gap:3px; margin-top:4px; flex-wrap:wrap;">`;
          linesArr.slice(0, 5).forEach(l => {
            const color = (window.appColors && window.appColors[s.type]) ? window.appColors[s.type][l] || "#64748b" : "#64748b";
            linesHtml += `<span style="background:${color}; color:white; font-size:9px; padding:1px 4px; border-radius:3px; font-weight:800;">${l}</span>`;
          });
          if (linesArr.length > 5) linesHtml += `<span style="font-size:9px; opacity:0.6;">+${linesArr.length - 5}</span>`;
          linesHtml += `</div>`;
        }

        btn.onclick = (e) => {
          e.stopPropagation();
          openRealTimeModal(s.id, s.type, safeName, s.lines || '');
        };

        btn.innerHTML = `
          <div class="card-icon-wrapper" style="width: 32px; height: 32px; min-width: 32px; background: ${brandColor}1A; color: ${brandColor};">
              <i class="${icon}" style="font-size: 14px;"></i>
          </div>
          <div style="display:flex; flex-direction:column; overflow:hidden;">
              <span style="font-size: 0.85rem; font-weight: 600; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary);">
                  ${s.name}
              </span>
              ${linesHtml}
          </div>`;
        stopFrag.appendChild(btn);
      });

      stopsContainer.innerHTML = "";
      stopsContainer.appendChild(stopFrag);
    }
  }

  if (gamesContainer) {
    const recentGames = JSON.parse(localStorage.getItem("granaGo_recent_games") || "[]");

    if (recentGames.length === 0) {
      gamesContainer.innerHTML = `<div class="summary-sub">Prueba algún juego para que aparezca aquí.</div>`;
      return;
    }

    const gameFrag = document.createDocumentFragment();
    const gameActions = {
      Granádle: "navigateTo('juegos'); openWordleMenu();",
      Granádoku: "navigateTo('juegos'); openSudokuMenu();",
      Granámory: "navigateTo('juegos'); openMemoryMenu();",
      Granáquiz: "navigateTo('juegos'); openQuizMenu();",
      Granámind: "navigateTo('juegos'); openMastermindMenu();",
      "Granábras Encadenadas": "navigateTo('juegos'); openEncadenadasMenu();",
      GranáJack: "navigateTo('juegos'); openBlackjackMenu();",
      GranáSlots: "navigateTo('juegos'); openSlotsMenu();",
      GeoGraná: "navigateTo('juegos'); openGeoMenu();",
      BuscaGraná: "navigateTo('juegos'); openMinesweeperMenu();"
    };

    recentGames.forEach((game) => {
      const btn = document.createElement("button");
      btn.className = "transport-card";
      btn.style.cssText = "width: 100%; padding: 10px; margin: 0; border-radius: 12px; border: 1px solid var(--border-subtle); justify-content: flex-start; gap: 10px; background: var(--bg-app); color: var(--text-primary); display: flex; align-items: center;";

      const action = gameActions[game] || "navigateTo('juegos')";
      btn.onclick = (e) => {
        e.stopPropagation();
        eval(action);
      };

      btn.innerHTML = `
          <div class="card-icon-wrapper" style="width: 32px; height: 32px; min-width: 32px; background: var(--text-accent)1A; color: var(--text-accent);">
              <i class="ri-play-fill" style="font-size: 14px;"></i>
          </div>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${game}</span>`;
      gameFrag.appendChild(btn);
    });

    gamesContainer.innerHTML = "";
    gamesContainer.appendChild(gameFrag);
  }
}

async function updateHomeEventsWidget() {
  const eventsList = document.getElementById("home-event-content");
  if (!eventsList) return;

  const cachedData = localStorage.getItem("granaGo_events_cache");
  const cacheTime = localStorage.getItem("granaGo_events_cache_time");
  const now = Date.now();

  if (cachedData && cacheTime && (now - cacheTime < 600000)) {
    eventsList.innerHTML = cachedData;
    return;
  }

  try {
    const rssRes = await fetch(URLS.rss, { priority: 'low' });
    const rssText = await rssRes.text();
    const parser = new DOMParser();
    const items = parser.parseFromString(rssText, "text/xml").querySelectorAll("item");

    let eventsFound = [];
    const processedTitles = new Set();
    const todayStr = getLocalTodayDate();

    for (const item of items) {
      const title = item.querySelector("title").textContent.trim();
      if (processedTitles.has(title)) continue;

      const descriptionHTML = item.querySelector("description").textContent;
      const cleanDesc = descriptionHTML.replace(/<[^>]*>?/gm, " ").trim();
      const fullSearchText = title + " " + cleanDesc;

      let matchType = null;
      let isEndingToday = false;
      const finPubMatch = descriptionHTML.match(/Fin de la publicación:\s*(\d{4}-\d{2}-\d{2})/i);

      if (finPubMatch && finPubMatch[1] === todayStr) {
        matchType = "fin_hoy";
        isEndingToday = true;
      } else if (isDateActive(fullSearchText) && isDayTimeActive(fullSearchText)) {
        matchType = "activo";
      }

      if (matchType) {
        processedTitles.add(title);
        eventsFound.push({ title, priority: isEndingToday ? 1 : 2, isEndingToday });
      }

      if (eventsFound.length >= 8) break;
    }

    eventsFound.sort((a, b) => a.priority - b.priority);

    const fragment = document.createDocumentFragment();
    if (eventsFound.length === 0) {
      const div = document.createElement("div");
      div.className = "summary-sub";
      div.textContent = "Sin eventos activos en este momento.";
      fragment.appendChild(div);
    } else {
      eventsFound.slice(0, 4).forEach((evt) => {
        const div = document.createElement("div");
        div.className = "mini-event-title";
        div.innerHTML = evt.isEndingToday
          ? `${evt.title} <span style="color: var(--color-error); font-weight: 700; font-size: 0.8em;">(FIN HOY)</span>`
          : evt.title;
        fragment.appendChild(div);
      });
    }

    eventsList.innerHTML = "";
    eventsList.appendChild(fragment);
    localStorage.setItem("granaGo_events_cache", eventsList.innerHTML);
    localStorage.setItem("granaGo_events_cache_time", now);

  } catch (e) {
    console.error("Error Widget Eventos:", e);
    if (!cachedData) eventsList.innerHTML = `<div class="summary-sub">No disponible</div>`;
  }
}

const DIVERSION_ZONES = [
  {
    keywords: ["reyes catolicos", "puerta real", "gran via", "isabel la catolica"],
    name: "Eje Central (Reyes Católicos / Gran Vía)",
    lines: ["4", "8", "11", "21", "33", "C31", "C32", "C34"],
    info: "Desvío por Camino de Ronda o Severo Ochoa."
  },
  {
    keywords: ["recogidas"],
    name: "Calle Recogidas",
    lines: ["9", "11", "C5"],
    info: "Líneas desviadas por calle Molinos o Camino de Ronda."
  },
  {
    keywords: ["san juan de dios", "gran capitan"],
    name: "San Juan de Dios",
    lines: ["25", "C32", "C33"],
    info: "Circular por recorridos alternativos según el corte."
  },
  {
    keywords: ["avenida de la constitucion"],
    name: "Avda. Constitución",
    lines: ["4", "8", "11", "21", "33", "N1", "N3", "N5"],
    info: "Posibles retenciones o desvíos puntuales."
  }
];

async function updateHomeBusWidget() {
  const busContent = document.getElementById("home-bus-content");
  if (!busContent) return;

  let affectedLines = new Set();
  let detectedZones = [];

  try {
    const rssRes = await fetch(URLS.rss, { priority: 'low' });
    const rssText = await rssRes.text();
    const parser = new DOMParser();
    const items = parser.parseFromString(rssText, "text/xml").querySelectorAll("item");

    items.forEach((item) => {
      const title = item.querySelector("title").textContent.toLowerCase();
      const desc = item.querySelector("description").textContent.toLowerCase();
      const fullText = (title + " " + desc).replace(/<[^>]*>?/gm, " ");

      if (isDateActive(fullText) && isDayTimeActive(fullText)) {
        DIVERSION_ZONES.forEach(zone => {
          if (zone.keywords.some(k => fullText.includes(k))) {
            zone.lines.forEach(l => affectedLines.add(l));
            if (!detectedZones.includes(zone.name)) detectedZones.push(zone.name);
          }
        });
        extractLinesToSet(fullText, affectedLines);
      }
    });

    const fragment = document.createDocumentFragment();

    if (affectedLines.size > 0) {
      const zoneTitle = document.createElement("div");
      zoneTitle.style.cssText = "color:var(--color-error); font-weight:700; font-size:0.85rem; margin-bottom:5px;";
      zoneTitle.innerHTML = detectedZones.length > 0
        ? `<i class="ri-alert-fill"></i> Corte en: ${detectedZones.join(", ")}`
        : `<i class="ri-alert-fill"></i> Desvíos activos:`;
      fragment.appendChild(zoneTitle);

      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "bus-lines-wrapper";

      const sortedLines = Array.from(affectedLines).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );

      sortedLines.forEach((l) => {
        const span = document.createElement("span");
        span.className = "bus-line-pill";
        span.textContent = l;
        if (["4", "8", "9", "11", "21", "33"].includes(l)) span.style.backgroundColor = "#d9281c";
        else if (l.startsWith("C")) span.style.backgroundColor = "#059669";
        else span.style.backgroundColor = "#2757f5";

        wrapperDiv.appendChild(span);
      });
      fragment.appendChild(wrapperDiv);

      if (detectedZones.length > 0) {
        const hint = document.createElement("div");
        hint.style.cssText = "font-size:0.7rem; opacity:0.7; margin-top:5px; font-style:italic;";
        hint.innerText = "Recorrido alternativo por ejes principales.";
        fragment.appendChild(hint);
      }
    } else {
      const normalDiv = document.createElement("div");
      normalDiv.innerHTML = `
        <div class="summary-value" style="color:#10b981; font-size:1.2rem">Normal</div>
        <div class="summary-sub">Servicio habitual sin desvíos.</div>
      `;
      fragment.appendChild(normalDiv);
    }

    busContent.innerHTML = "";
    busContent.appendChild(fragment);

  } catch (e) {
    console.error("Error Widget Bus:", e);
    busContent.innerHTML = `<div class="summary-sub">No disponible temporalmente</div>`;
  }
}

async function updateHomeParking() {
  const container = document.getElementById("home-parking-content");
  if (!container) return;
  try {
    const PROXY = "https://proxy.contacto-granago.workers.dev/?url=";
    const TABLE_URL = "http://www.movilidadgranada.com/aparcamientos/par_tabla.php";

    const response = await fetch(PROXY + encodeURIComponent(TABLE_URL));
    const text = await response.text();
    const htmlDoc = new DOMParser().parseFromString(text, "text/html");
    const rows = htmlDoc.querySelectorAll("tr");

    let totalOpen = 0, totalFull = 0, totalParkings = 0;

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return;
      const statusRaw = cells[1].textContent.trim().toUpperCase();
      if (statusRaw.includes("CERRADO")) return;
      totalParkings++;
      if (statusRaw.includes("COMPLETO")) {
        totalFull++;
      } else {
        const match = statusRaw.match(/(\d+)/);
        if (match && parseInt(match[0]) < 10) totalFull++;
        else totalOpen++;
      }
    });

    let statusText = "", color = "", subText = "";
    if (totalParkings === 0) { statusText = "Sin Datos"; subText = "Inténtalo más tarde"; }
    else if (totalFull > totalOpen) { statusText = "Saturado"; color = "#ef4444"; subText = "Mayoría de parkings completos."; }
    else if (totalFull > 0 && totalFull < totalOpen) { statusText = "Ocupado"; color = "#f59e0b"; subText = "Plazas libres moderadas."; }
    else { statusText = "Libre"; color = "#10b981"; subText = "Buena disponibilidad general."; }

    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div class="summary-value" style="color:${color}">${statusText}</div>
        <div class="summary-sub">${subText}</div>
    `;
    fragment.appendChild(wrapper);

    container.innerHTML = "";
    container.appendChild(fragment);

  } catch (e) {
    container.innerHTML = `<div class="summary-sub">Error de conexión</div>`;
  }
}

async function updateHomeFuel() {
  const container = document.getElementById("home-fuel-content");
  const title = document.getElementById("fuel-widget-title");
  if (!container || !title) return;

  try {
    const PROXY = "https://proxy.contacto-granago.workers.dev/?url=";
    const TARGET = encodeURIComponent("https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia/18");

    const res = await fetch(PROXY + TARGET, { priority: 'high' });
    const data = await res.json();
    const rawList = data.ListaEESSPrecio;

    const types = [
      { key: "Precio Gasolina 95 E5", label: "Gas 95" },
      { key: "Precio Gasolina 98 E5", label: "Gas 98" },
      { key: "Precio Gasoleo A", label: "Diésel A" },
      { key: "Precio Gasoleo Premium", label: "Diésel +" },
    ];

    let pricesToShow = {};
    let isNearestMode = false;
    let nearestStationName = "";

    if (typeof window.currentLat !== "undefined" && typeof window.currentLng !== "undefined") {
      let minDistance = Infinity;
      let nearestStation = null;
      rawList.forEach((s) => {
        const lat = parseFloat(s["Latitud"].replace(",", "."));
        const lng = parseFloat(s["Longitud (WGS84)"].replace(",", "."));
        if (!isNaN(lat) && !isNaN(lng)) {
          const dist = getDistanceFromLatLonInKm(window.currentLat, window.currentLng, lat, lng);
          if (dist < minDistance) { minDistance = dist; nearestStation = s; }
        }
      });
      if (nearestStation && minDistance < 10) {
        isNearestMode = true;
        nearestStationName = nearestStation["Rótulo"];
        title.innerHTML = `Más Cercana <i class="ri-map-pin-user-fill" style="font-size:0.8em; color:var(--color-primary);"></i>`;
        types.forEach((t) => {
          const val = nearestStation[t.key];
          pricesToShow[t.label] = val && val !== "" ? val : "-";
        });
      }
    }

    if (!isNearestMode) {
      title.innerText = "Precios Medios";
      types.forEach((t) => {
        let sum = 0, count = 0;
        rawList.forEach((s) => {
          const valStr = s[t.key];
          if (valStr) {
            const val = parseFloat(valStr.replace(",", "."));
            if (!isNaN(val)) { sum += val; count++; }
          }
        });
        pricesToShow[t.label] = count > 0 ? (sum / count).toFixed(3) : "-";
      });
    }

    const fragment = document.createDocumentFragment();

    if (isNearestMode) {
      const stationDiv = document.createElement("div");
      stationDiv.className = "notranslate";
      stationDiv.style.cssText = "font-size:0.75rem; font-weight:700; color:var(--color-primary); margin-bottom:8px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; background:rgba(37,99,235,0.1); padding:4px 8px; border-radius:8px;";
      stationDiv.textContent = nearestStationName;
      fragment.appendChild(stationDiv);
    }

    const gridDiv = document.createElement("div");
    gridDiv.className = "fuel-price-grid";

    types.forEach((t) => {
      let priceDisplay = pricesToShow[t.label];
      if (priceDisplay !== "-") priceDisplay += " €";

      const item = document.createElement("div");
      item.className = "fuel-price-item";
      item.innerHTML = `
          <span class="fuel-type-label">${t.label}</span>
          <span class="fuel-price-val">${priceDisplay}</span>
      `;
      gridDiv.appendChild(item);
    });

    fragment.appendChild(gridDiv);

    container.innerHTML = "";
    container.appendChild(fragment);

  } catch (e) {
    console.error("Error Fuel Widget:", e);
    container.innerHTML = `<div class="summary-sub">Datos no disponibles</div>`;
  }
}

window.googleTranslateElementInit = function () {
  new google.translate.TranslateElement(
    {
      pageLanguage: "es",
      includedLanguages: "es,en,fr,it",
      autoDisplay: false,
    },
    "google_translate_element",
  );
};

function loadGoogleTranslateScript() {
  return new Promise((resolve, reject) => {
    if (googleTranslateScriptLoaded) {
      return resolve();
    }

    if (document.querySelector('script[src*="translate.google.com"]')) {
      googleTranslateScriptLoaded = true;
      return resolve();
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;

    script.onload = () => {
      googleTranslateScriptLoaded = true;
      setTimeout(resolve, 100);
    };

    script.onerror = () =>
      reject(new Error("Error al cargar Google Translate"));
    document.body.appendChild(script);
  });
}

function waitForGoogleDropdown(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const combo = document.querySelector(".goog-te-combo");
    if (combo) return resolve(combo);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = document.querySelector(".goog-te-combo");
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("Timeout: El widget de Google no cargó a tiempo."));
      }
    }, 200);
  });
}

window.changeLanguage = async function (lang) {
  const consent = localStorage.getItem("granaGo_cookie_consent");

  if (consent !== "accepted") {
    const banner = document.getElementById("cookie-banner");
    if (banner) {
      banner.classList.add("visible");
      showNotification(
        "Acción requerida",
        "Debes aceptar las cookies para habilitar la traducción.",
        "info",
      );
    }
    return;
  }

  const isFirstLoad = !googleTranslateScriptLoaded;

  if (isFirstLoad) {
    showNotification("Cargando idiomas", "Preparando traducción...", "info");
    try {
      await loadGoogleTranslateScript();
    } catch (error) {
      console.error(error);
      showNotification("Error", "No se pudo cargar el traductor", "error");
      return;
    }
  }

  try {
    const googleSelect = await waitForGoogleDropdown();

    if (googleSelect) {
      if (isFirstLoad) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (lang === 'es') {
        localStorage.setItem("granaGo_selected_lang", "es");

        const domain = window.location.hostname;
        document.cookie = "googtrans=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = `googtrans=; Path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        document.cookie = `googtrans=; Path=/; domain=.${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        location.reload();
        return;
      }

      googleSelect.value = lang;
      googleSelect.dispatchEvent(new Event("change"));
      googleSelect.dispatchEvent(new Event("input"));

      localStorage.setItem("granaGo_selected_lang", lang);

      const langNames = {
        es: "Español",
        en: "English",
        fr: "Français",
        it: "Italiano",
      };

      let msg = `Traduciendo a ${langNames[lang] || lang}...`;
      showNotification("Idioma cambiado", msg, "success");
      updateLangButtonActiveState(lang);
    }
  } catch (e) {
    console.warn("No se pudo activar el traductor:", e);
    showNotification("Error", "Inténtalo de nuevo en un segundo", "error");
  }
};

function updateLangButtonActiveState(lang) {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.style.filter = "brightness(1)";
    btn.style.transform = "scale(1)";
  });
  const activeBtn = document.querySelector(`.lang-${lang}`);
  if (activeBtn) {
    activeBtn.style.filter = "brightness(1.2)";
    activeBtn.style.transform = "scale(1.05)";
  }
}

function initCookieConsent() {
  const consent = localStorage.getItem("granaGo_cookie_consent");
  const banner = document.getElementById("cookie-banner");

  if (!consent) {
    setTimeout(() => {
      banner.classList.add("visible");
    }, 1500);
  }

  document
    .getElementById("btn-accept-cookies")
    .addEventListener("click", () => {
      localStorage.setItem("granaGo_cookie_consent", "accepted");
      banner.classList.remove("visible");
      showNotification("Cookies Aceptadas", "Traducción habilitada", "success");
    });

  document
    .getElementById("btn-reject-cookies")
    .addEventListener("click", () => {
      localStorage.setItem("granaGo_cookie_consent", "rejected");
      banner.classList.remove("visible");
      showNotification(
        "Cookies Rechazadas",
        "La traducción estará desactivada",
        "info",
      );
    });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("Service Worker registrado:", reg);

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            reg.update();
            console.log("Comprobando actualizaciones al volver...");
          }
        });

        setInterval(
          () => {
            reg.update();
          },
          15 * 60 * 1000,
        );

        reg.addEventListener("updatefound", () => {
          newWorker = reg.installing;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setTimeout(() => {
                showUpdateNotification();
              }, 1500);
            }
          });
        });
      })
      .catch((err) => {
        console.error("Error al registrar SW:", err);
      });
  });

  let refreshing;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    if (isManualUpdate) {
      window.location.reload();
      refreshing = true;
    }
  });
}

function showUpdateNotification() {
  const container = document.getElementById("notification-container");
  if (!container) return;

  if (document.getElementById("pwa-update-toast")) {
    return;
  }

  const toast = document.createElement("div");
  toast.id = "pwa-update-toast";
  toast.className = "notification-toast toast-info gpu-accelerated";
  toast.style.animation = "slideInDown 0.4s forwards";
  toast.style.pointerEvents = "auto";

  toast.innerHTML = `
    <i class="notification-icon icon ri-download-cloud-2-fill"></i>
    <div class="notification-content">
      <h4 class="notification-title">Actualización disponible</h4>
      <p class="notification-message">Nueva versión de GranáGo.</p>
      <button id="update-btn" style="
          margin-top: 8px; 
          background: var(--text-accent); 
          color: white; 
          border: none; 
          padding: 6px 12px; 
          border-radius: 8px; 
          font-weight: 700; 
          cursor: pointer;">
        Actualizar ahora
      </button>
    </div>
  `;

  container.appendChild(toast);

  document.getElementById("update-btn").addEventListener("click", () => {
    isManualUpdate = true;
    const toastElem = document.getElementById("pwa-update-toast");
    if (toastElem) toastElem.style.display = "none";
    const worker =
      newWorker ||
      (navigator.serviceWorker.registration
        ? navigator.serviceWorker.registration.waiting
        : null);

    if (worker) {
      worker.postMessage({ action: "skipWaiting" });
    } else {
      window.location.reload();
    }
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("[PWA] App lista para instalar");
});

window.installPWA = async function () {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    showNotification(
      "¡Ya la tienes!",
      "GranáGo ya está instalada en tu dispositivo.",
      "success",
    );
    return;
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Opción de usuario: ${outcome}`);
    deferredPrompt = null;

    if (outcome === "accepted") {
      showNotification(
        "Instalando...",
        "Gracias por instalar GranáGo",
        "success",
      );
    }
  } else {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      showNotification(
        "Instalar en iPhone",
        "Pulsa el botón 'Compartir' de Safari y selecciona 'Añadir a la pantalla de inicio'.",
        "info",
      );
    } else {
      showNotification(
        "Instalación",
        "Si no ves la opción, busca 'Instalar aplicación' en el menú de tu navegador.",
        "info",
      );
    }
  }
};

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  console.log("[PWA] Aplicación instalada correctamente");
  showNotification(
    "¡Instalada!",
    "GranáGo ya está en tu pantalla de inicio",
    "success",
  );
});

window.hardReload = async function () {
  showNotification(
    "Reiniciando...",
    "Limpiando caché y forzando actualización...",
    "info",
  );

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    const url = new URL(window.location.href);
    url.searchParams.set("t", Date.now());
    window.location.href = url.toString();
  } catch (error) {
    console.error("Error durante la recarga forzada:", error);
    window.location.reload();
  }
};

window.toggleNearbyPanel = function () {
  const overlay = document.getElementById("nearby-overlay");
  const content = document.getElementById("nearby-list-content");

  if (isNearbyPanelOpen) {
    overlay.classList.remove("visible");
    isNearbyPanelOpen = false;
  } else {
    content.innerHTML =
      '<div class="spinner" style="margin:30px auto;"></div><p style="text-align:center; font-size:0.8rem; color:var(--text-secondary);">Localizando paradas...</p>';
    overlay.classList.add("visible");
    isNearbyPanelOpen = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          calculateNearbyStops(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          content.innerHTML =
            '<div class="empty-state"><i class="ri-gps-line" style="font-size:2rem; margin-bottom:10px; display:block;"></i><p>Activa el GPS para ver paradas cercanas.</p></div>';
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      content.innerHTML =
        '<div class="empty-state">Tu navegador no soporta geolocalización.</div>';
    }
  }
};

function calculateNearbyStops(lat, lng) {
  const content = document.getElementById("nearby-list-content");

  if (!allSearchableStops || allSearchableStops.length === 0) return;

  const ROUGH_DELTA = 0.02;
  const candidates = allSearchableStops.filter(stop =>
    Math.abs(stop.lat - lat) < ROUGH_DELTA && Math.abs(stop.lon - lng) < ROUGH_DELTA
  );

  const withDistance = candidates.map((stop) => ({
    ...stop,
    distance: getDistanceFromLatLonInKm(lat, lng, stop.lat, stop.lon)
  }));

  const urbanos = withDistance
    .filter((s) => s.layerKey === "urbano")
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  const metros = withDistance
    .filter((s) => s.layerKey === "metro")
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2);

  const interurbanos = withDistance
    .filter((s) => s.layerKey === "interurbano")
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2);

  if (
    urbanos.length === 0 &&
    metros.length === 0 &&
    interurbanos.length === 0
  ) {
    content.innerHTML = '<div class="empty-state">No hay paradas cerca.</div>';
    return;
  }

  let html = "";

  if (urbanos.length > 0) {
    html += `<div style="font-size:0.75rem; font-weight:800; color:var(--text-secondary); margin:10px 0 5px 0; text-transform:uppercase;">Autobuses Urbanos</div>`;
    urbanos.forEach((s) => (html += createNearbyItemHTML(s)));
  }

  if (metros.length > 0) {
    html += `<div style="font-size:0.75rem; font-weight:800; color:var(--text-secondary); margin:15px 0 5px 0; text-transform:uppercase;">Metro</div>`;
    metros.forEach((s) => (html += createNearbyItemHTML(s)));
  }

  if (interurbanos.length > 0) {
    html += `<div style="font-size:0.75rem; font-weight:800; color:var(--text-secondary); margin:15px 0 5px 0; text-transform:uppercase;">Interurbanos</div>`;
    interurbanos.forEach((s) => (html += createNearbyItemHTML(s)));
  }

  content.innerHTML = html;
}

function createNearbyItemHTML(stop) {
  const distDisplay =
    stop.distance < 1
      ? Math.round(stop.distance * 1000) + " m"
      : stop.distance.toFixed(1) + " km";

  let color = "#64748b";
  if (stop.layerKey === "urbano") color = "#D9281C";
  if (stop.layerKey === "metro") color = "#009a44";
  if (stop.layerKey === "interurbano") color = "#2757f5";

  const safeName = stop.name.replace(/'/g, "\\'");
  const safeLines = (stop.lines || "").replace(/'/g, "\\'");

  const favs = getFavorites();
  const isFav = favs.some((f) => f.id == stop.id);
  const starIcon = isFav ? "ri-star-fill" : "ri-star-line";
  const starClass = isFav ? "active" : "";

  let actionsHtml = `
          <button class="icon-btn-small" onclick="openRealTimeModal('${stop.id}', '${stop.layerKey}', '${safeName}')">
              <i class="icon ri-search-line" style="font-size:1.2rem; color:var(--text-primary);"></i>
          </button>
          <button class="icon-btn-small ${starClass}" onclick="toggleFavorite('${stop.id}', '${stop.layerKey}', '${safeName}', '${safeLines}', this)">
              <i class="icon ${starIcon}" style="font-size:1.2rem; color:${isFav ? "#fbbf24" : "var(--text-secondary)"};"></i>
          </button>
      `;

  const mapBtn = `
        <button class="icon-btn-small" onclick="flyToStopFromList(${stop.lat}, ${stop.lon})">
            <i class="icon ri-map-pin-line" style="font-size:1.2rem;"></i>
        </button>
    `;

  return `
        <div class="nearby-item">
            <div class="nearby-icon-box" style="background:${color}">
                <i class="icon ${stop.typeIcon}"></i>
            </div>
            <div class="nearby-info">
                <span class="nearby-name">${stop.name}</span>
                <div class="nearby-meta">
                    <span class="distance-badge">${distDisplay}</span>
                </div>
            </div>
            <div class="nearby-actions">
                ${actionsHtml}
                ${mapBtn}
            </div>
        </div>
    `;
}

window.flyToStopFromList = function (lat, lon) {
  if (mapInstance) {
    toggleNearbyPanel();

    const targetStop = allSearchableStops.find(
      (s) =>
        Math.abs(s.lat - lat) < 0.000001 && Math.abs(s.lon - lon) < 0.000001,
    );

    if (targetStop && targetStop.marker) {
      const layerKey = targetStop.layerKey;

      if (mapLayers[layerKey] && !mapInstance.hasLayer(mapLayers[layerKey])) {
        mapInstance.addLayer(mapLayers[layerKey]);

        const filterBtn = document.querySelector(
          `.filter-chip[data-layer="${layerKey}"]`,
        );
        if (filterBtn) filterBtn.classList.add("active");

        showNotification(
          "Capa activada",
          `Se activó ${layerKey} para ver la parada`,
          "info",
        );
      }

      const clusterGroup = mapLayers[layerKey];

      if (clusterGroup) {
        clusterGroup.zoomToShowLayer(targetStop.marker, function () {
          setTimeout(() => {
            targetStop.marker.openPopup();
          }, 200);
        });
      } else {
        mapInstance.flyTo([lat, lon], 18);
        mapInstance.once("moveend", () => {
          targetStop.marker.openPopup();
        });
      }
    }
  }
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

let wordleConfig = {
  mode: "daily",
  len: 4,
  target: "",
  originalTarget: "",
  attempts: 6,
  currentAttempt: 0,
  currentTile: 0,
  gameOver: false,
};

let wordleDictionary = null;

async function initWordleDictionary() {
  if (wordleDictionary) return true;

  try {
    const response = await fetch("data/palabras.json");
    if (!response.ok) throw new Error("No se encontró el diccionario");

    const rawData = await response.json();

    wordleDictionary = {
      4: { targets: [], valid: new Set() },
      5: { targets: [], valid: new Set() },
      6: { targets: [], valid: new Set() },
    };

    rawData.forEach((word) => {
      const cleanWord = word.trim();
      const len = cleanWord.length;

      if (wordleDictionary[len]) {
        wordleDictionary[len].targets.push(cleanWord);

        const normalized = cleanWord
          .toUpperCase()
          .replace(/[ÁÀÄÂ]/g, "A")
          .replace(/[ÉÈËÊ]/g, "E")
          .replace(/[ÍÌÏÎ]/g, "I")
          .replace(/[ÓÒÖÔ]/g, "O")
          .replace(/[ÚÙÜÛ]/g, "U");

        wordleDictionary[len].valid.add(normalized);
      }
    });

    console.log(`Diccionario cargado con soporte Ñ`);
    return true;
  } catch (e) {
    console.error("Error cargando diccionario:", e);
    showNotification("Error", "Fallo al cargar palabras", "error");
    return false;
  }
}

function openWordleMenu() {
  const setupContainer = document.getElementById("wordle-setup");
  if (!wordleSetupHTML) {
    wordleSetupHTML = setupContainer.innerHTML;
  }
  trackRecentItem("granaGo_recent_games", "Granádle");
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("wordle-game-container").style.display = "block";

  setupContainer.innerHTML = wordleSetupHTML;
  setupContainer.style.display = "block";
  document.getElementById("wordle-board").innerHTML = "";

  wordleConfig = {
    mode: "daily",
    len: 4,
    target: "",
    originalTarget: "",
    attempts: 6,
    currentAttempt: 0,
    currentTile: 0,
    gameOver: false,
  };

  const input = document.getElementById("wordle-native-input");
  if (input) input.value = "";

  initWordleDictionary();
  updateWordleStatsDisplay();
}

function closeWordle() {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("wordle-game-container").style.display = "none";
  wordleConfig.gameOver = false;
}

function setWordleMode(mode) {
  wordleConfig.mode = mode;
  document
    .getElementById("btn-mode-daily")
    .classList.toggle("active", mode === "daily");
  document
    .getElementById("btn-mode-infinite")
    .classList.toggle("active", mode === "infinite");
  updateWordleStatsDisplay();
}

function setWordleLen(len) {
  wordleConfig.len = len;
  [4, 5, 6].forEach((l) =>
    document
      .getElementById(`btn-len-${l}`)
      .classList.toggle("active", l === len),
  );
}

function updateWordleStatsDisplay() {
  const stats = JSON.parse(
    localStorage.getItem("granaGo_wordle_stats") || '{"daily":0, "infinite":0}',
  );
  const val = wordleConfig.mode === "daily" ? stats.daily : stats.infinite;
  document.getElementById("wordle-stats-text").innerText = `Racha ${wordleConfig.mode === "daily" ? "Diaria" : "Actual"
    }: ${val}`;
}

async function startWordleGame(retryCount = 0) {
  const setupContainer = document.getElementById("wordle-setup");
  const todayStr = new Date().toDateString();

  if (!wordleSetupHTML) wordleSetupHTML = setupContainer.innerHTML;

  if (!wordleDictionary) {
    setupContainer.innerHTML =
      '<div class="spinner" style="margin:20px auto"></div><p style="text-align:center;">Cargando diccionario...</p>';
    const loaded = await initWordleDictionary();
    if (!loaded) {
      setupContainer.innerHTML = wordleSetupHTML;
      return;
    }
  }

  if (wordleConfig.mode === "daily") {
    const lastPlay = localStorage.getItem(
      `wordle_last_daily_${wordleConfig.len}`,
    );

    if (lastPlay === todayStr) {
      showNotification(
        "Aviso",
        `Ya has completado el reto diario de ${wordleConfig.len} letras.`,
        "info",
      );
      if (setupContainer.innerHTML.includes("spinner"))
        setupContainer.innerHTML = wordleSetupHTML;
      return;
    }

    const savedState = loadWordleState();
    if (savedState) {
      wordleConfig.target = savedState.target;
      wordleConfig.originalTarget =
        savedState.originalTarget || savedState.target;
      wordleConfig.gameOver = savedState.gameOver;

      document.getElementById("wordle-setup").style.display = "none";
      renderWordleBoard();

      const tiles = document.querySelectorAll(".wordle-cell");
      if (savedState.board) {
        savedState.board.forEach((data, i) => {
          if (tiles[i]) {
            tiles[i].innerText = data.text;
            data.classes.forEach((cls) => tiles[i].classList.add(cls));
          }
        });
      }

      let filasUsadas = 0;
      for (let r = 0; r < wordleConfig.attempts; r++) {
        const firstCellIndex = r * wordleConfig.len;
        const cell = tiles[firstCellIndex];
        if (
          cell &&
          (cell.classList.contains("correct") ||
            cell.classList.contains("present") ||
            cell.classList.contains("absent"))
        ) {
          filasUsadas++;
        }
      }
      wordleConfig.currentAttempt = filasUsadas;

      startGameUI(true);
      return;
    }
  }

  setupContainer.innerHTML =
    '<div class="spinner" style="margin:20px auto"></div><p style="text-align:center;">Preparando palabra...</p>';

  try {
    const wordLen = wordleConfig.len;

    if (!wordleDictionary[wordLen] || !wordleDictionary[wordLen].targets) {
      throw new Error("No hay palabras cargadas para esta longitud");
    }

    const targets = wordleDictionary[wordLen].targets;

    if (targets.length === 0) throw new Error("Lista de palabras vacía");

    let selectedWord = "";

    if (wordleConfig.mode === "daily") {
      const today = new Date();
      const seed =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();
      const uniqueIndex = (seed * 123 + wordLen * 45) % targets.length;
      selectedWord = targets[uniqueIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * targets.length);
      selectedWord = targets[randomIndex];
    }

    wordleConfig.originalTarget = selectedWord.toUpperCase();
    wordleConfig.target = selectedWord
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    startGameUI(false);
    saveWordleState();
  } catch (e) {
    console.error("Error startWordleGame:", e);
    showNotification("Error", "Error al iniciar el juego local.", "error");
    setupContainer.innerHTML = wordleSetupHTML;
  }
}

window.focusGameInput = function () {
  const input = document.getElementById("wordle-native-input");
  if (input) input.focus();
};

function startGameUI(isRestoring = false) {
  wordleConfig.gameOver = false;

  if (!isRestoring) {
    wordleConfig.currentAttempt = 0;
    renderWordleBoard();
    setTimeout(() => updateCurrentRow(""), 100);
  }

  document.getElementById("wordle-setup").style.display = "none";
  const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  const btnPwr = document.getElementById("btn-pwr-wordle");
  if (btnPwr) {
    btnPwr.style.display = inv["pista-wordle"] > 0 ? "flex" : "none";
  }
  const input = document.getElementById("wordle-native-input");
  input.type = "text";
  input.setAttribute("inputmode", "text");
  input.setAttribute("spellcheck", "false");
  input.value = "";

  setTimeout(() => input.focus(), 200);
  document.getElementById("wordle-board").onclick = () => input.focus();

  input.oninput = (e) => {
    if (wordleConfig.gameOver) return;

    let val = e.target.value.toUpperCase();

    val = val
      .replace(/[ÁÀÄÂ]/g, "A")
      .replace(/[ÉÈËÊ]/g, "E")
      .replace(/[ÍÌÏÎ]/g, "I")
      .replace(/[ÓÒÖÔ]/g, "O")
      .replace(/[ÚÙÜÛ]/g, "U");
    val = val.replace(/[^A-ZÑ]/g, "");

    if (val.length > wordleConfig.len) val = val.substring(0, wordleConfig.len);

    updateCurrentRow(val);
    input.value = val;
  };

  input.onkeydown = async (e) => {
    if (e.key === "Enter") {
      const guess = input.value;
      if (guess.length === wordleConfig.len) {
        validateAndSubmitGuess(guess);
      } else {
        showNotification("Aviso", "Palabra incompleta", "info");
        const board = document.getElementById("wordle-board");
        board.classList.add("shake");
        setTimeout(() => board.classList.remove("shake"), 500);
      }
    }
  };
}

window.useWordlePowerup = function () {
  if (wordleConfig.gameOver) return;
  if (useInventoryItem("pista-wordle")) {
    const letters = wordleConfig.originalTarget.split("");
    const randomChar = letters[Math.floor(Math.random() * letters.length)];
    showNotification("Pista", `La palabra contiene la letra: ${randomChar}`, "info");

    updatePowerUpButton("btn-pwr-wordle", "pista-wordle");
  }
};

function updateCurrentRow(text) {
  const start = wordleConfig.currentAttempt * wordleConfig.len;

  for (let i = 0; i < wordleConfig.len; i++) {
    const tile = document.getElementById(`tile-${start + i}`);
    if (tile) {
      tile.classList.remove("active");
      tile.innerText = text[i] || "";
      tile.classList.toggle("pop", !!text[i]);
    }
  }

  if (!wordleConfig.gameOver) {
    let nextIndex = text.length;

    if (nextIndex < wordleConfig.len) {
      const activeTile = document.getElementById(`tile-${start + nextIndex}`);
      if (activeTile) activeTile.classList.add("active");
    }
  }
}

function validateAndSubmitGuess(guess) {
  const normalizedGuess = guess
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, "A")
    .replace(/[ÉÈËÊ]/g, "E")
    .replace(/[ÍÌÏÎ]/g, "I")
    .replace(/[ÓÒÖÔ]/g, "O")
    .replace(/[ÚÙÜÛ]/g, "U");

  if (
    wordleDictionary &&
    wordleDictionary[wordleConfig.len].valid.has(normalizedGuess)
  ) {
    processGuess(guess);
  } else {
    handleInvalidWord();
  }
}

function handleInvalidWord() {
  const board = document.getElementById("wordle-board");
  board.classList.add("shake");
  setTimeout(() => board.classList.remove("shake"), 500);
  showNotification(
    "No válida",
    "La palabra no está en el diccionario",
    "error",
  );
  const input = document.getElementById("wordle-native-input");
  if (input) input.focus();
}

function processGuess(guess) {
  const start = wordleConfig.currentAttempt * wordleConfig.len;
  const target = wordleConfig.target;
  let correctCount = 0;

  const letterCounts = {};
  for (const char of target) {
    letterCounts[char] = (letterCounts[char] || 0) + 1;
  }

  const colors = new Array(wordleConfig.len).fill(null);

  for (let i = 0; i < wordleConfig.len; i++) {
    const letter = guess[i];
    if (target[i] === letter) {
      colors[i] = "correct";
      correctCount++;
      letterCounts[letter]--;
    }
  }

  for (let i = 0; i < wordleConfig.len; i++) {
    if (colors[i] === "correct") continue;

    const letter = guess[i];

    if (letterCounts[letter] && letterCounts[letter] > 0) {
      colors[i] = "present";
      letterCounts[letter]--;
    } else {
      colors[i] = "absent";
    }
  }

  for (let i = 0; i < wordleConfig.len; i++) {
    const tile = document.getElementById(`tile-${start + i}`);
    if (tile) {
      tile.classList.add(colors[i]);
    }
  }

  if (correctCount === wordleConfig.len) {
    wordleConfig.gameOver = true;
    saveWordleState();
    endGame(true);
  } else if (wordleConfig.currentAttempt === wordleConfig.attempts - 1) {
    wordleConfig.gameOver = true;
    saveWordleState();
    endGame(false);
  } else {
    wordleConfig.currentAttempt++;
    const input = document.getElementById("wordle-native-input");
    if (input) input.value = "";
    saveWordleState();
  }
}

function renderWordleBoard() {
  const board = document.getElementById("wordle-board");
  board.style.gridTemplateColumns = `repeat(${wordleConfig.len}, 1fr)`;
  board.innerHTML = "";
  for (let i = 0; i < wordleConfig.attempts * wordleConfig.len; i++) {
    const cell = document.createElement("div");
    cell.className = "wordle-cell";
    cell.id = `tile-${i}`;
    board.appendChild(cell);
  }
}

function endGame(win) {
  wordleConfig.gameOver = true;
  let stats = JSON.parse(
    localStorage.getItem("granaGo_wordle_stats") || '{"daily":0, "infinite":0}',
  );

  if (win) {
    updateAchievement('wordle_win', 1);
    const start = wordleConfig.currentAttempt * wordleConfig.len;
    for (let i = 0; i < wordleConfig.len; i++) {
      setTimeout(() => {
        const tile = document.getElementById(`tile-${start + i}`);
        if (tile) tile.classList.add("winner");
      }, i * 100);
    }

    if (wordleConfig.mode === "daily") stats.daily++;
    else stats.infinite++;
    const reward = wordleConfig.mode === "daily" ? 100 : 20;
    addGranaSaldo(reward, "palabra encontrada");

    showNotification("¡Conseguido!", "Palabra encontrada", "success");
  } else {
    document.getElementById("wordle-board").classList.add("shake");
    if (wordleConfig.mode === "infinite") stats.infinite = 0;
    showNotification("Fin del juego", "No has dado con la palabra", "error");
  }

  if (wordleConfig.mode === "daily") {
    localStorage.setItem(
      `wordle_last_daily_${wordleConfig.len}`,
      new Date().toDateString(),
    );
    localStorage.removeItem(`wordle_session_daily_${wordleConfig.len}`);
  }

  localStorage.setItem("granaGo_wordle_stats", JSON.stringify(stats));
  updateWordleStatsDisplay();

  setTimeout(() => showWordleResult(win), 1500);
}

function showWordleResult(win) {
  const setup = document.getElementById("wordle-setup");
  setup.style.display = "block";

  let shareButtonHTML = "";
  if (wordleConfig.mode === "daily") {
    shareButtonHTML = `
      <button class="cookie-btn primary" onclick="shareWordleResult(${win})" style="width:100%; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:8px;">
        <i class="ri-share-line"></i> Compartir resultado
      </button>`;
  }

  const buttonHTML =
    wordleConfig.mode === "infinite"
      ? `<button class="cookie-btn primary" onclick="startWordleGame()">Jugar otra vez</button>`
      : `${shareButtonHTML}
       <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:10px;">Reto diario completado. ¡Vuelve mañana!</p>
       <button class="cookie-btn secondary" onclick="closeWordle()">Volver a Juegos</button>`;

  setup.innerHTML = `
        <div class="info-card" style="border-left: 4px solid ${win ? "var(--color-success)" : "var(--color-error)"
    }">
            <h3 class="info-title" style="margin-top:0">${win ? "¡Victoria!" : "Fin del juego"
    }</h3>
            <p style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 5px;">
                ${wordleConfig.originalTarget}
            </p>
            ${buttonHTML}
        </div>
    `;
}

function saveWordleState() {
  if (wordleConfig.mode !== "daily") return;
  const state = {
    target: wordleConfig.target,
    originalTarget: wordleConfig.originalTarget,
    currentAttempt: wordleConfig.currentAttempt,
    gameOver: wordleConfig.gameOver,
    date: new Date().toDateString(),
    board: Array.from(document.querySelectorAll(".wordle-cell")).map((c) => ({
      text: c.innerText,
      classes: Array.from(c.classList),
    })),
  };
  localStorage.setItem(
    `wordle_session_daily_${wordleConfig.len}`,
    JSON.stringify(state),
  );
}

function loadWordleState() {
  const saved = localStorage.getItem(
    `wordle_session_daily_${wordleConfig.len}`,
  );
  if (!saved) return null;
  const state = JSON.parse(saved);
  if (state.date !== new Date().toDateString()) {
    localStorage.removeItem(`wordle_session_daily_${wordleConfig.len}`);
    return null;
  }
  return state;
}

window.shareWordleResult = function (win) {
  const attempts = win ? wordleConfig.currentAttempt + 1 : "X";
  let grid = "";

  const rowsPlayed = win
    ? wordleConfig.currentAttempt + 1
    : wordleConfig.attempts;

  for (let r = 0; r < rowsPlayed; r++) {
    for (let c = 0; c < wordleConfig.len; c++) {
      const tile = document.getElementById(`tile-${r * wordleConfig.len + c}`);
      if (tile) {
        if (tile.classList.contains("correct")) grid += "🟩";
        else if (tile.classList.contains("present")) grid += "🟨";
        else grid += "⬜";
      }
    }
    grid += "\n";
  }

  const shareText = `Granádle (${wordleConfig.len} letras) ${attempts}/${wordleConfig.attempts}\n\n${grid}\nJuega en: https://granago.github.io\n#GranáGo`;

  if (navigator.share) {
    navigator
      .share({
        title: "Mi resultado en Granádle",
        text: shareText,
      })
      .catch(() => {
        copyToClipboard(shareText);
      });
  } else {
    copyToClipboard(shareText);
  }
};

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification(
        "¡Copiado!",
        "Resultado copiado al portapapeles",
        "success",
      );
    })
    .catch(() => {
      showNotification("Error", "No se pudo copiar el resultado", "error");
    });
}

let sudokuConfig = {
  mode: "daily",
  difficulty: "medium",
  selectedCell: null,
  board: [],
  solution: [],
  fixed: [],
  mistakes: 0,
  maxMistakes: 5,
  timer: 0,
  timerInterval: null,
  gameOver: false,
};

const SudokuGen = {
  isValid: (board, row, col, num) => {
    for (let i = 0; i < 9; i++) {
      if (board[row * 9 + i] === num) return false;
      if (board[i * 9 + col] === num) return false;
      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + (i % 3);
      if (board[boxRow * 9 + boxCol] === num) return false;
    }
    return true;
  },

  solve: (board) => {
    for (let i = 0; i < 81; i++) {
      if (board[i] === 0) {
        for (let num = 1; num <= 9; num++) {
          const row = Math.floor(i / 9);
          const col = i % 9;
          if (SudokuGen.isValid(board, row, col, num)) {
            board[i] = num;
            if (SudokuGen.solve(board)) return true;
            board[i] = 0;
          }
        }
        return false;
      }
    }
    return true;
  },

  generate: (seed = null, difficulty = "medium") => {
    let board = new Array(81).fill(0);

    const random = seed ? mulberry32(seed) : Math.random;

    for (let i = 0; i < 9; i += 3) {
      let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let j = nums.length - 1; j > 0; j--) {
        const k = Math.floor(random() * (j + 1));
        [nums[j], nums[k]] = [nums[k], nums[j]];
      }
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          board[(i + r) * 9 + (i + c)] = nums[r * 3 + c];
        }
      }
    }

    SudokuGen.solve(board);
    const solution = [...board];

    let attempts =
      difficulty === "easy" ? 30 : difficulty === "medium" ? 45 : 55;
    if (seed) attempts = 45;

    while (attempts > 0) {
      let idx = Math.floor(random() * 81);
      while (board[idx] === 0) idx = Math.floor(random() * 81);
      board[idx] = 0;
      attempts--;
    }

    return { board, solution };
  },
};

function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

window.openSudokuMenu = function () {
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("sudoku-game-container").style.display = "block";
  trackRecentItem("granaGo_recent_games", "Granádoku");
  document.getElementById("sudoku-setup").style.display = "block";
  document.getElementById("sudoku-board-wrapper").style.display = "none";
  document.getElementById("sudoku-message").style.display = "none";

  setSudokuMode("daily");
  setupSudokuInputListeners();
};

window.closeSudoku = function () {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("sudoku-game-container").style.display = "none";

  const input = document.getElementById("sudoku-hidden-input");
  if (input) input.blur();

  if (sudokuConfig.timerInterval) clearInterval(sudokuConfig.timerInterval);
};

window.setSudokuMode = function (mode) {
  sudokuConfig.mode = mode;
  document
    .getElementById("btn-sudoku-daily")
    .classList.toggle("active", mode === "daily");
  document
    .getElementById("btn-sudoku-infinite")
    .classList.toggle("active", mode === "infinite");

  const diffSelector = document.getElementById("sudoku-diff-selector");
  if (diffSelector) {
    diffSelector.style.display = mode === "infinite" ? "block" : "none";
  }
};

window.setSudokuDiff = function (diff, btn) {
  sudokuConfig.difficulty = diff;
  const btns = document.querySelectorAll("#sudoku-diff-selector .tab-pill");
  btns.forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
};

window.startSudokuGame = function () {
  const todayStr = new Date().toDateString();

  if (sudokuConfig.mode === "daily") {
    const lastPlay = localStorage.getItem("sudoku_last_daily_date");
    const lastStatus = localStorage.getItem("sudoku_last_daily_status");

    if (
      lastPlay === todayStr &&
      (lastStatus === "completed" || lastStatus === "failed")
    ) {
      showNotification(
        "Ya jugado",
        "Vuelve mañana para el próximo reto.",
        "info",
      );
      return;
    }

    const savedSession = JSON.parse(
      localStorage.getItem("sudoku_daily_session"),
    );
    if (savedSession && savedSession.date === todayStr) {
      loadSudokuState(savedSession);
    } else {
      const seed = parseInt(todayStr.replace(/\D/g, "")) || Date.now();
      const gameData = SudokuGen.generate(seed);
      initSudokuState(gameData.board, gameData.solution);
    }
  } else {
    const gameData = SudokuGen.generate(null, sudokuConfig.difficulty);
    initSudokuState(gameData.board, gameData.solution);
  }

  document.getElementById("sudoku-setup").style.display = "none";
  document.getElementById("sudoku-board-wrapper").style.display = "block";

  const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  const btnPwr = document.getElementById("btn-pwr-sudoku");
  if (btnPwr) {
    btnPwr.style.display = inv["celda-sudoku"] > 0 ? "flex" : "none";
  }

  renderSudokuBoard();
  startSudokuTimer();
};

function initSudokuState(board, solution) {
  sudokuConfig.board = [...board];
  sudokuConfig.fixed = board.map((n) => n !== 0);
  sudokuConfig.solution = solution;
  sudokuConfig.mistakes = 0;
  sudokuConfig.timer = 0;
  sudokuConfig.gameOver = false;
  sudokuConfig.selectedCell = null;
  updateSudokuStats();
}

function loadSudokuState(session) {
  sudokuConfig.board = session.board;
  sudokuConfig.fixed = session.fixed;
  sudokuConfig.solution = session.solution;
  sudokuConfig.mistakes = session.mistakes;
  sudokuConfig.timer = session.timer;
  sudokuConfig.gameOver = false;
  updateSudokuStats();
}

function renderSudokuBoard() {
  const boardEl = document.getElementById("sudoku-board");
  boardEl.innerHTML = "";

  for (let i = 0; i < 81; i++) {
    const cell = document.createElement("div");
    cell.className = "sudoku-cell";
    cell.id = `sudoku-cell-${i}`;

    if (sudokuConfig.fixed[i]) {
      cell.classList.add("fixed");
      cell.innerText = sudokuConfig.board[i];
    } else if (sudokuConfig.board[i] !== 0) {
      cell.innerText = sudokuConfig.board[i];
      if (sudokuConfig.board[i] !== sudokuConfig.solution[i]) {
        cell.classList.add("error");
      }
    }

    cell.onclick = () => selectSudokuCell(i);
    boardEl.appendChild(cell);
  }
}

window.useSudokuPowerup = function () {
  if (sudokuConfig.gameOver || sudokuConfig.selectedCell === null) {
    showNotification("Aviso", "Selecciona primero una casilla vacía", "info");
    return;
  }

  const idx = sudokuConfig.selectedCell;
  if (sudokuConfig.fixed[idx] || sudokuConfig.board[idx] === sudokuConfig.solution[idx]) return;

  if (useInventoryItem("celda-sudoku")) {
    const correctNum = sudokuConfig.solution[idx];
    handleSudokuLogic(correctNum);

    updatePowerUpButton("btn-pwr-sudoku", "celda-sudoku");
    showNotification("Saber-doku", "Celda resuelta", "success");
  }
};

let sudokuInputInitialized = false;

function setupSudokuInputListeners() {
  if (sudokuInputInitialized) return;

  const input = document.getElementById("sudoku-hidden-input");
  if (!input) return;

  input.addEventListener("input", (e) => {
    if (sudokuConfig.gameOver || sudokuConfig.selectedCell === null) {
      input.value = "";
      return;
    }

    const val = e.target.value;
    const lastChar = val.slice(-1);

    if (/[1-9]/.test(lastChar)) {
      handleSudokuLogic(parseInt(lastChar));
    }

    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (sudokuConfig.gameOver || sudokuConfig.selectedCell === null) return;

    if (e.key === "Backspace" || e.key === "Delete") {
      handleSudokuLogic("erase");
    }
  });

  sudokuInputInitialized = true;
}

function selectSudokuCell(index) {
  if (sudokuConfig.gameOver) return;

  document.querySelectorAll(".sudoku-cell").forEach((c) => {
    c.classList.remove("selected", "highlighted", "same-number");
  });

  sudokuConfig.selectedCell = index;
  const cellEl = document.getElementById(`sudoku-cell-${index}`);
  cellEl.classList.add("selected");

  const hiddenInput = document.getElementById("sudoku-hidden-input");
  if (hiddenInput) {
    hiddenInput.focus({ preventScroll: true });
  }

  const row = Math.floor(index / 9);
  const col = index % 9;
  const val = sudokuConfig.board[index];

  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const el = document.getElementById(`sudoku-cell-${i}`);

    if (r === row || c === col) el.classList.add("highlighted");
    if (val !== 0 && sudokuConfig.board[i] === val)
      el.classList.add("same-number");
  }
}

function handleSudokuLogic(input) {
  const idx = sudokuConfig.selectedCell;
  const cellEl = document.getElementById(`sudoku-cell-${idx}`);

  if (sudokuConfig.fixed[idx]) return;

  if (input === "erase") {
    sudokuConfig.board[idx] = 0;
    cellEl.innerText = "";
    cellEl.classList.remove("error");
    selectSudokuCell(idx);
    saveSudokuProgress();
    return;
  }

  const num = parseInt(input);

  if (num !== sudokuConfig.solution[idx]) {
    sudokuConfig.mistakes++;
    updateSudokuStats();
    cellEl.innerText = num;
    cellEl.classList.add("error");

    const boardEl = document.getElementById("sudoku-board");
    boardEl.classList.add("shake");
    setTimeout(() => boardEl.classList.remove("shake"), 500);

    if (sudokuConfig.mistakes >= sudokuConfig.maxMistakes) {
      endSudokuGame(false);
    }
  } else {
    sudokuConfig.board[idx] = num;
    cellEl.innerText = num;
    cellEl.classList.remove("error");
    if (!sudokuConfig.board.includes(0)) {
      endSudokuGame(true);
    }
  }

  selectSudokuCell(idx);
  saveSudokuProgress();
}

function updateSudokuStats() {
  const el = document.getElementById("sudoku-mistakes");
  if (el)
    el.innerText = `Errores: ${sudokuConfig.mistakes}/${sudokuConfig.maxMistakes}`;
}

function startSudokuTimer() {
  if (sudokuConfig.timerInterval) clearInterval(sudokuConfig.timerInterval);
  sudokuConfig.timerInterval = setInterval(() => {
    sudokuConfig.timer++;
    const m = Math.floor(sudokuConfig.timer / 60)
      .toString()
      .padStart(2, "0");
    const s = (sudokuConfig.timer % 60).toString().padStart(2, "0");
    const el = document.getElementById("sudoku-timer");
    if (el) el.innerText = `${m}:${s}`;
    if (sudokuConfig.timer % 5 === 0) saveSudokuProgress();
  }, 1000);
}

function saveSudokuProgress() {
  if (sudokuConfig.mode !== "daily" || sudokuConfig.gameOver) return;

  const state = {
    date: new Date().toDateString(),
    board: sudokuConfig.board,
    fixed: sudokuConfig.fixed,
    solution: sudokuConfig.solution,
    mistakes: sudokuConfig.mistakes,
    timer: sudokuConfig.timer,
  };
  localStorage.setItem("sudoku_daily_session", JSON.stringify(state));
}

function endSudokuGame(win) {
  sudokuConfig.gameOver = true;
  clearInterval(sudokuConfig.timerInterval);

  const input = document.getElementById("sudoku-hidden-input");
  if (input) input.blur();

  const wrapper = document.getElementById("sudoku-board-wrapper");
  const message = document.getElementById("sudoku-message");

  if (win) {
    updateAchievement('sudoku_master', 1);
    showNotification("¡Excelente!", "Has completado el Sudoku", "success");
    if (sudokuConfig.mode === "daily") {
      localStorage.setItem("sudoku_last_daily_status", "completed");
      localStorage.setItem("sudoku_last_daily_date", new Date().toDateString());
      localStorage.removeItem("sudoku_daily_session");
    }

    setTimeout(() => {
      wrapper.style.display = "none";
      message.style.display = "block";
      message.style.borderLeftColor = "var(--color-success)";
      message.querySelector("h3").innerText = "¡Victoria!";
      message.querySelector("p").innerText = `Tiempo: ${document.getElementById("sudoku-timer").innerText
        }`;
    }, 1000);

    const reward = sudokuConfig.mode === "daily" ? 150 : 30;
    addGranaSaldo(reward, "completar Sudoku");
  } else {
    showNotification("Fin del juego", "Demasiados errores", "error");

    if (sudokuConfig.mode === "daily") {
      localStorage.setItem("sudoku_last_daily_status", "failed");
      localStorage.setItem("sudoku_last_daily_date", new Date().toDateString());
      localStorage.removeItem("sudoku_daily_session");
    }

    setTimeout(() => {
      wrapper.style.display = "none";
      message.style.display = "block";
      message.style.borderLeftColor = "var(--color-error)";
      message.querySelector("h3").innerText = "Fin del Juego";
      message.querySelector("p").innerText =
        "Has alcanzado el límite de errores. Vuelve mañana.";
    }, 1000);
  }
}

if (window.visualViewport) {
  const initialHeight = window.visualViewport.height;

  window.visualViewport.addEventListener("resize", () => {
    const currentHeight = window.visualViewport.height;

    if (currentHeight < initialHeight * 0.85) {
      document.body.classList.add("keyboard-open");

      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.id === "wordle-native-input" ||
          activeElement.id === "sudoku-hidden-input" ||
          activeElement.id === "encadenadas-input")
      ) {
        const boardId =
          activeElement.id === "wordle-native-input"
            ? "wordle-board"
            : activeElement.id === "sudoku-hidden-input"
              ? "sudoku-board"
              : "last-word-display";

        const board = document.getElementById(boardId);
        if (board)
          board.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    } else {
      document.body.classList.remove("keyboard-open");
    }
  });
}

let memoryConfig = {
  hasFlippedCard: false,
  lockBoard: false,
  firstCard: null,
  secondCard: null,
  moves: 0,
  pairsFound: 0,
  totalPairs: 8,
};

const memoryIcons = [
  "ri-bus-fill",
  "ri-train-fill",
  "ri-parking-box-fill",
  "ri-gas-station-fill",
  "ri-camera-lens-fill",
  "ri-roadster-fill",
  "ri-motorbike-fill",
  "ri-map-pin-user-fill",
];

function openMemoryMenu() {
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("memory-game-container").style.display = "block";
  trackRecentItem("granaGo_recent_games", "Granámory");
  initMemoryGame();
}

function closeMemory() {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("memory-game-container").style.display = "none";
}

function initMemoryGame() {
  const board = document.getElementById("memory-board");
  const msg = document.getElementById("memory-message");

  board.innerHTML = "";
  msg.style.display = "none";

  const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  const btnPwr = document.getElementById("btn-pwr-memory");
  if (btnPwr) {
    btnPwr.style.display = inv["ojo-memory"] > 0 ? "flex" : "none";
  }

  memoryConfig.moves = 0;
  memoryConfig.pairsFound = 0;
  memoryConfig.hasFlippedCard = false;
  memoryConfig.lockBoard = false;
  memoryConfig.firstCard = null;
  memoryConfig.secondCard = null;

  updateMemoryStats();

  const deck = [...memoryIcons, ...memoryIcons];
  deck.sort(() => 0.5 - Math.random());

  deck.forEach((iconClass) => {
    const card = document.createElement("div");
    card.classList.add("memory-card");
    card.dataset.icon = iconClass;

    card.innerHTML = `
      <div class="memory-face memory-front">
        <i class="ri-question-mark"></i>
      </div>
      <div class="memory-face memory-back">
        <i class="${iconClass}"></i>
      </div>
    `;

    card.addEventListener("click", flipCard);
    board.appendChild(card);
  });
}

function flipCard() {
  if (memoryConfig.lockBoard) return;
  if (this === memoryConfig.firstCard) return;

  this.classList.add("flip");

  if (!memoryConfig.hasFlippedCard) {
    memoryConfig.hasFlippedCard = true;
    memoryConfig.firstCard = this;
    return;
  }

  memoryConfig.secondCard = this;
  memoryConfig.moves++;
  updateMemoryStats();
  checkForMatch();
}

function checkForMatch() {
  let isMatch =
    memoryConfig.firstCard.dataset.icon ===
    memoryConfig.secondCard.dataset.icon;

  if (isMatch) {
    disableCards();
  } else {
    unflipCards();
  }
}

function disableCards() {
  memoryConfig.firstCard.classList.add("matched");
  memoryConfig.secondCard.classList.add("matched");
  memoryConfig.firstCard.removeEventListener("click", flipCard);
  memoryConfig.secondCard.removeEventListener("click", flipCard);

  memoryConfig.pairsFound++;
  resetBoard();

  if (memoryConfig.pairsFound === memoryConfig.totalPairs) {
    updateAchievement('memory_fast', 1);
    setTimeout(() => {
      document.getElementById("memory-message").style.display = "block";
      showNotification("¡Genial!", "Has completado el Memory", "success");
    }, 500);
    addGranaSaldo(25, "completar el Memory");
  }
}

function unflipCards() {
  memoryConfig.lockBoard = true;

  setTimeout(() => {
    memoryConfig.firstCard.classList.remove("flip");
    memoryConfig.secondCard.classList.remove("flip");
    resetBoard();
  }, 1000);
}

function resetBoard() {
  [memoryConfig.hasFlippedCard, memoryConfig.lockBoard] = [false, false];
  [memoryConfig.firstCard, memoryConfig.secondCard] = [null, null];
}

function updateMemoryStats() {
  const el = document.getElementById("memory-stats-text");
  if (el) el.innerText = `Movimientos: ${memoryConfig.moves}`;
}

window.useMemoryPowerup = function () {
  if (memoryConfig.lockBoard || memoryConfig.pairsFound === memoryConfig.totalPairs) return;

  if (useInventoryItem("ojo-memory")) {
    memoryConfig.lockBoard = true;
    const allCards = document.querySelectorAll(".memory-card:not(.matched)");
    allCards.forEach((c) => c.classList.add("flip"));

    setTimeout(() => {
      allCards.forEach((c) => {
        if (c !== memoryConfig.firstCard) c.classList.remove("flip");
      });
      memoryConfig.lockBoard = false;

      updatePowerUpButton("btn-pwr-memory", "ojo-memory");
    }, 2000);

    showNotification("Power-up", "Visualizando tablero...", "info");
  }
};

let quizConfig = {
  allQuestions: [],
  roundQuestions: [],
  currentIdx: 0,
  score: 0,
  isAnswered: false,
  questionsPerRound: 10,
};

async function openQuizMenu() {
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("quiz-game-container").style.display = "block";
  trackRecentItem("granaGo_recent_games", "Granáquiz");
  if (quizConfig.allQuestions.length === 0) {
    const setup = document.getElementById("quiz-setup");
    const game = document.getElementById("quiz-gameplay");

    setup.style.display = "block";
    game.style.display = "none";

    try {
      const response = await fetch("data/trivial.json");
      if (!response.ok) throw new Error("Error cargando preguntas");

      quizConfig.allQuestions = await response.json();
      setup.style.display = "none";
      game.style.display = "block";
      startQuizGame();
    } catch (e) {
      console.error(e);
      setup.innerHTML = `<p style="color:var(--color-error)">Error al cargar las preguntas.<br>Inténtalo más tarde.</p>`;
    }
  } else {
    startQuizGame();
  }
}

function closeQuiz() {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("quiz-game-container").style.display = "none";
}

function startQuizGame() {
  quizConfig.currentIdx = 0;
  quizConfig.score = 0;
  quizConfig.isAnswered = false;
  quizConfig.roundQuestions = [...quizConfig.allQuestions]
    .sort(() => 0.5 - Math.random())
    .slice(0, quizConfig.questionsPerRound);

  document.getElementById("quiz-question-box").style.display = "block";
  document.getElementById("quiz-result-msg").style.display = "none";

  updateQuizStats();
  showQuestion();
}

function showQuestion() {
  const qData = quizConfig.roundQuestions[quizConfig.currentIdx];
  const qEl = document.getElementById("quiz-question");
  const optsEl = document.getElementById("quiz-options");
  const counterEl = document.getElementById("quiz-counter");
  const progressEl = document.getElementById("quiz-progress-bar");
  const container = document.getElementById("quiz-question-box");
  container.classList.remove("fade-in-right");
  void container.offsetWidth;
  container.classList.add("fade-in-right");
  const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  const btnPwr = document.getElementById("btn-pwr-quiz");
  if (btnPwr) {
    btnPwr.style.display =
      inv["mitad-quiz"] > 0 && !quizConfig.isAnswered ? "block" : "none";
  }
  counterEl.innerText = `PREGUNTA ${quizConfig.currentIdx + 1} / ${quizConfig.questionsPerRound
    }`;
  qEl.innerText = qData.pregunta;
  optsEl.innerHTML = "";
  quizConfig.isAnswered = false;
  const progressPct =
    (quizConfig.currentIdx / quizConfig.questionsPerRound) * 100;
  progressEl.style.width = `${progressPct}%`;
  const shuffledOptions = [...qData.opciones].sort(() => 0.5 - Math.random());

  shuffledOptions.forEach((optText) => {
    const btn = document.createElement("button");
    btn.className = "quiz-btn";
    btn.innerHTML = `<span>${optText}</span> <i class="icon ri-checkbox-blank-circle-line"></i>`;
    btn.onclick = () =>
      handleQuizAnswer(optText, qData.respuesta_correcta, btn);
    optsEl.appendChild(btn);
  });
}

function handleQuizAnswer(selectedText, correctText, btnElement) {
  if (quizConfig.isAnswered) return;
  quizConfig.isAnswered = true;

  const allBtns = document.querySelectorAll(".quiz-btn");

  allBtns.forEach((btn) => {
    const spanText = btn.querySelector("span").innerText;
    if (spanText === correctText) {
      btn.classList.add("correct");
      btn.querySelector("i").className = "icon ri-checkbox-circle-fill";
    }
  });

  if (selectedText === correctText) {
    quizConfig.score++;
    if (navigator.vibrate) navigator.vibrate(50);
  } else {
    btnElement.classList.add("wrong");
    btnElement.querySelector("i").className = "icon ri-close-circle-fill";
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }

  updateQuizStats();

  setTimeout(() => {
    quizConfig.currentIdx++;
    if (quizConfig.currentIdx < quizConfig.questionsPerRound) {
      showQuestion();
    } else {
      finishQuizGame();
    }
  }, 1500);
}

window.useQuizPowerup = function () {
  if (quizConfig.isAnswered) return;

  if (useInventoryItem("mitad-quiz")) {
    const qData = quizConfig.roundQuestions[quizConfig.currentIdx];
    const btns = Array.from(document.querySelectorAll(".quiz-btn"));
    const incorrectBtns = btns.filter((btn) => {
      const btnText = btn.querySelector("span").innerText.trim();
      return btnText !== qData.respuesta_correcta && btn.style.opacity !== "0.2";
    });

    incorrectBtns.sort(() => 0.5 - Math.random());

    for (let i = 0; i < 2; i++) {
      if (incorrectBtns[i]) {
        incorrectBtns[i].style.opacity = "0.2";
        incorrectBtns[i].style.pointerEvents = "none";
        incorrectBtns[i].querySelector("i").className = "icon ri-close-circle-line";
      }
    }

    updatePowerUpButton("btn-pwr-quiz", "mitad-quiz");
    showNotification("Power-up", "Opciones incorrectas eliminadas", "info");
  }
};

function finishQuizGame() {
  document.getElementById("quiz-question-box").style.display = "none";
  document.getElementById("quiz-progress-bar").style.width = "100%";

  const resBox = document.getElementById("quiz-result-msg");
  resBox.style.display = "block";
  resBox.className = "fade-in-up";

  const score = quizConfig.score;
  const total = quizConfig.questionsPerRound;
  const title = document.getElementById("quiz-title-result");
  const text = document.getElementById("quiz-text-result");
  const icon = document.getElementById("quiz-icon-result");

  text.innerText = `Has acertado ${score} de ${total}`;

  if (score === total) {
    updateAchievement('quiz_perfect', 1);
    title.innerText = "¡Matrícula de Honor!";
    title.style.color = "var(--color-success)";
    icon.className = "icon ri-trophy-fill";
    icon.style.color = "#fbbf24";
    showNotification("¡Increíble!", "Eres un experto en Granada", "success");
  } else if (score >= total * 0.7) {
    title.innerText = "¡Muy Bien!";
    title.style.color = "var(--text-primary)";
    icon.className = "icon ri-thumb-up-fill";
    icon.style.color = "var(--color-primary)";
  } else if (score >= total * 0.5) {
    title.innerText = "Aprobado";
    title.style.color = "var(--text-secondary)";
    icon.className = "icon ri-emotion-normal-line";
    icon.style.color = "var(--color-warning)";
  } else {
    title.innerText = "¡Ay, esa malafollá!";
    title.style.color = "var(--color-error)";
    icon.className = "icon ri-emotion-sad-line";
    icon.style.color = "var(--color-error)";
  }

  if (score > 0) {
    addGranaSaldo(score * 5, "aciertos en el Quiz");
  }
}

function updateQuizStats() {
  document.getElementById("quiz-stats-text").innerText =
    `Puntos: ${quizConfig.score}`;
}

const VOICE_CONFIG = {
  es: {
    code: "es-ES",
    labels: {
      active: "Modo conducción activado",
      attention: "Atención",
      road: "en carretera",
      fixed: "Radar Fijo",
      mobile: "Radar Móvil",
      section: "Radar de Tramo",
    },
  },
  en: {
    code: "en-US",
    labels: {
      active: "Driving mode activated",
      attention: "Warning",
      road: "on road",
      fixed: "Speed Camera",
      mobile: "Mobile Radar",
      section: "Section Control",
    },
  },
  fr: {
    code: "fr-FR",
    labels: {
      active: "Mode conduite activé",
      attention: "Attention",
      road: "sur la route",
      fixed: "Radar Fixe",
      mobile: "Radar Mobile",
      section: "Radar Tronçon",
    },
  },
  it: {
    code: "it-IT",
    labels: {
      active: "Modalità guida attivata",
      attention: "Attenzione",
      road: "sulla strada",
      fixed: "Autovelox Fisso",
      mobile: "Autovelox Mobile",
      section: "Tutor",
    },
  },
};

const ESP_FALLBACK_LIMITS = {
  motorway: "120",
  trunk: "100",
  primary: "90",
  secondary: "90",
  tertiary: "90",
  unclassified: "90",
  residential: "30",
  living_street: "20",
  motorway_link: "60",
  trunk_link: "60",
  primary_link: "40",
  secondary_link: "40",
  tertiary_link: "40",
};

async function loadSpeedLimits() {
  if (speedLimitsData) return;
  try {
    const res = await fetch("data/velocidad.json");
    speedLimitsData = await res.json();
  } catch (e) {
    console.error("Error cargando límites de velocidad:", e);
  }
}

function getVoiceSettings() {
  const lang = localStorage.getItem("granaGo_selected_lang") || "es";
  return VOICE_CONFIG[lang] || VOICE_CONFIG["es"];
}

function getDistanceToSegment(lat, lon, latA, lonA, latB, lonB) {
  const R = 6371;
  const x = (lon - lonA) * Math.cos((((latA + lat) / 2) * Math.PI) / 180);
  const y = lat - latA;
  const dx = (lonB - lonA) * Math.cos((((latA + latB) / 2) * Math.PI) / 180);
  const dy = latB - latA;

  let t = (x * dx + y * dy) / (dx * dx + dy * dy);

  t = Math.max(0, Math.min(1, t));

  const closestLat = latA + t * dy;
  const closestLon =
    lonA + (t * dx) / Math.cos((((latA + closestLat) / 2) * Math.PI) / 180);
  return getDistanceFromLatLonInKm(lat, lon, closestLat, closestLon);
}

function getBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

function isAngleSimilar(angle1, angle2) {
  if (angle1 === null || angle2 === null || isNaN(angle1)) return true;

  const diff = Math.abs(angle1 - angle2) % 360;
  const diff2 = Math.abs(diff - 360);
  const minDiff = Math.min(diff, diff2);
  return minDiff < 40 || Math.abs(minDiff - 180) < 40;
}

function animateSpeedLoop() {
  if (!drivingModeActive) return;

  const diff = targetSpeed - currentDisplayedSpeed;

  if (Math.abs(diff) > 0.1) {
    currentDisplayedSpeed += diff * 0.1;
  } else {
    currentDisplayedSpeed = targetSpeed;
  }

  const hudSpeed = document.getElementById("hud-speed");
  if (hudSpeed) {
    const val = Math.round(currentDisplayedSpeed);
    hudSpeed.innerHTML = `${val} <span style="font-size: 1.5rem; font-weight: 400; color: #aaa;">km/h</span>`;
  }

  speedAnimationId = requestAnimationFrame(animateSpeedLoop);
}

async function loadZBEDataForHUD() {
  if (zbePolygon) return;
  try {
    const response = await fetch("data/zbe.geojson");
    const data = await response.json();
    zbePolygon = data.features[0].geometry.coordinates[0];
  } catch (e) { console.error("Error ZBE GeoJSON", e); }
}

function isPointInZBE(lat, lng) {
  if (!zbePolygon) return false;
  let x = lat, y = lng;
  let inside = false;
  for (let i = 0, j = zbePolygon.length - 1; i < zbePolygon.length; j = i++) {
    let xi = zbePolygon[i][1], yi = zbePolygon[i][0];
    let xj = zbePolygon[j][1], yj = zbePolygon[j][0];
    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function checkZBEAlert(lat, lng) {
  const now = Date.now();
  if (now - lastZBEAlertTime < 120000) return;

  const isRestricted = !vehicleConfig.isResident && vehicleConfig.badge === "NONE";

  if (isRestricted && isPointInZBE(lat, lng)) {
    speak("Atención: Has accedido a la Zona de Bajas Emisiones con un vehículo restringido.");
    lastZBEAlertTime = now;

    const alertBox = document.getElementById("hud-alert");
    if (alertBox) {
      alertBox.innerHTML = `
                <i class="ri-leaf-fill" style="font-size: 4rem; color: #ef4444; animation: pulse 1s infinite;"></i>
                <div style="font-size: 1.5rem; font-weight:bold; margin-top: 10px; color:#ef4444">ALERTA ZBE</div>
                <div style="font-size: 1rem;">Acceso Restringido</div>
            `;
    }
  }
}

async function toggleDrivingMode() {
  const hud = document.getElementById("driving-hud");

  if (!drivingModeActive) {
    if (!document.getElementById('camaras-view').classList.contains('active')) {
      await navigateTo('camaras');
    }
    showNotification("Iniciando", "Cargando asistente de conducción...", "info");
    await Promise.all([loadSpeedLimits(), initCamarasMap(), loadZBEDataForHUD()]);
    updateAchievement('driver_mode', 1);
    if (RADIO_STATIONS.length === 0) {
      await cargarRadiosDesdeAPI();
    } else {
      renderRadioList();
      actualizarUIPlayer();
    }

    drivingModeActive = true;

    updateHudSystemInfo();
    hudUpdateInterval = setInterval(updateHudSystemInfo, 10000);

    document.body.classList.add("driving-mode-on");

    hud.style.display = "flex";

    const isPrefHorizontal = localStorage.getItem('granaGo_hud_horizontal') === 'true';

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        if (isPrefHorizontal && screen.orientation && screen.orientation.lock) {
          hud.classList.add('hud-horizontal');
          screen.orientation.lock('landscape').catch(() => { });
        }
      });
    }

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
    }

    currentDisplayedSpeed = 0;
    targetSpeed = 0;
    animateSpeedLoop();

    requestWakeLock();

    showNotification(
      "Modo Conducción",

      "GPS activo y pantalla bloqueada",

      "success",
    );

    watchId = navigator.geolocation.watchPosition(
      processDrivingPosition,
      handleDrivingError,
      { enableHighAccuracy: true, maximumAge: 0 },
    );

    const msgs = getVoiceSettings().labels;
    speak(msgs.active);
  } else {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }

    drivingModeActive = false;

    if (radioStartedFromHUD && radioIsPlaying) {
      const audio = document.getElementById('hud-audio-element');
      if (audio) {
        audio.pause();
        radioIsPlaying = false;
        actualizarUIPlayer();
      }
    }

    if (hudUpdateInterval) clearInterval(hudUpdateInterval);

    document.body.classList.remove("driving-mode-on");

    hud.style.display = "none";

    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch((e) => console.log(e));
    }

    if (speedAnimationId) cancelAnimationFrame(speedAnimationId);
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (wakeLock) wakeLock.release();

    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (camarasMapInstance) {
        camarasMapInstance.setView([lat, lng], 17);
        camarasMapInstance.invalidateSize();
        if (!userMarker) {
          const gpsIcon = L.divIcon({
            className: "gps-marker-container",
            html: `<div class="gps-dot-animated"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          userMarker = L.marker([lat, lng], { icon: gpsIcon }).addTo(
            camarasMapInstance,
          );
        } else {
          userMarker.setLatLng([lat, lng]).addTo(camarasMapInstance);
        }
      }
    });

    showNotification("Modo Conducción", "Finalizado", "info");
  }
}

function isTargetInFront(userHeading, bearingToTarget) {
  if (userHeading === null || isNaN(userHeading)) return true;
  let diff = Math.abs(userHeading - bearingToTarget) % 360;
  let normalizedDiff = diff > 180 ? 360 - diff : diff;
  return normalizedDiff < 90;
}

function processDrivingPosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const speed = position.coords.speed;
  const heading = position.coords.heading;
  targetSpeed = speed ? speed * 3.6 : 0;

  checkNearbyRadars(lat, lng, heading);
  checkCurrentSpeedLimit(lat, lng, heading);
  checkZBEAlert(lat, lng);
}

function checkNearbyRadars(userLat, userLng, userHeading) {
  if (!window.radaresData && !camarasClusterGroup) return;

  let closestRadar = null;
  let minRadarDist = Infinity;
  let closestCamera = null;
  let minCameraDist = Infinity;

  if (window.radaresData) {
    window.radaresData.features.forEach((radar) => {
      let dist = Infinity;
      let inFront = false;
      const geom = radar.geometry;

      if (geom.type === "Point") {
        const rLat = geom.coordinates[1];
        const rLng = geom.coordinates[0];
        dist = getDistanceFromLatLonInKm(userLat, userLng, rLat, rLng);
        const bearingToRadar = getBearing(userLat, userLng, rLat, rLng);
        inFront = isTargetInFront(userHeading, bearingToRadar);

        if (
          inFront &&
          radar.properties.bearing !== null &&
          userHeading !== null
        ) {
          let targetAngle = radar.properties.bearing;
          if (radar.properties.sentido === "Decreciente")
            targetAngle = (targetAngle + 180) % 360;
          if (
            radar.properties.sentido !== "Ambos" &&
            !isAngleSimilar(userHeading, targetAngle)
          ) {
            inFront = false;
          }
        }
      } else if (geom.type === "LineString") {
        const coords = geom.coordinates;
        for (let i = 0; i < coords.length - 1; i++) {
          const d = getDistanceToSegment(
            userLat,
            userLng,
            coords[i][1],
            coords[i][0],
            coords[i + 1][1],
            coords[i + 1][0],
          );
          if (d < dist) dist = d;
        }
        inFront = dist < ALERT_RADIUS;
      }

      if (inFront && dist < minRadarDist) {
        minRadarDist = dist;
        closestRadar = {
          data: radar.properties,
          type: radar.properties.type,
          isCamera: false,
        };
      }
    });
  }

  if (closestRadar === null && camarasClusterGroup) {
    camarasClusterGroup.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        const dist = getDistanceFromLatLonInKm(
          userLat,
          userLng,
          latlng.lat,
          latlng.lng,
        );
        const bearingToCam = getBearing(
          userLat,
          userLng,
          latlng.lat,
          latlng.lng,
        );
        const inFront = isTargetInFront(userHeading, bearingToCam);

        if (inFront && dist < minCameraDist) {
          minCameraDist = dist;
          const popupContent = layer.getPopup()
            ? layer.getPopup().getContent()
            : "";
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = popupContent;
          const name = tempDiv.querySelector("strong")
            ? tempDiv.querySelector("strong").innerText
            : "Cámara Tráfico";

          closestCamera = {
            data: { road: name, desc: "Cámara de vigilancia" },
            isCamera: true,
            type: "camera",
          };
        }
      }
    });
  }

  if (closestRadar) {
    updateHudAlert(closestRadar, minRadarDist);
  } else if (closestCamera) {
    updateHudAlert(closestCamera, minCameraDist);
  } else {
    updateHudAlert(null, Infinity);
  }
}

async function updateHudSystemInfo() {
  const clockEl = document.getElementById('hud-clock');
  const batteryLevelEl = document.getElementById('hud-battery-level');
  const batteryIconEl = document.getElementById('hud-battery-icon');

  if (!clockEl) return;

  const now = new Date();
  clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      const level = Math.round(battery.level * 100);
      batteryLevelEl.innerText = `${level}%`;

      if (battery.charging) {
        batteryIconEl.className = 'ri-battery-charge-fill';
        batteryIconEl.style.color = '#10b981';
      } else {
        batteryIconEl.style.color = 'white';
        if (level <= 20) batteryIconEl.className = 'ri-battery-low-fill';
        else if (level <= 60) batteryIconEl.className = 'ri-battery-2-fill';
        else batteryIconEl.className = 'ri-battery-fill';
      }
    } catch (e) {
      console.warn("No se pudo acceder a la batería");
    }
  }
}

function checkCurrentSpeedLimit(userLat, userLng, userHeading) {
  if (!speedLimitsData) return;

  let bestFeature = null;
  let minDistance = Infinity;

  const DETECTION_RADIUS = 0.035;
  const isStationary = !userHeading || isNaN(userHeading) || targetSpeed < 5;

  if (isStationary && currentStreetFeature) {
    let stillOnSameStreet = false;
    const coords = currentStreetFeature.geometry.coordinates;

    for (let i = 0; i < coords.length - 1; i++) {
      const d = getDistanceToSegment(userLat, userLng, coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
      if (d < 0.025) {
        stillOnSameStreet = true;
        break;
      }
    }

    if (stillOnSameStreet) {
      updateSpeedUI(currentStreetFeature);
      return;
    }
  }

  speedLimitsData.features.forEach((feature) => {
    if (!feature.geometry || !feature.geometry.coordinates) return;
    const coords = feature.geometry.coordinates;

    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const dist = getDistanceToSegment(userLat, userLng, p1[1], p1[0], p2[1], p2[0]);

      if (dist < DETECTION_RADIUS) {
        if (!isStationary) {
          const segmentBearing = getBearing(p1[1], p1[0], p2[1], p2[0]);
          const diff1 = Math.abs(userHeading - segmentBearing) % 360;
          const diff2 = Math.abs(userHeading - (segmentBearing + 180) % 360) % 360;
          const minDiff = Math.min(diff1 > 180 ? 360 - diff1 : diff1, diff2 > 180 ? 360 - diff2 : diff2);

          if (minDiff > 45) continue;
        }

        if (dist < minDistance) {
          minDistance = dist;
          bestFeature = feature;
        }
      }
    }
  });


  if (bestFeature) {
    currentStreetFeature = bestFeature;
  }

  updateSpeedUI(bestFeature);
}

function updateSpeedUI(feature) {
  const container = document.getElementById("hud-speed-limit");
  if (!feature) {
    container.style.display = "none";
    lastAnnouncedLimit = null;
    return;
  }

  let limit = feature.properties.maxspeed;
  let lanesLimit = feature.properties["maxspeed:lanes"];
  let isEstimated = false;

  if (!limit && !lanesLimit) {
    const type = feature.properties.highway;
    limit = ESP_FALLBACK_LIMITS[type];
    isEstimated = true;
  }

  if (lanesLimit) {
    const lanes = lanesLimit.split('|');
    container.innerHTML = `
      <div class="speed-lanes-container" style="display: flex; gap: 5px; justify-content: center; align-items: center;">
        ${lanes.map(l => `<div class="speed-sign mini" style="transform: scale(0.7); margin: -5px;">${l}</div>`).join('')}
      </div>`;

    if (lanesLimit !== lastAnnouncedLimit) {
      speak(`Límites por carril: ${lanes.join(', ')}`);
      lastAnnouncedLimit = lanesLimit;
    }
  } else if (limit) {
    container.innerHTML = `
      <div class="speed-sign ${isEstimated ? "estimated" : ""}">
        ${limit}
        ${isEstimated ? '<span class="est-label">EST.</span>' : ""}
      </div>`;

    if (limit !== lastAnnouncedLimit) {
      speak(`Límite de velocidad: ${limit}`);
      lastAnnouncedLimit = limit;
    }
  }

  container.style.display = "block";

  const speedText = document.getElementById("hud-speed");
  const maxLimit = lanesLimit ? Math.max(...lanesLimit.split('|').map(Number)) : parseInt(limit);

  if (targetSpeed > maxLimit + 5) {
    speedText.style.color = "#ef4444";
  } else {
    speedText.style.color = "white";
  }
}

function updateHudAlert(item, distanceKm) {
  const alertBox = document.getElementById("hud-alert");
  const now = Date.now();

  if (item && distanceKm < ALERT_RADIUS) {
    const isCamera = item.isCamera;
    const props = item.data;
    const type = item.type;

    let color = isCamera ? "#8b5cf6" : type === "fijo" ? "#e67e22" : "#D9281C";
    let icon = isCamera ? "ri-camera-lens-fill" : "ri-alarm-warning-fill";
    let label = isCamera ? "CÁMARA" : type.toUpperCase();

    if (
      !isCamera &&
      (type === "tramo" || type === "movil") &&
      distanceKm < 0.05
    ) {
      label = "EN RADAR";
      color = "#10b981";
    }

    alertBox.innerHTML = `
            <i class="${icon}" style="font-size: 4rem; color: ${color}; animation: pulse 1s infinite;"></i>
            <div style="font-size: 1.5rem; font-weight:bold; margin-top: 10px; color:${color}">${label}</div>
            <div class="notranslate">${props.road || props.tramo || "Vía Principal"}</div>
            <div style="font-size: 0.9rem;">${props.desc || ""} ${label === "EN RADAR" ? "" : "a " + (distanceKm * 1000).toFixed(0) + "m"}</div>
        `;

    // Alertas de voz: Solo saltan si estamos aproximándonos (no si ya estamos "EN RADAR")
    if (now - lastAlertTime > 15000 && label !== "EN RADAR") {
      const msgs = getVoiceSettings().labels;
      let frase = isCamera
        ? `Atención, cámara próxima en ${props.road}`
        : `${msgs.attention}. Radar ${type} en ${props.road || "su ruta"}`;
      speak(frase);
      lastAlertTime = now;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  } else {
    const isStopped = targetSpeed < 2;
    const estadoTexto = isStopped ? "Parado" : "Circulando";
    const estadoIcono = isStopped
      ? "ri-pause-circle-line"
      : "ri-steering-2-line";
    const estadoColor = isStopped ? "#94a3b8" : "#10b981";

    alertBox.innerHTML = `
            <i class="${estadoIcono}" style="font-size: 3rem; color: ${estadoColor};"></i>
            <div style="font-size: 1.2rem; margin-top: 10px;">${estadoTexto}</div>
        `;
  }
}

function speak(text) {
  if (isMuted) return;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const settings = getVoiceSettings();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.code;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

window.toggleMute = function () {
  isMuted = !isMuted;
  const btn = document.getElementById("btn-mute-driving");
  const icon = btn.querySelector("i");

  if (isMuted) {
    btn.style.background = "#991b1b";
    btn.style.borderColor = "#7f1d1d";
    icon.className = "ri-volume-mute-fill";
    showNotification("Voz desactivada", "", "info");
    window.speechSynthesis.cancel();
  } else {
    btn.style.background = "#374151";
    btn.style.borderColor = "#4b5563";
    icon.className = "ri-volume-up-fill";
    showNotification("Voz activada", "", "success");
    speak("Audio activado");
  }
};

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      console.log("Pantalla desbloqueada");
    });
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

function handleDrivingError(err) {
  console.warn("ERROR(" + err.code + "): " + err.message);
}

async function initTaxiMap() {
  const mapId = "map-taxis";
  const loader = document.getElementById("taxis-loader");
  if (!document.getElementById(mapId)) return;
  ensureMapContainerIsClean(mapId);

  if (loader) loader.classList.add("visible");

  if (!taxiMapInstance) {
    taxiMapInstance = L.map(mapId, {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: false,
    }).setView([37.1773, -3.5986], 14);

    checkMapTheme();

    taxiLayersGroup = L.layerGroup().addTo(taxiMapInstance);
    taxiMapInstance.locate({ setView: true, maxZoom: 15 });

    setTimeout(() => taxiMapInstance.invalidateSize(), 100);
  }

  if (!taxiDataLoaded) {
    loadTaxiKML();
    taxiDataLoaded = true;
  }

  if (loader) setTimeout(() => loader.classList.remove("visible"), 500);
}

function loadTaxiKML() {
  const customLayer = L.geoJson(null, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, {
        icon: L.divIcon({
          className: "",
          html: `<div class="transport-marker-container" style="background-color: #333; border: 2px solid #fff;">
                    <i class="ri-taxi-fill" style="font-size: 16px; color: #fff;"></i>
                 </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });
    },
    onEachFeature: function (feature, layer) {
      if (feature.geometry.type !== "Point") return;

      const name = feature.properties.name || "Parada de Taxi";
      const latlng = layer.getLatLng();

      const content = `
        <div style="text-align:center; min-width:130px; padding: 5px;">
            <strong style="font-size:0.95rem; display: block; margin-bottom: 8px; class="notranslate">${name}</strong>
            <button class="btn-navigate-popup" onclick="openMapsApp(${latlng.lat}, ${latlng.lng})">
                <i class="ri-direction-fill"></i> Ir ahora
            </button>
        </div>`;

      layer.bindPopup(content, { closeButton: false });
    },
  });

  omnivore
    .kml("data/taxi_granada.kml", null, customLayer)
    .addTo(taxiMapInstance);
}

window.scrollToTaxiInfo = function () {
  const target = document.getElementById("taxi-info-container");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.switchTaxiTariff = function (type, btn) {
  const container = btn.parentElement;
  container
    .querySelectorAll(".tab-pill")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  document.getElementById("taxi-urban-rates").style.display =
    type === "urban" ? "block" : "none";
  document.getElementById("taxi-inter-rates").style.display =
    type === "inter" ? "block" : "none";
};

window.openTaxiApp = function (service) {
  if (service === "pidetaxi") {
    window.open("https://pidetaxi.es", "_blank");
  }
};

let mastermindConfig = {
  target: [],
  currentGuess: [],
  attempts: 0,
  maxAttempts: 10,
  gameOver: false,
  icons: [
    "ri-bus-fill",
    "ri-train-fill",
    "ri-taxi-fill",
    "ri-parking-box-fill",
    "ri-gas-station-fill",
    "ri-camera-lens-fill",
  ],
};

window.openMastermindMenu = function () {
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("mastermind-game-container").style.display = "block";
  trackRecentItem("granaGo_recent_games", "Granámind");
  initMastermindGame();
};

window.closeMastermind = function () {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("mastermind-game-container").style.display = "none";
};

window.initMastermindGame = function () {
  mastermindConfig.target = [];
  mastermindConfig.currentGuess = [];
  mastermindConfig.attempts = 0;
  mastermindConfig.gameOver = false;

  for (let i = 0; i < 4; i++) {
    mastermindConfig.target.push(
      mastermindConfig.icons[
      Math.floor(Math.random() * mastermindConfig.icons.length)
      ],
    );
  }

  document.getElementById("mastermind-history").innerHTML = "";
  document.getElementById("mastermind-message").style.display = "none";
  document.getElementById("mastermind-controls").style.display = "block";
  const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  const btnPwr = document.getElementById("btn-pwr-mastermind");
  if (btnPwr) {
    btnPwr.style.display = inv["codigo-mind"] > 0 ? "flex" : "none";
  }
  document.getElementById("mastermind-stats-text").innerText =
    `Intentos: 0 / ${mastermindConfig.maxAttempts}`;

  renderMastermindPalette();
  renderMastermindBoard();
};

function renderMastermindPalette() {
  const palette = document.getElementById("mastermind-palette");
  palette.innerHTML = "";
  mastermindConfig.icons.forEach((icon) => {
    const btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.style.width = "48px";
    btn.style.height = "48px";
    btn.style.background = "var(--bg-app)";
    btn.style.border = "1px solid var(--border-subtle)";
    btn.innerHTML = `<i class="${icon}" style="font-size: 1.3rem; color: var(--text-primary);"></i>`;
    btn.onclick = () => selectMastermindIcon(icon);
    palette.appendChild(btn);
  });
}

function renderMastermindBoard() {
  const board = document.getElementById("mastermind-board");
  board.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    const slot = document.createElement("div");
    slot.style.width = "55px";
    slot.style.height = "55px";
    slot.style.borderRadius = "14px";
    slot.style.background = "var(--bg-app)";
    slot.style.display = "flex";
    slot.style.alignItems = "center";
    slot.style.justifyContent = "center";
    slot.style.fontSize = "1.8rem";
    slot.style.border = "1px solid var(--border-subtle)";

    if (mastermindConfig.currentGuess[i]) {
      slot.innerHTML = `<i class="${mastermindConfig.currentGuess[i]}"></i>`;
      slot.classList.add("pop");
    }
    board.appendChild(slot);
  }
}

window.selectMastermindIcon = function (icon) {
  if (mastermindConfig.gameOver || mastermindConfig.currentGuess.length >= 4)
    return;
  mastermindConfig.currentGuess.push(icon);
  renderMastermindBoard();
  document.getElementById("btn-submit-mastermind").disabled =
    mastermindConfig.currentGuess.length < 4;
};

window.removeMastermindIcon = function () {
  mastermindConfig.currentGuess.pop();
  renderMastermindBoard();
  document.getElementById("btn-submit-mastermind").disabled = true;
};

window.checkMastermindGuess = function () {
  if (mastermindConfig.currentGuess.length < 4) return;

  const guess = [...mastermindConfig.currentGuess];
  const target = [...mastermindConfig.target];
  let correctPos = 0;
  let correctIcon = 0;
  let targetUsed = [false, false, false, false];
  let guessUsed = [false, false, false, false];

  for (let i = 0; i < 4; i++) {
    if (guess[i] === target[i]) {
      correctPos++;
      targetUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  for (let i = 0; i < 4; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < 4; j++) {
      if (!targetUsed[j] && guess[i] === target[j]) {
        correctIcon++;
        targetUsed[j] = true;
        break;
      }
    }
  }

  addMastermindHistoryRow(
    mastermindConfig.currentGuess,
    correctPos,
    correctIcon,
  );

  mastermindConfig.attempts++;
  mastermindConfig.currentGuess = [];
  document.getElementById("mastermind-stats-text").innerText =
    `Intentos: ${mastermindConfig.attempts} / ${mastermindConfig.maxAttempts}`;
  document.getElementById("btn-submit-mastermind").disabled = true;

  if (correctPos === 4) {
    endMastermind(true);
  } else if (mastermindConfig.attempts >= mastermindConfig.maxAttempts) {
    endMastermind(false);
  } else {
    renderMastermindBoard();
  }
};

function addMastermindHistoryRow(guess, pos, icon) {
  const history = document.getElementById("mastermind-history");
  const row = document.createElement("div");
  row.className = "fade-in-up";
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.justifyContent = "space-between";
  row.style.padding = "12px";
  row.style.background = "var(--bg-card)";
  row.style.borderRadius = "14px";
  row.style.border = "1px solid var(--border-subtle)";

  let iconsHtml = '<div style="display:flex; gap:8px;">';
  guess.forEach((g) => {
    iconsHtml += `<i class="${g}" style="font-size:1.3rem; color:var(--text-primary); opacity:0.8;"></i>`;
  });
  iconsHtml += "</div>";

  let feedbackHtml =
    '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; background:rgba(0,0,0,0.05); padding:5px; border-radius:8px;">';
  for (let i = 0; i < 4; i++) {
    let color = "rgba(255,255,255,0.1)";
    if (pos > 0) {
      color = "#10b981";
      pos--;
    } else if (icon > 0) {
      color = "#f59e0b";
      icon--;
    }
    feedbackHtml += `<div style="width:10px; height:10px; background:${color}; border-radius:50%;"></div>`;
  }
  feedbackHtml += "</div>";

  row.innerHTML = `${iconsHtml} ${feedbackHtml}`;
  history.appendChild(row);
  history.scrollTop = history.scrollHeight;
}

window.useMastermindPowerup = function () {
  if (mastermindConfig.gameOver) return;

  if (useInventoryItem("codigo-mind")) {
    const pos = Math.floor(Math.random() * 4);
    const iconClass = mastermindConfig.target[pos];

    const iconNames = {
      "ri-bus-fill": "Autobús",
      "ri-train-fill": "Metro",
      "ri-taxi-fill": "Taxi",
      "ri-parking-box-fill": "Parking",
      "ri-gas-station-fill": "Gasolinera",
      "ri-camera-lens-fill": "Cámara",
    };

    const name = iconNames[iconClass] || "icono";
    showNotification("Eco-Código", `Pista: en el hueco ${pos + 1} hay un ${name}`, "info");

    updatePowerUpButton("btn-pwr-mastermind", "codigo-mind");
  }
};

function endMastermind(win) {
  mastermindConfig.gameOver = true;
  document.getElementById("mastermind-controls").style.display = "none";
  if (win) {
    updateAchievement('mind_expert', 1);
    const bonus =
      (mastermindConfig.maxAttempts - mastermindConfig.attempts) * 10;
    const totalReward = 40 + bonus;
    addGranaSaldo(totalReward, "descifrar el código");
  }
  const msg = document.getElementById("mastermind-message");
  msg.style.display = "block";
  msg.style.borderLeft = `4px solid ${win ? "#10b981" : "#ef4444"}`;

  document.getElementById("mastermind-result-title").innerText = win
    ? "¡Código Descifrado!"
    : "Fin de los intentos";

  let targetHtml =
    '<div style="display:flex; justify-content:center; gap:12px; margin:20px 0;">';
  mastermindConfig.target.forEach((icon) => {
    targetHtml += `<div style="width:50px; height:50px; background:var(--bg-app); border-radius:12px; display:flex; align-items:center; justify-content:center; border:2px solid var(--text-accent);"><i class="${icon}" style="font-size:1.5rem;"></i></div>`;
  });
  targetHtml += "</div>";

  document.getElementById("mastermind-result-text").innerHTML = `
    <p style="text-align:center;">${win
      ? "Enhorabuena, tienes un sentido de la orientación envidiable."
      : "No has dado con la combinación. El código correcto era:"
    }</p>
    ${targetHtml}
  `;
}

function trackRecentItem(key, item, limit = 2) {
  let items = JSON.parse(localStorage.getItem(key) || "[]");

  const itemID = typeof item === "object" ? item.id : item;
  items = items.filter((i) => (typeof i === "object" ? i.id : i) !== itemID);

  items.unshift(item);
  if (items.length > limit) items.pop();

  localStorage.setItem(key, JSON.stringify(items));
}

let encadenadasData = null;
let encadenadasState = {
  lastWord: "",
  lastSyllable: "",
  score: 0,
  usedWords: new Set(),
  timeLeft: 45,
  timerInterval: null,
};

async function openEncadenadasMenu() {
  hideAllGameContainers();
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("encadenadas-game-container").style.display = "block";

  if (!encadenadasData) {
    showNotification("Cargando", "Preparando diccionario...", "info");
    const res = await fetch("data/encadenadas.json");
    encadenadasData = await res.json();
  }
  initEncadenadas();
  trackRecentItem("granaGo_recent_games", "Granábras Encadenadas");
}

function setupEncadenadasInput() {
  const input = document.getElementById("encadenadas-input");
  if (input) {
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        submitEncadenada();
      }
    };
  }
}

window.surrenderEncadenadas = function () {
  endEncadenadasGame("Te has rendido");
};

function initEncadenadas() {
  const keys = Object.keys(encadenadasData);
  const startWord = keys[Math.floor(Math.random() * keys.length)];
  const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  const btnPwr = document.getElementById("btn-pwr-encadenadas");
  if (btnPwr) {
    btnPwr.style.display = inv["tiempo-encadenadas"] > 0 ? "flex" : "none";
  }
  const btnAuto = document.getElementById("btn-auto-encadenadas");
  if (btnAuto) {
    btnAuto.style.display = inv["auto-encadenadas"] > 0 ? "flex" : "none";
  }

  encadenadasState = {
    lastWord: startWord,
    lastSyllable: encadenadasData[startWord],
    score: 0,
    usedWords: new Set([normalizeGameInput(startWord)]),
    timeLeft: 45,
  };

  document.getElementById("encadenadas-gameplay").style.display = "block";
  document.getElementById("encadenadas-result-card").style.display = "none";
  document.getElementById("encadenadas-history").innerHTML =
    `<span class="bus-line-pill" style="background:var(--text-secondary)">${startWord}</span>`;

  setupEncadenadasInput();
  updateEncadenadasUI();
  startEncadenadasTimer();
}

function stopEncadenadasTimer() {
  if (encadenadasState.timerInterval) {
    clearInterval(encadenadasState.timerInterval);
  }
}

function startEncadenadasTimer() {
  stopEncadenadasTimer();
  encadenadasState.timeLeft = 45;
  const timerBar = document.getElementById("encadenadas-timer-bar");

  encadenadasState.timerInterval = setInterval(() => {
    encadenadasState.timeLeft -= 0.1;

    const percentage = (encadenadasState.timeLeft / 45) * 100;
    if (timerBar) timerBar.style.width = `${percentage}%`;

    if (encadenadasState.timeLeft <= 0) {
      stopEncadenadasTimer();
      endEncadenadasGame("¡Se acabó el tiempo!");
    }
  }, 100);
}

function updateEncadenadasUI() {
  document.getElementById("last-word-display").innerText =
    encadenadasState.lastWord.toUpperCase();
  document.getElementById("next-syllable-hint").innerText =
    `Debe empezar por: "${encadenadasState.lastSyllable.toUpperCase()}"`;
  document.getElementById("encadenadas-score").innerText =
    `Puntuación: ${encadenadasState.score}`;
}

window.useEncadenadasPowerup = function () {
  if (encadenadasState.timeLeft <= 0) return;

  if (useInventoryItem("tiempo-encadenadas")) {
    encadenadasState.timeLeft += 15;
    if (encadenadasState.timeLeft > 45) encadenadasState.timeLeft = 45;

    showNotification("Tiempo Extra", "¡+15 segundos añadidos!", "success");

    updatePowerUpButton("btn-pwr-encadenadas", "tiempo-encadenadas");

    if (navigator.vibrate) navigator.vibrate(100);
  }
};

window.useAutoEncadenadasPowerup = function () {
  if (encadenadasState.timeLeft <= 0) return;

  if (useInventoryItem("auto-encadenadas")) {
    const targetSyllable = encadenadasState.lastSyllable;
    const dictionary = Object.keys(encadenadasData);
    const foundWord = dictionary.find((word) => {
      const normalized = normalizeGameInput(word);
      return (
        normalized.startsWith(targetSyllable) &&
        !encadenadasState.usedWords.has(normalized)
      );
    });

    if (foundWord) {
      const input = document.getElementById("encadenadas-input");
      input.value = foundWord;
      showNotification("Auto-Cadena", `Palabra: ${foundWord.toUpperCase()}`, "success");

      setTimeout(() => {
        submitEncadenada();
        updatePowerUpButton("btn-auto-encadenadas", "auto-encadenadas");
      }, 500);

      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }
  }
};

function normalizeGameInput(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

window.submitEncadenada = function () {
  const input = document.getElementById("encadenadas-input");
  const rawWord = input.value.trim().toLowerCase();

  if (!rawWord) return;

  const wordNormalized = normalizeGameInput(rawWord);
  input.value = "";

  if (!encadenadasData[rawWord]) {
    showNotification(
      "No existe",
      "Palabra no encontrada en el diccionario",
      "error",
    );
    return;
  }

  if (encadenadasState.usedWords.has(wordNormalized)) {
    showNotification("Repetida", "Ya has usado esa palabra", "info");
    return;
  }

  if (!wordNormalized.startsWith(encadenadasState.lastSyllable)) {
    showNotification(
      "Error",
      `Debe empezar por "${encadenadasState.lastSyllable.toUpperCase()}"`,
      "error",
    );
    return;
  }

  encadenadasState.lastWord = rawWord;
  encadenadasState.lastSyllable = encadenadasData[rawWord];
  encadenadasState.score++;
  encadenadasState.usedWords.add(wordNormalized);
  startEncadenadasTimer();

  const historyContainer = document.getElementById("encadenadas-history");
  const span = document.createElement("span");
  span.className = "bus-line-pill fade-in-up";
  span.style.background = "var(--text-accent)";
  span.innerText = rawWord;

  if (historyContainer) {
    historyContainer.prepend(span);
  }

  updateEncadenadasUI();
  if (navigator.vibrate) navigator.vibrate(50);
};

function endEncadenadasGame(reason) {
  stopEncadenadasTimer();

  document.getElementById("encadenadas-gameplay").style.display = "none";
  const resultCard = document.getElementById("encadenadas-result-card");
  resultCard.style.display = "block";

  document.getElementById("encadenadas-result-title").innerText = reason;
  document.getElementById("encadenadas-result-score").innerText =
    `Puntuación final: ${encadenadasState.score}`;

  if (encadenadasState.score > 0) {
    updateAchievement('chain_pro', encadenadasState.score, true);
    addGranaSaldo(encadenadasState.score * 10, "palabras encadenadas");
  }

  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function closeEncadenadas() {
  stopEncadenadasTimer();
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("encadenadas-game-container").style.display = "none";
}

let bjState = {
  deck: [],
  playerHand: [],
  dealerHand: [],
  balance: 0,
  currentBet: 0,
  gameOver: false,
};

function openBlackjackMenu() {
  hideAllGameContainers();
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("blackjack-game-container").style.display = "block";

  const savedBalance = localStorage.getItem("granaGo_bj_balance");
  let currentBalance = savedBalance === null ? 500 : parseInt(savedBalance);

  if (currentBalance <= 0) {
    let courtesyCount = parseInt(
      localStorage.getItem("granaGo_bj_courtesy_count") || "0",
    );
    if (courtesyCount < 5) {
      currentBalance = 50;
      courtesyCount++;
      localStorage.setItem("granaGo_bj_balance", 50);
      localStorage.setItem("granaGo_bj_courtesy_count", courtesyCount);
      showNotification(
        "Regalo de cortesía",
        `Has recibido 50 G$ (${courtesyCount}/5)`,
        "success",
      );
    }
  }

  bjState.balance = currentBalance;
  updateBJUI();
  initBlackjackRound();
  trackRecentItem("granaGo_recent_games", "GranáJack");
}

function initBlackjackRound() {
  bjState.deck = createDeck();
  bjState.playerHand = [];
  bjState.dealerHand = [];
  bjState.gameOver = false;

  document.getElementById("blackjack-controls").style.display = "block";
  document.getElementById("blackjack-result").style.display = "none";
  document.getElementById("play-buttons").style.display = "none";
  document.getElementById("betting-area").style.display = "flex";

  const btnPwr = document.getElementById("btn-pwr-blackjack");
  if (btnPwr) btnPwr.style.display = "none";
  updateBJUI();
}

function createDeck() {
  const suits = ["clubs", "diamonds", "hearts", "spades"];
  const values = [
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
  let deck = [];
  suits.forEach((s) => values.forEach((v) => deck.push({ value: v, suit: s })));
  return deck.sort(() => Math.random() - 0.5);
}

function getHandScore(hand) {
  let score = 0,
    aces = 0;
  hand.forEach((c) => {
    if (c.value === "ace") aces++;
    else
      score += ["jack", "queen", "king"].includes(c.value)
        ? 10
        : parseInt(c.value);
  });
  for (let i = 0; i < aces; i++) score += score + 11 <= 21 ? 11 : 1;
  return score;
}

window.blackjackAction = function (action, amount) {
  if (action === "bet") {
    let betValue = amount === "all" ? bjState.balance : amount;

    if (betValue <= 0)
      return showNotification(
        "Sin saldo",
        "Pide un regalo de cortesía",
        "error",
      );
    if (betValue > bjState.balance)
      return showNotification("Saldo insuficiente", "", "error");

    bjState.currentBet = betValue;
    bjState.balance -= betValue;

    bjState.playerHand = [bjState.deck.pop(), bjState.deck.pop()];
    bjState.dealerHand = [bjState.deck.pop(), bjState.deck.pop()];

    document.getElementById("betting-area").style.display = "none";
    document.getElementById("play-buttons").style.display = "flex";

    const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
    const btnPwr = document.getElementById("btn-pwr-blackjack");
    if (btnPwr && inv["seguro-bj"] > 0) {
      btnPwr.style.display = "flex";
    }

    if (getHandScore(bjState.playerHand) === 21) {
      triggerBlackjackAnim();
      setTimeout(() => blackjackAction("stand"), 1600);
    }
  } else if (action === "hit") {
    bjState.playerHand.push(bjState.deck.pop());
    if (getHandScore(bjState.playerHand) >= 21) blackjackAction("stand");
  } else if (action === "stand") {
    bjState.gameOver = true;
    while (getHandScore(bjState.dealerHand) < 17) {
      bjState.dealerHand.push(bjState.deck.pop());
    }
    updateBJUI();
    setTimeout(() => resolveBJWinner(), 600);
  }
  updateBJUI();
};

function triggerBlackjackAnim() {
  const el = document.getElementById("bj-announcement");
  if (el) {
    el.style.display = "block";
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
    setTimeout(() => {
      el.style.display = "none";
    }, 1500);
  }
}

function resolveBJWinner() {
  const p = getHandScore(bjState.playerHand);
  const d = getHandScore(bjState.dealerHand);
  let resultMsg = "";

  let win = false;
  let push = false;

  if (p > 21) {
    resultMsg = "Te has pasado";
  } else if (d > 21 || p > d) {
    win = true;
    resultMsg =
      p === 21 && bjState.playerHand.length === 2 ? "¡BLACKJACK!" : "¡Ganaste!";
  } else if (p === d) {
    push = true;
    resultMsg = "Empate";
  } else {
    resultMsg = "Perdiste";
  }

  if (win) {
    updateAchievement('bj_lucky', 1);
    bjState.balance += bjState.currentBet * 2;
  } else if (push) {
    bjState.balance += bjState.currentBet;
  }

  if (bjState.hasInsurance) {
    const refund = Math.floor(bjState.currentBet * 0.5);
    bjState.balance += refund;
    showNotification(
      "Seguro aplicado",
      `Has recuperado ${refund} G$ (50%)`,
      "success",
    );
  }

  if (bjState.balance <= 0) {
    let courtesyCount = parseInt(
      localStorage.getItem("granaGo_bj_courtesy_count") || "0",
    );
    if (courtesyCount < 5) {
      bjState.balance = 50;
      courtesyCount++;
      localStorage.setItem("granaGo_bj_courtesy_count", courtesyCount);
      showNotification(
        "Cortesía de GranáGo",
        `Has recibido 50 G$ para seguir jugando (${courtesyCount}/5)`,
        "success",
      );
    } else {
      showNotification(
        "Sin saldo",
        "Has agotado tus regalos de cortesía.",
        "error",
      );
    }
  }

  localStorage.setItem("granaGo_bj_balance", bjState.balance);

  document.getElementById("blackjack-result").style.display = "block";
  document.getElementById("bj-msg").innerText = resultMsg;
  document.getElementById("blackjack-controls").style.display = "none";
}

function updateBJUI() {
  const balEl = document.getElementById("blackjack-balance");
  if (!balEl) return;

  const displayValue = parseInt(balEl.innerText.replace(/[^0-9]/g, "")) || 0;

  if (bjState.balance > displayValue && displayValue !== 0) {
    balEl.classList.remove("animate-gain", "animate-loss");
    void balEl.offsetWidth;
    balEl.classList.add("animate-gain");
  } else if (bjState.balance < displayValue) {
    balEl.classList.remove("animate-gain", "animate-loss");
    void balEl.offsetWidth;
    balEl.classList.add("animate-loss");
  }

  balEl.innerHTML = `Saldo: <span class="notranslate">${bjState.balance}</span> G$`;

  const renderCards = (hand, el, hideFirst) => {
    el.innerHTML = hand
      .map((c, i) => {
        const src =
          hideFirst && i === 0 && !bjState.gameOver
            ? `images/CartasSVG/traseraCartas.svg`
            : `images/CartasSVG/${c.value}_of_${c.suit}.svg`;
        return `<img src="${src}" loading="lazy" class="fade-in-up" style="height:100%; border-radius:8px; box-shadow: var(--shadow-soft);">`;
      })
      .join("");
  };

  renderCards(
    bjState.playerHand,
    document.getElementById("player-cards"),
    false,
  );
  renderCards(
    bjState.dealerHand,
    document.getElementById("dealer-cards"),
    true,
  );

  document.getElementById("player-score").innerText = getHandScore(
    bjState.playerHand,
  );
  document.getElementById("dealer-score").innerText = bjState.gameOver
    ? getHandScore(bjState.dealerHand)
    : "?";

  updateGamesMenuBalance();
}

window.useBlackjackPowerup = function () {
  if (bjState.gameOver || bjState.hasInsurance) return;

  if (useInventoryItem("seguro-bj")) {
    bjState.hasInsurance = true;
    showNotification(
      "Seguro Activado",
      "Recuperarás el 50% de tu apuesta si pierdes.",
      "info",
    );

    document.getElementById("btn-pwr-blackjack").style.display = "none";

    if (navigator.vibrate) navigator.vibrate(50);
  }
};

function closeBlackjack() {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("blackjack-game-container").style.display = "none";
}

async function initZBEMap() {
  const mapId = "map-zbe";
  if (!document.getElementById(mapId)) return;
  ensureMapContainerIsClean(mapId);

  if (!zbeMapInstance) {
    zbeMapInstance = L.map(mapId, {
      zoomControl: false,
      preferCanvas: true,
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);

    zbeTileLayer = updateMapTheme(zbeMapInstance, zbeTileLayer);
  } else {
    zbeMapInstance.invalidateSize();
  }

  if (!zbeDataLoaded) {
    try {
      const response = await fetch("data/zbe.geojson");
      const data = await response.json();

      L.geoJSON(data, {
        style: function (feature) {
          return {
            color: "#10b981",
            fillColor: "#10b981",
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.2,
          };
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties) {
            const name = feature.properties.name || "ZBE Granada";
            const desc = feature.properties.description || "";
            layer.bindPopup(
              `
                <div style="text-align:center; min-width:150px;">
                    <strong style="color:#10b981; font-size:1rem; display:block; margin-bottom:5px;">${name}</strong>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin:0;">${desc}</p>
                </div>
             `,
              { closeButton: false },
            );
          }
        },
      }).addTo(zbeMapInstance);

      zbeDataLoaded = true;
    } catch (e) {
      console.error("Error cargando GeoJSON ZBE:", e);
      showNotification("Error", "No se pudo cargar el mapa de la ZBE", "error");
    }
  }
}

async function initSostenibleMap() {
  const mapId = "map-sostenible";
  const container = document.getElementById(mapId);
  if (!container) return;

  ensureMapContainerIsClean(mapId);

  if (!sostenibleMap) {
    sostenibleMap = L.map(mapId, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 14);

    sostenibleTileLayer = updateMapTheme(sostenibleMap, sostenibleTileLayer);

    setTimeout(() => {
      if (sostenibleMap) {
        sostenibleMap.invalidateSize();
        locateUserSostenible(true);
      }
    }, 500);
  }

  if (!sostenibleDataLoaded) {
    loadSostenibleData();
  }
}

async function loadSostenibleData() {
  const loader = document.getElementById("sostenible-loader");
  if (loader) loader.classList.add("visible");

  carrilBiciLayer = L.featureGroup();
  parkingBiciLayer = L.featureGroup();

  omnivore
    .kml(
      "data/carrilbici.kml",
      null,
      L.geoJson(null, {
        style: (f) => {
          const type = (f.properties.name || "").toUpperCase();
          let color = "#10b981";

          if (type.includes("PACIFICADO")) {
            color = "#8b5cf6";
          } else if (type.includes("CICLO CALLE")) {
            color = "#f59e0b";
          } else if (type.includes("CICLO-CARRIL-BUS-VMP")) {
            color = "#3b82f6";
          } else if (type.includes("OTROS MUNICIPIOS")) {
            color = "#94a3b8";
          }

          return {
            color: color,
            weight: 4,
            opacity: 0.8,
          };
        },
      }),
    )
    .on("ready", function () {
      this.eachLayer((layer) => {
        const name =
          layer.feature.properties.name || "Infraestructura ciclista";
        layer.bindPopup(`<strong>${name}</strong>`, { closeButton: false });
        layer.addTo(carrilBiciLayer);
      });

      if (
        document.getElementById("btn-carriles").classList.contains("active")
      ) {
        carrilBiciLayer.addTo(sostenibleMap);
      }
    });

  try {
    const response = await fetch("data/parkingbici.kml");
    const kmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, "text/xml");
    const folders = xmlDoc.getElementsByTagName("Folder");

    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];

      const folderName =
        folder.getElementsByTagName("name")[0]?.textContent || "";
      const isExterior = folderName.toLowerCase().includes("exterior");

      const colorHex = isExterior ? "#10b981" : "#ef4444";
      const tipoNombre = isExterior ? "Exterior" : "Interior";

      const placemarks = folder.getElementsByTagName("Placemark");
      for (let j = 0; j < placemarks.length; j++) {
        const pm = placemarks[j];
        const name =
          pm.getElementsByTagName("name")[0]?.textContent || "Aparcabicis";
        const coordText = pm
          .getElementsByTagName("coordinates")[0]
          ?.textContent.trim();

        if (coordText) {
          const coords = coordText.split(",");
          const lng = parseFloat(coords[0]);
          const lat = parseFloat(coords[1]);

          if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: "transport-marker-container",
                html: `<div style="background:${colorHex}; border:2px solid white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:white; box-shadow: var(--shadow-soft);"><i class="ri-parking-box-fill"></i></div>`,
                iconSize: [28, 28],
              }),
            });

            marker.bindPopup(
              `<strong>Parking ${tipoNombre}</strong><br>${name}`,
              { closeButton: false },
            );
            marker.addTo(parkingBiciLayer);
          }
        }
      }
    }

    if (
      document.getElementById("btn-parkings-bici").classList.contains("active")
    ) {
      parkingBiciLayer.addTo(sostenibleMap);
    }
    if (loader) loader.classList.remove("visible");
  } catch (e) {
    console.error(
      "Error procesando estructura de carpetas en parkingbici.kml:",
      e,
    );
    if (loader) loader.classList.remove("visible");
  }

  sostenibleDataLoaded = true;
}

window.locateUserSostenible = function (isInitial = false) {
  if (!sostenibleMap) return;

  if (!isInitial) {
    showNotification("GPS", "Localizando...", "info");
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latlng = [position.coords.latitude, position.coords.longitude];

      sostenibleMap.flyTo(latlng, 16);

      if (sostenibleUserMarker) {
        sostenibleUserMarker.setLatLng(latlng);
        if (!sostenibleMap.hasLayer(sostenibleUserMarker)) {
          sostenibleUserMarker.addTo(sostenibleMap);
        }
      } else {
        sostenibleUserMarker = L.marker(latlng, {
          icon: L.divIcon({
            className: "gps-marker-container",
            html: `<div class="gps-dot-animated"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(sostenibleMap);
      }

      if (!isInitial) {
        showNotification(
          "Ubicación encontrada",
          "Te hemos localizado",
          "success",
        );
      }
    },
    (error) => {
      if (!isInitial) {
        showNotification("Error", "No se pudo obtener la ubicación", "error");
      }
      console.warn("Error Geolocation Sostenible:", error.message);
    },
    { enableHighAccuracy: true, timeout: 5000 },
  );
};

window.toggleSostenibleLayer = function (type, btn) {
  if (!sostenibleMap) return;

  const isActive = btn.classList.toggle("active");

  if (type === "carriles") {
    if (isActive) carrilBiciLayer.addTo(sostenibleMap);
    else sostenibleMap.removeLayer(carrilBiciLayer);
  } else if (type === "parkings") {
    if (isActive) {
      parkingBiciLayer.addTo(sostenibleMap);
      showNotification(
        "Parkings Bici",
        "Verde: Exterior | Rojo: Interior",
        "info",
      );
    } else {
      sostenibleMap.removeLayer(parkingBiciLayer);
    }
  }
};

window.addGranaSaldo = function (amount, reason) {
  const savedBalance = localStorage.getItem("granaGo_bj_balance");
  let currentBalance = savedBalance === null ? 500 : parseInt(savedBalance);
  currentBalance += amount;
  localStorage.setItem("granaGo_bj_balance", currentBalance);

  if (typeof updateBJUI === "function") updateBJUI();
  if (typeof updateGamesMenuBalance === "function") updateGamesMenuBalance();

  showNotification("¡GranáSaldo!", `+${amount} G$ por ${reason}`, "success");
};

window.updateGamesMenuBalance = function () {
  const savedBalance = localStorage.getItem("granaGo_bj_balance");
  const balance = savedBalance === null ? 500 : parseInt(savedBalance);

  const el = document.getElementById("games-main-balance");
  if (el) {
    el.innerHTML = `Saldo: <span class="notranslate" style="font-weight:800; color:var(--text-accent);">${balance}</span> G$`;
  }
};

const GAME_NAMES = {
  "wordle": "Granádle",
  "sudoku": "Granádoku",
  "memory": "Granámory",
  "quiz": "Granáquiz",
  "mastermind": "Granámind",
  "encadenadas": "Granábras Encadenadas",
  "blackjack": "GranáJack",
  "geograna": "GeoGraná",
};

window.renderShop = function () {
  const items = getShopItems();
  const savedBalance = localStorage.getItem("granaGo_bj_balance");
  const balance = savedBalance === null ? 500 : parseInt(savedBalance);
  const balDisplay = document.getElementById("tienda-balance-display");
  if (balDisplay)
    balDisplay.innerHTML = `Saldo actual: <span class="text-accent" style="font-weight:800;">${balance}</span> G$`;

  const colorsContainer = document.getElementById("shop-colors-container");
  const pwrContainer = document.getElementById("shop-powerups-container");

  const ownedColors = JSON.parse(
    localStorage.getItem("granaGo_owned_colors") || '["color-default"]',
  );
  const inventory = JSON.parse(
    localStorage.getItem("granaGo_inventory") || "{}",
  );
  const activeColor = localStorage.getItem("granaGo_accent_color") || "#2563eb";

  if (colorsContainer) {
    colorsContainer.innerHTML = items.colors
      .map((c) => {
        const isOwned = ownedColors.includes(c.id);
        const isActive = activeColor === c.hex;

        return `
        <div class="transport-card" style="justify-content: space-between; border-left: 4px solid ${c.hex
          }; align-items: center; padding: 12px 15px;">
          <div style="display: flex; align-items: center; gap: 15px">
            <div class="card-icon-wrapper" style="background: ${c.hex
          }1A; color: ${c.hex}; width: 42px; height: 42px; min-width: 42px;">
              <i class="ri-palette-fill"></i>
            </div>
            <div class="transport-info">
              <h3 style="font-size: 0.95rem; margin:0;">${c.name}</h3>
              <p style="margin:0; opacity: 0.7;">${isOwned ? "Propiedad" : c.price + " G$"
          }</p>
            </div>
          </div>
          <div style="flex-shrink: 0; margin-left: 10px;">
            ${isOwned
            ? `<button class="cookie-btn ${isActive ? "secondary" : "primary"
            }" 
                       style="min-width: 100px; height: 42px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;" 
                       onclick="applyAccentColor('${c.hex}')" ${isActive ? "disabled" : ""
            }>
                 ${isActive ? "Activo" : "Usar"}
               </button>`
            : `<button class="cookie-btn secondary" 
                       style="min-width: 100px; height: 42px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;" 
                       onclick="buyItem('${c.id}', 'color')">
                 Comprar
               </button>`
          }
          </div>
        </div>`;
      })
      .join("");
  }

  if (pwrContainer) {
    pwrContainer.innerHTML = items.powerups
      .map((p) => {
        const count = inventory[p.id] || 0;
        const gameName = GAME_NAMES[p.game] || "Juego";

        return `
      <div class="square-card" style="height: auto; min-height: 200px; padding: 18px 15px 15px 15px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; position: relative;">
        <span style="font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: var(--text-accent); background: var(--text-accent)1A; padding: 2px 8px; border-radius: 6px; margin-bottom: 8px;">
          ${gameName}
        </span>

        <div class="square-icon" style="background: var(--text-accent)1A; color: var(--text-accent); margin: 0 auto 8px auto; width: 44px; height: 44px;">
          <i class="${p.icon}" style="font-size: 1.3rem;"></i>
        </div>
        <div style="text-align:center; flex: 1; display:flex; flex-direction:column; justify-content:center; width: 100%; margin-bottom: 12px;">
           <span style="font-size:0.85rem; font-weight:800; display:block; line-height:1.2; margin-bottom: 3px;">${p.name}</span>
           <p style="font-size:0.65rem; opacity:0.6; margin:0; line-height: 1.3;">${p.desc}</p>
        </div>
        <button class="cookie-btn secondary" 
                style="width: 100%; height: 42px; padding: 0; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 5px; flex-shrink: 0;" 
                onclick="buyItem('${p.id}', 'powerup')">
          <span style="font-weight: 800;">${p.price} G$</span>
          <span style="opacity: 0.5; font-size: 0.7rem; font-weight: 400;">(${count})</span>
        </button>
      </div>`;
      })
      .join("");
  }

  const visContainer = document.getElementById("shop-visualizers-container");
  const ownedVisualizers = JSON.parse(localStorage.getItem("granaGo_owned_visualizers") || '[]');
  const activeVisualizer = localStorage.getItem("granaGo_active_visualizer");

  if (visContainer) {
    visContainer.innerHTML = items.visualizers.map((v) => {
      const isOwned = ownedVisualizers.includes(v.id);
      const isActive = activeVisualizer === v.file;

      return `
    <div class="square-card" style="height: auto; min-height: 220px; padding: 18px 15px 15px 15px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; position: relative;">
      
      <span style="font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: var(--text-accent); background: var(--text-accent)1A; padding: 2px 8px; border-radius: 6px; margin-bottom: 8px;">
        Radio Skin
      </span>

      <div class="square-icon" style="background: #000; width: 60px; height: 60px; overflow: hidden; border-radius: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center;">
        <img src="${v.file}" style="width: 100%; height: 100%; object-fit: contain;">
      </div>

      <div style="text-align:center; flex: 1; display:flex; flex-direction:column; justify-content:center; width: 100%; margin-bottom: 12px;">
         <span style="font-size:0.85rem; font-weight:800; display:block; line-height:1.2; margin-bottom: 3px;">${v.name}</span>
         <p style="font-size:0.65rem; opacity:0.6; margin:0; line-height: 1.3;">Visualizador animado para el reproductor de radio.</p>
      </div>

      ${isOwned
          ? `<button class="cookie-btn ${isActive ? 'secondary' : 'primary'}" 
                   style="width: 100%; height: 42px; font-size: 0.8rem;" 
                   onclick="equiparVisualizador('${v.file}')" ${isActive ? 'disabled' : ''}>
              ${isActive ? "Activo" : "Usar"}
           </button>`
          : `<button class="cookie-btn secondary" 
                   style="width: 100%; height: 42px; font-size: 0.8rem;" 
                   onclick="buyItem('${v.id}', 'visualizer')">
              <span style="font-weight: 800;">${v.price} G$</span>
           </button>`
        }
    </div>`;
    }).join("");
  }
};

function renderTiendaRadio() {
  const tiendaContainer = document.getElementById('tienda-items-container');

  RADIO_SKINS.forEach(skin => {
    const isOwned = checkOwnership(skin.id);
    const isActive = localStorage.getItem('granaGo_active_radio_skin') === skin.img;

    tiendaContainer.innerHTML += `
      <div class="shop-card">
        <div class="preview-container" style="background: #1a1a1a; border-radius: 15px; padding: 10px;">
          <img src="${skin.img}" alt="Preview" style="width: 80px; height: 80px; border-radius: 10px;">
          <p style="font-size: 0.7rem; color: #888;">Preview en vivo</p>
        </div>
        <h4>${skin.name}</h4>
        <p>${skin.price} 🪙</p>
        <button onclick="${isOwned ? `equiparSkin('${skin.img}')` : `comprarSkin('${skin.id}')`}" 
                class="btn-shop ${isActive ? 'active' : ''}">
          ${isOwned ? (isActive ? 'Equipado' : 'Equipar') : 'Comprar'}
        </button>
      </div>
    `;
  });
}

window.buyItem = function (id, type) {
  const items = getShopItems();

  let item;
  if (type === "color") {
    item = items.colors.find(c => c.id === id);
  } else if (type === "visualizer") {
    item = items.visualizers.find(v => v.id === id);
  } else {
    item = items.powerups.find(p => p.id === id);
  }

  const savedBalance = localStorage.getItem("granaGo_bj_balance");
  let balance = savedBalance === null ? 500 : parseInt(savedBalance);

  if (!item || balance < item.price) {
    showNotification(
      "Saldo insuficiente",
      "¡Sigue jugando para ganar más G$!",
      "error",
    );
    return;
  }

  balance -= item.price;
  localStorage.setItem("granaGo_bj_balance", balance);

  if (type === "color") {
    let owned = JSON.parse(
      localStorage.getItem("granaGo_owned_colors") || '["color-default"]',
    );
    if (!owned.includes(id)) owned.push(id);
    localStorage.setItem("granaGo_owned_colors", JSON.stringify(owned));
    applyAccentColor(item.hex);
    updateAchievement('shopper', 1);
  }
  else if (type === "visualizer") {
    let ownedVis = JSON.parse(
      localStorage.getItem("granaGo_owned_visualizers") || "[]"
    );
    if (!ownedVis.includes(id)) ownedVis.push(id);
    localStorage.setItem("granaGo_owned_visualizers", JSON.stringify(ownedVis));
    localStorage.setItem("granaGo_active_visualizer", item.file);
  }
  else {
    let inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
    inv[id] = (inv[id] || 0) + 1;
    localStorage.setItem("granaGo_inventory", JSON.stringify(inv));
  }

  renderShop();
  if (window.updateGamesMenuBalance) updateGamesMenuBalance();

  showNotification(
    "¡Compra realizada!",
    `Has adquirido: ${item.name}`,
    "success",
  );
};

window.equiparVisualizador = function (file) {
  const actual = localStorage.getItem("granaGo_active_visualizer");
  if (actual === file) {
    localStorage.removeItem("granaGo_active_visualizer");
  } else {
    localStorage.setItem("granaGo_active_visualizer", file);
  }
  renderShop();
  if (typeof actualizarUIPlayer === 'function') actualizarUIPlayer();
};

window.checkDailyReward = function () {
  const lastClaim = localStorage.getItem("granaGo_last_reward_date");
  const today = new Date().toDateString();
  const banner = document.getElementById("daily-reward-banner");

  if (lastClaim !== today) {
    banner.style.display = "block";
  } else {
    banner.style.display = "none";
  }
};

window.claimDailyReward = function () {
  const today = new Date().toDateString();
  localStorage.setItem("granaGo_last_reward_date", today);

  addGranaSaldo(50, "recompensa diaria");
  document.getElementById("daily-reward-banner").style.display = "none";

  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
};

function updatePowerUpButton(buttonId, itemId) {
  const inventory = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  if (!inventory[itemId] || inventory[itemId] <= 0) {
    const btn = document.getElementById(buttonId);
    if (btn) btn.style.display = "none";
  }
}

const slotIcons = [
  "ri-bus-fill",
  "ri-train-fill",
  "ri-taxi-fill",
  "ri-parking-box-fill",
  "ri-gas-station-fill",
  "ri-camera-lens-fill",
];

const PAYLINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 4, 8],
  [2, 4, 6],
];

window.openSlotsMenu = function () {
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("slots-game-container").style.display = "block";

  let balance = parseInt(localStorage.getItem("granaGo_bj_balance") || 500);

  if (balance <= 0) {
    let courtesyCount = parseInt(
      localStorage.getItem("granaGo_slots_courtesy_count") || "0",
    );
    if (courtesyCount < 5) {
      balance = 50;
      courtesyCount++;
      localStorage.setItem("granaGo_bj_balance", 50);
      localStorage.setItem("granaGo_slots_courtesy_count", courtesyCount);
      showNotification(
        "Regalo de cortesía",
        `50 G$ para probar suerte (${courtesyCount}/5)`,
        "success",
      );
    }
  }

  updateSlotsUI();
  trackRecentItem("granaGo_recent_games", "GranáSlots");
};

window.closeSlots = function () {
  if (slotsSpinning) return;
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("slots-game-container").style.display = "none";
};

window.setSlotBet = function (amount) {
  if (slotsSpinning) return;
  const balance = parseInt(localStorage.getItem("granaGo_bj_balance") || 500);
  slotBet = amount === "all" ? balance : amount;
  document.getElementById("current-slot-bet").innerText = slotBet;
};

window.spinSlots = function () {
  let balance = parseInt(localStorage.getItem("granaGo_bj_balance") || 500);

  if (balance < slotBet || slotBet <= 0) {
    showNotification("Saldo insuficiente", "Ajusta tu apuesta", "error");
    return;
  }

  if (slotsSpinning) return;
  slotsSpinning = true;

  balance -= slotBet;
  localStorage.setItem("granaGo_bj_balance", balance);
  updateSlotsUI();

  const wrappers = document.querySelectorAll(".slot-icon-wrapper");
  const cells = document.querySelectorAll(".slot-cell");

  cells.forEach((c) => c.classList.remove("win-pulse"));
  wrappers.forEach((w) => w.classList.add("reel-spinning"));

  const finalResults = [];
  for (let i = 0; i < 9; i++) {
    finalResults.push(slotIcons[Math.floor(Math.random() * slotIcons.length)]);
  }

  setTimeout(() => {
    for (let col = 0; col < 3; col++) {
      setTimeout(() => {
        const cellsInCol = [col, col + 3, col + 6];

        cellsInCol.forEach((cellIndex) => {
          const wrapper = document
            .getElementById(`s-${cellIndex}`)
            .querySelector(".slot-icon-wrapper");
          wrapper.classList.remove("reel-spinning");
          wrapper.innerHTML = `<i class="${finalResults[cellIndex]}"></i>`;
          void wrapper.offsetWidth;
          wrapper.classList.add("reel-stopping");
          if (navigator.vibrate && cellIndex % 3 === 0) navigator.vibrate(30);
        });

        if (col === 2) {
          setTimeout(() => {
            wrappers.forEach((w) => w.classList.remove("reel-stopping"));
            resolve3x3Results(finalResults);
          }, 600);
        }
      }, col * 400);
    }
  }, 1200);
};

function resolve3x3Results(grid) {
  slotsSpinning = false;
  let totalWin = 0;
  let winningCells = new Set();

  PAYLINES.forEach((line) => {
    const [a, b, c] = line;
    const icons = [grid[a], grid[b], grid[c]];

    if (icons[0] === icons[1] && icons[1] === icons[2]) {
      if (icons[0] === "ri-train-fill") updateAchievement('slot_jackpot', 1);
      const mult = icons[0] === "ri-train-fill" ? 15 : 8;
      totalWin += Math.floor(slotBet * mult);
      line.forEach((idx) => winningCells.add(idx));
    } else if (
      icons[0] === icons[1] ||
      icons[1] === icons[2] ||
      icons[0] === icons[2]
    ) {
      totalWin += Math.floor(slotBet * 0.5);
    }
  });

  if (totalWin > 0) {
    winningCells.forEach((idx) => {
      document.getElementById(`s-${idx}`).classList.add("win-pulse");
    });

    addGranaSaldo(totalWin, "Premio GranáSlots");
    showNotification("¡Premio!", `Has ganado ${totalWin} G$`, "success");
    if (navigator.vibrate) navigator.vibrate([80, 50, 80, 50, 150]);
  }

  const currentBalance = parseInt(
    localStorage.getItem("granaGo_bj_balance") || 500,
  );

  if (currentBalance <= 0) {
    let courtesyCount = parseInt(
      localStorage.getItem("granaGo_slots_courtesy_count") || "0",
    );
    if (courtesyCount < 5) {
      newBalance = 50;
      courtesyCount++;
      localStorage.setItem("granaGo_bj_balance", newBalance);
      localStorage.setItem("granaGo_slots_courtesy_count", courtesyCount);
      showNotification(
        "Cortesía de GranáGo",
        `Créditos añadidos (${courtesyCount}/5)`,
        "success",
      );
      slotBet = newBalance;
    }
  }

  if (currentBalance < slotBet) {
    slotBet = currentBalance;

    const betDisplay = document.getElementById("current-slot-bet");
    if (betDisplay) {
      betDisplay.innerText = slotBet;
    }

    if (slotBet > 0) {
      console.log("Apuesta ajustada al saldo disponible: " + slotBet);
    }
  }

  updateSlotsUI();
}

function updateSlotsUI() {
  const bal = localStorage.getItem("granaGo_bj_balance") || 500;
  const el = document.getElementById("slots-balance");
  if (el) el.innerHTML = `Saldo: <span class="notranslate">${bal}</span> G$`;
  updateGamesMenuBalance();
}

function scheduleSupportNotification(ms) {
  if (supportTimeout) clearTimeout(supportTimeout);
  supportTimeout = setTimeout(showSupportNotification, ms);
}

function initSupportTimers() {
  scheduleSupportNotification(2 * 60 * 1000);
}

function showSupportNotification() {
  if (drivingModeActive) return;

  if (document.querySelector(".support-toast")) {
    scheduleSupportNotification(20 * 60 * 1000);
    return;
  }

  const container = document.getElementById("notification-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "notification-toast toast-info gpu-accelerated support-toast";
  toast.style.animation = "slideInDown 0.5s forwards";
  toast.style.pointerEvents = "auto";
  toast.style.flexDirection = "column";
  toast.style.padding = "20px";

  toast.innerHTML = `
        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
            <i class="notification-icon icon ri-heart-3-fill" style="color: #ef4444; font-size: 1.8rem;"></i>
            <div class="notification-content">
                <h4 class="notification-title">¿Te gusta GranáGo?</h4>
                <p class="notification-message">Tu apoyo nos ayuda a mejorar la app cada día.</p>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; margin-bottom: 10px;">
            <button onclick="handleSupportClick('donate')" 
                    style="background: #004ad4; color: white; border: none; padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">
                <i class="ri-paypal-fill"></i> Donar
            </button>
            <button onclick="handleSupportClick('share')" 
                    style="background: var(--text-accent); color: white; border: none; padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">
                <i class="ri-share-line"></i> Compartir
            </button>
        </div>
        <div style="display: flex; gap: 10px; width: 100%;">
            <button onclick="handleSupportClick('feedback')" 
                    style="flex: 2; background: rgba(245, 158, 11, 0.1); color: var(--color-warning); border: 1px solid var(--color-warning); padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">
                <i class="ri-chat-smile-2-line"></i> Reportar / Sugerir
            </button>
            <button onclick="handleSupportClick('close')" 
                    style="flex: 1; background: var(--bg-app); color: var(--text-secondary); border: 1px solid var(--border-subtle); padding: 10px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.8rem;">
                Cerrar
            </button>
        </div>
    `;
  container.appendChild(toast);
}

window.handleSupportClick = function (action) {
  const toast = document.querySelector(".support-toast");
  if (toast) toast.remove();
  if (action === 'donate') window.open('https://www.paypal.com/donate/?hosted_button_id=ELYXMJVZP5B8W', '_blank');
  if (action === 'share') shareAppDirectly();
  if (action === 'feedback') openFeedbackModal();
  scheduleSupportNotification(15 * 60 * 1000);
};

window.shareAppDirectly = function () {
  const text =
    "Estoy usando GranáGo para moverme por Granada y también incluye juegos. ¡Tiene buses, metro y parkings en tiempo real! Y muchas otras opciones por descubrir... Pruébala aquí:";
  const url = "https://granago.github.io";

  if (navigator.share) {
    navigator
      .share({
        title: "GranáGo - Muévete con Sentido",
        text: text,
        url: url,
      })
      .then(() => {
        showNotification(
          "¡Gracias!",
          "Gracias por compartir GranáGo",
          "success",
        );
      });
  } else {
    copyToClipboard(text + " " + url);
    showNotification(
      "Enlace copiado",
      "Pégalo donde quieras para compartir",
      "info",
    );
  }

  updateAchievement('ambassador', 1);
};

window.calculateTripFuel = function () {
  const km = parseFloat(document.getElementById("calc-km").value);
  const consumption = parseFloat(document.getElementById("calc-cons").value);
  const price = parseFloat(document.getElementById("calc-price-trip").value);
  const resultDiv = document.getElementById("trip-result");

  if (!km || !consumption || !price) {
    showNotification(
      "Faltan datos",
      "Rellena todos los campos para calcular.",
      "error",
    );
    return;
  }

  const liters = (km * consumption) / 100;
  const cost = liters * price;
  const pricePerKm = cost / km;

  resultDiv.innerHTML = `
        Necesitas aprox. ${liters.toFixed(2)}L<br>
        Coste total: ${cost.toFixed(2)}€<br>
        <span style="font-size: 0.85rem; opacity: 0.8;">Precio por km: ${pricePerKm.toFixed(3)}€/km</span>
    `;

  if (navigator.vibrate) navigator.vibrate(50);
};

window.calculateFillCost = function () {
  const capacity = parseFloat(document.getElementById("fill-capacity").value);
  const price = parseFloat(document.getElementById("fill-price").value);
  const resultDiv = document.getElementById("fill-result");

  if (isNaN(capacity) || isNaN(price)) {
    showNotification(
      "Faltan datos",
      "Indica la capacidad y el precio del litro.",
      "error",
    );
    return;
  }

  const totalCost = capacity * price;

  resultDiv.innerHTML = `Coste total de llenado: ${totalCost.toFixed(2)}€`;
  if (navigator.vibrate) navigator.vibrate(50);
};

window.calculateTaxiFare = function () {
  const km = parseFloat(document.getElementById("taxi-km").value);
  const type = document.getElementById("taxi-type").value;
  const time = document.getElementById("taxi-time").value;
  const resultDiv = document.getElementById("taxi-calc-result");

  if (!km || km <= 0) {
    showNotification(
      "Datos incompletos",
      "Introduce los kilómetros del viaje.",
      "error",
    );
    return;
  }

  const rates = {
    urban: {
      t1: { flag: 1.6, km: 0.99, min: 4.25 },
      t2: { flag: 2.02, km: 1.18, min: 5.28 },
      t3: { flag: 2.47, km: 1.33, min: 6.5 },
    },
    inter: {
      t1: { flag: 3.41, km: 0.66, min: 3.56 },
      t2: { flag: 1.7, km: 0.78, min: 3.56 },
      t3: { flag: 1.7, km: 0.78, min: 3.56 },
    },
  };

  let totalPrice = 0;
  let estimatedMinutes = 0;

  if (type === "mixed") {
    const urbanKm = Math.min(km, 4);
    const interKm = Math.max(0, km - 4);

    totalPrice = rates.urban[time].flag + urbanKm * rates.urban[time].km;
    totalPrice += interKm * rates.inter[time].km;

    estimatedMinutes = urbanKm * 2.8 + interKm * 1.5;
  } else {
    const selectedRate = rates[type][time];
    totalPrice = selectedRate.flag + km * selectedRate.km;

    const minPerKm = type === "urban" ? 2.8 : 1.6;
    estimatedMinutes = km * minPerKm;

    if (totalPrice < selectedRate.min) totalPrice = selectedRate.min;
  }

  if (type !== "inter") totalPrice *= 1.12;

  resultDiv.style.display = "block";
  document.getElementById("res-price").innerText = `${totalPrice.toFixed(2)} €`;
  document.getElementById("res-time").innerText =
    `Tiempo estimado: ~${Math.round(estimatedMinutes)} min`;

  if (navigator.vibrate) navigator.vibrate(50);
};

window.openGeoMenu = function () {
  hideAllGameContainers();
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("geograna-game-container").style.display = "block";
  document.getElementById("geo-setup").style.display = "block";
  document.getElementById("geo-gameplay").style.display = "none";
  document.getElementById("geo-result").style.display = "none";
  updateGeoPowerUpUI();
  trackRecentItem("granaGo_recent_games", "GeoGraná");
};

window.closeGeo = function () {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("geograna-game-container").style.display = "none";
  if (geoMapInstance) { geoMapInstance.remove(); geoMapInstance = null; }
};

function updateGeoPowerUpUI() {
  const inventory = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");
  document.getElementById("pu-reveal-count").innerText = inventory.geo_reveal || 0;
  document.getElementById("pu-5050-count").innerText = inventory.geo_5050 || 0;
}

window.useGeoPowerUp = function (type) {
  if (geoConfig.isAnswered) return;

  const getName = (feature) => {
    const p = feature.properties;
    return p.NAMEUNIT || p.NAME || p.name || p.ADMIN || "Lugar desconocido";
  };
  const correctAnswer = getName(geoConfig.currentTarget);

  if (type === 'reveal') {
    if (useInventoryItem("geo-lince")) {
      const buttons = document.querySelectorAll("#geo-options-grid .quiz-btn");
      buttons.forEach(btn => {
        if (btn.dataset.answer === correctAnswer) {
          btn.style.boxShadow = "0 0 15px var(--text-accent)";
          btn.style.borderColor = "var(--text-accent)";
          btn.style.transform = "scale(1.05)";
        }
      });
      updatePowerUpButton("pu-reveal-btn", "geo-lince");
      showNotification("Geo-Lince", "Respuesta correcta resaltada", "success");
    }
  }
  else if (type === '5050') {
    if (useInventoryItem("geo-5050")) {
      const buttons = Array.from(document.querySelectorAll("#geo-options-grid .quiz-btn"));
      let incorrectButtons = buttons.filter(btn => btn.dataset.answer !== correctAnswer && btn.style.opacity !== "0.2");

      incorrectButtons.sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .forEach(btn => {
          btn.style.opacity = "0.2";
          btn.disabled = true;
          btn.style.pointerEvents = "none";
        });

      updatePowerUpButton("pu-5050-btn", "geo-5050");
      showNotification("50/50", "Opciones falsas eliminadas", "info");
    }
  }
};

async function startGeoGame(mode) {
  geoConfig.mode = mode;
  geoConfig.round = 1;
  geoConfig.score = 0;
  geoConfig.isAnswered = false;

  document.getElementById("geo-setup").style.display = "none";
  document.getElementById("geo-gameplay").style.display = "block";
  document.getElementById("geo-options-overlay").style.display = "none";

  const fileMap = {
    'granada': 'data/municipiosgranada.json',
    'espana': 'data/espprovincias.json',
    'mundo': 'data/paisesmundo.json'
  };

  showNotification("Cargando", "Preparando el mapa...", "info");

  try {
    await loadScript("js/leaflet.js");

    const response = await fetch(fileMap[mode]);
    const data = await response.json();

    geoConfig.targetFeatures = [...data.features]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    initGeoMap(data);
    nextGeoRound();
  } catch (e) {
    console.error(e);
    showNotification("Error", "No se pudo cargar el mapa o las librerías", "error");
  }
}

function initGeoMap(fullData) {
  if (geoMapInstance) geoMapInstance.remove();

  geoMapInstance = L.map('map-geo', {
    zoomControl: false,
    attributionControl: false,
    maxZoom: 12
  });

  const isDark = document.body.classList.contains("dark-mode");
  const url = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";

  L.tileLayer(url).addTo(geoMapInstance);

  geoLayer = L.geoJSON(fullData, {
    style: {
      color: isDark ? "#334155" : "#cbd5e1",
      weight: 1,
      fillOpacity: 0.1,
      fillColor: "#000"
    }
  }).addTo(geoMapInstance);

  geoMapInstance.fitBounds(geoLayer.getBounds());
}

function nextGeoRound() {
  geoConfig.isAnswered = false;
  geoConfig.currentTarget = geoConfig.targetFeatures[geoConfig.round - 1];

  document.getElementById("geo-stats-text").innerText = `Puntos: ${geoConfig.score} | Ronda: ${geoConfig.round}/10`;
  document.getElementById("geo-options-overlay").style.display = "block";

  const inv = JSON.parse(localStorage.getItem("granaGo_inventory") || "{}");

  const btnLince = document.getElementById("pu-reveal-btn");
  const btn5050 = document.getElementById("pu-5050-btn");

  if (btnLince) btnLince.style.display = (inv["geo-lince"] > 0) ? "flex" : "none";
  if (btn5050) btn5050.style.display = (inv["geo-5050"] > 0) ? "flex" : "none";

  const isDark = document.body.classList.contains("dark-mode");
  geoLayer.setStyle((feature) => {
    const isCurrent = feature === geoConfig.currentTarget;
    return {
      fillOpacity: isCurrent ? 0.8 : 0.1,
      fillColor: isCurrent ? "var(--text-accent)" : (isDark ? "#000" : "#fff"),
      color: isCurrent ? "white" : (isDark ? "#444" : "#ccc"),
      weight: isCurrent ? 3 : 1
    };
  });

  const bounds = L.geoJSON(geoConfig.currentTarget).getBounds();
  geoMapInstance.flyToBounds(bounds, { padding: [60, 60], duration: 1.2, maxZoom: 9 });

  renderGeoOptions();
}

function renderGeoOptions() {
  const grid = document.getElementById("geo-options-grid");
  grid.innerHTML = "";

  const getName = (feature) => {
    const p = feature.properties;
    return p.NAMEUNIT || p.NAME || p.name || p.ADMIN || "Lugar desconocido";
  };

  const correctAnswer = getName(geoConfig.currentTarget);

  let allPossibleNames = geoLayer.getLayers()
    .map(l => getName(l.feature))
    .filter(n => n !== correctAnswer && n !== "Lugar desconocido");

  let incorrectOptions = [...new Set(allPossibleNames)]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  let options = [correctAnswer, ...incorrectOptions].sort(() => 0.5 - Math.random());

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-btn";
    btn.dataset.answer = opt;
    btn.innerHTML = `<span>${opt}</span>`;
    btn.onclick = () => checkGeoAnswer(opt, correctAnswer, btn);
    grid.appendChild(btn);
  });
}

function checkGeoAnswer(selected, correct, btn) {
  if (geoConfig.isAnswered) return;
  geoConfig.isAnswered = true;

  if (selected === correct) {
    geoConfig.score += 1;
    btn.classList.add("correct");
    btn.innerHTML = `<span>${selected} <i class="ri-checkbox-circle-fill"></i></span>`;
  } else {
    btn.classList.add("wrong");
    const buttons = document.querySelectorAll("#geo-options-grid .quiz-btn");
    buttons.forEach(b => {
      if (b.dataset.answer === correct) {
        b.classList.add("correct");
      }
    });
  }

  setTimeout(() => {
    if (geoConfig.round < 10) {
      geoConfig.round++;
      nextGeoRound();
    } else {
      finishGeoGame();
    }
  }, 2000);
}

window.recenterGeoTarget = function () {
  if (!geoMapInstance || !geoConfig.currentTarget) return;

  const bounds = L.geoJSON(geoConfig.currentTarget).getBounds();
  geoMapInstance.flyToBounds(bounds, {
    padding: [60, 60],
    duration: 1.2,
    maxZoom: 9
  });
};

function finishGeoGame() {
  document.getElementById("geo-gameplay").style.display = "none";
  const resultDiv = document.getElementById("geo-result");
  resultDiv.style.display = "block";
  updateAchievement('geo_expert', geoConfig.score);

  document.getElementById("geo-result-score").innerText = `Puntuación final: ${geoConfig.score} puntos`;

  const recompensaFinal = geoConfig.score * 100;
  addGranaSaldo(recompensaFinal, "GeoGraná");
}

window.openFeedbackModal = function () {
  document.getElementById("feedback-modal").classList.add("visible");
};

window.closeFeedbackModal = function () {
  document.getElementById("feedback-modal").classList.remove("visible");
};

window.switchFeedbackTab = function (tab) {
  document.getElementById('feedback-content-envio').style.display = tab === 'envio' ? 'block' : 'none';
  document.getElementById('feedback-content-estado').style.display = tab === 'estado' ? 'block' : 'none';
  document.getElementById('tab-btn-envio').classList.toggle('active', tab === 'envio');
  document.getElementById('tab-btn-estado').classList.toggle('active', tab === 'estado');

  if (tab === 'estado') {
    fetchFeedbackStatus();
  }
};

window.setFeedbackType = function (type) {
  currentFeedbackType = type;
  document.getElementById("btn-feed-error").classList.toggle("active", type === 'Error');
  document.getElementById("btn-feed-idea").classList.toggle("active", type === 'Sugerencia');
};

window.sendToGoogleForms = async function () {
  const message = document.getElementById("feedback-message").value.trim();
  if (!message) {
    showNotification("Error", "El mensaje está vacío", "error");
    return;
  }

  const btn = document.getElementById("btn-send-feedback");
  btn.disabled = true;
  btn.innerText = "Enviando...";

  const FORM_ID = "1FAIpQLSf_bsFhxV3hWsS7KxOZ440cA60mZ9xWSAIXIE8lnzJduo-Zwg";
  const ENTRY_TIPO = "entry.1729369659";
  const ENTRY_MSG = "entry.983750409";

  const url = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse?${ENTRY_TIPO}=${currentFeedbackType}&${ENTRY_MSG}=${encodeURIComponent(message)}&submit=Submit`;

  try {
    await fetch(url, { mode: 'no-cors' });

    document.getElementById("feedback-message").value = "";
    setTimeout(closeFeedbackModal, 500);
    showNotification("¡Enviado!", "Gracias por tu feedback anónimo.", "success");
  } catch (e) {
    showNotification("Error", "No se pudo enviar. Inténtalo más tarde.", "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Enviar Feedback";
  }
};

document.addEventListener("click", (e) => {
  const fbModal = document.getElementById("feedback-modal");
  if (fbModal && e.target === fbModal) closeFeedbackModal();
});

async function updateHomeEcoWidget() {
  const container = document.getElementById("home-eco-content");
  if (!container) return;

  const totalKm = parseFloat(localStorage.getItem("granaGo_eco_km") || "0");
  const co2Saved = (totalKm * ECO_CONFIG.CO2_SAVED_PER_KM).toFixed(1);
  const moneySaved = (totalKm * ECO_CONFIG.EURO_SAVED_PER_KM).toFixed(2);
  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement("div");

  if (totalKm === 0) {
    wrapper.innerHTML = `<div class="summary-sub">Usa el bus o metro para ver tu impacto positivo.</div>`;
  } else {
    wrapper.innerHTML = `
        <div class="summary-value" style="color:#10b981">${co2Saved} kg <span style="font-size:0.8rem; opacity:0.6;">CO₂</span></div>
        <div class="summary-sub">Has ahorrado <strong>${moneySaved}€</strong> en combustible.</div>
        <div style="font-size:0.65rem; opacity:0.5; margin-top:5px;">Trayectos registrados: ${Math.round(totalKm)} km</div>
    `;
  }

  fragment.appendChild(wrapper);
  container.innerHTML = "";
  container.appendChild(fragment);
}

async function updateHomeAchievementsWidget() {
  const container = document.getElementById("home-achievements-content");
  if (!container) return;

  const stats = JSON.parse(localStorage.getItem('granaGo_achievements') || '{}');

  let pending = Object.keys(ACHIEVEMENTS_DATA)
    .map(id => {
      const current = stats[id] ? stats[id].progress : 0;
      const goal = ACHIEVEMENTS_DATA[id].goal;
      return { id, percent: (current / goal) * 100, ...ACHIEVEMENTS_DATA[id], current };
    })
    .filter(a => !stats[a.id]?.completed)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2);

  if (pending.length === 0) {
    container.innerHTML = `<div class="summary-sub">¡Increíble! Has completado todos los logros.</div>`;
    return;
  }

  container.innerHTML = pending.map(a => {
    const currentDisplay = Number(parseFloat(a.current).toFixed(1));

    return `
    <div style="margin-bottom: 8px;">
      <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
        <span style="font-weight:700;"><i class="${a.icon}"></i> ${a.title}</span>
        <span>${currentDisplay}/${a.goal}</span> </div>
      <div style="height:6px; background:var(--bg-app); border-radius:3px; overflow:hidden;">
        <div style="width:${a.percent}%; height:100%; background:var(--text-accent); transition:width 0.5s;"></div>
      </div>
    </div>
  `;
  }).join('');
}

window.updateAchievement = function (id, amount, isAbsolute = false) {
  let stats = JSON.parse(localStorage.getItem('granaGo_achievements') || '{}');
  const meta = ACHIEVEMENTS_DATA[id];
  if (!meta) return;

  if (!stats[id]) stats[id] = { progress: 0, completed: false };
  if (stats[id].completed) return;

  if (isAbsolute) stats[id].progress = amount;
  else stats[id].progress += amount;

  if (stats[id].progress >= meta.goal) {
    stats[id].progress = meta.goal;
    stats[id].completed = true;

    addGranaSaldo(meta.reward, `logro: ${meta.title}`);
    showNotification("¡Logro Desbloqueado!", meta.title, "success");
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }

  localStorage.setItem('granaGo_achievements', JSON.stringify(stats));

  if (document.getElementById("home-view").classList.contains("active")) {
    updateHomeAchievementsWidget();
  }
};

const FEEDBACK_SHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-9HhWj41654zlzt77s9c2qSxAWJIpAttia0jRagHB5ALBhd8yitBDr8lvCiYpaEYS9NHMUDe6cfU-/pub?gid=1560052631&single=true&output=csv";

async function fetchFeedbackStatus() {
  const container = document.getElementById('feedback-status-list');
  if (!container) return;

  container.innerHTML = '<div class="spinner" style="margin: 30px auto"></div>';

  try {
    const response = await fetch(FEEDBACK_SHEET_CSV);
    const data = await response.text();

    const rows = data.split('\n').slice(1);
    container.innerHTML = "";

    let hasUpdates = false;

    rows.forEach(row => {
      const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

      const publicTitle = columns[3]?.replace(/"/g, "").trim();
      const publicDesc = columns[4]?.replace(/"/g, "").trim();
      const status = columns[5]?.replace(/"/g, "").trim().toUpperCase();

      if (status && (status === "EN PROCESO" || status === "SOLUCIONADO" || status === "IMPLEMENTADO")) {
        hasUpdates = true;

        const isPending = status === "EN PROCESO";
        const color = isPending ? "#2563eb" : "#10b981";
        const bg = isPending ? "rgba(37, 99, 235, 0.1)" : "rgba(16, 185, 129, 0.1)";

        const card = document.createElement('div');
        card.className = "fav-card fade-in-up";
        card.style.cssText = "padding: 12px; flex-direction: column; align-items: flex-start; gap: 5px; border: 1px solid var(--border-subtle); margin-bottom: 10px; width: 100%;";

        card.innerHTML = `
          <span class="location-chip" style="background: ${bg}; color: ${color}; font-weight: 800; font-size: 0.7rem;">${status}</span>
          <p style="font-size: 0.85rem; margin: 0; font-weight: 600; color: var(--text-primary);">${publicTitle || 'Mejora en curso'}</p>
          <p style="font-size: 0.75rem; margin: 0; color: var(--text-secondary); line-height: 1.3;">${publicDesc || 'Sin descripción disponible.'}</p>
        `;
        container.appendChild(card);
      }
    });

    if (!hasUpdates) {
      container.innerHTML = '<p style="text-align:center; font-size:0.8rem; opacity:0.6; padding: 20px;">No hay actualizaciones públicas en este momento.</p>';
    }

  } catch (e) {
    container.innerHTML = '<p style="text-align:center; color:var(--color-error); font-size:0.8rem; padding: 20px;">Error al conectar con la base de datos.</p>';
  }
}

window.openEcoCalculator = function () {
  document.getElementById('eco-modal').classList.add('visible');
};

window.closeEcoModal = function () {
  document.getElementById('eco-modal').classList.remove('visible');
  document.getElementById('eco-input-km').value = '';
};

window.saveManualEcoTrip = function () {
  const kmInput = document.getElementById('eco-input-km');
  const typeSelect = document.getElementById('eco-input-type');

  if (!kmInput || !typeSelect) return;

  const km = parseFloat(kmInput.value);
  const type = typeSelect.value;

  if (isNaN(km) || km <= 0) {
    showNotification("Error", "Introduce una distancia válida", "error");
    return;
  }

  let typeLabel = "andando";
  if (type === 'bike') typeLabel = "en bici/VMP";
  if (type === 'pt') typeLabel = "en transporte público";

  let totalKm = parseFloat(localStorage.getItem("granaGo_eco_km") || "0");
  totalKm += km;
  localStorage.setItem("granaGo_eco_km", totalKm);

  const co2 = (km * ECO_CONFIG.CO2_SAVED_PER_KM).toFixed(2);
  const money = (km * ECO_CONFIG.EURO_SAVED_PER_KM).toFixed(2);

  const reward = Math.floor(km * 50);
  if (reward > 0) {
    addGranaSaldo(reward, "movilidad sostenible");
  }

  closeEcoModal();

  updateHomeEcoWidget();
  updateAchievement('eco_start', totalKm * ECO_CONFIG.CO2_SAVED_PER_KM, true);

  showNotification(
    "¡Impacto Registrado!",
    `Has recorrido ${km}km ${typeLabel}. Ahorro: ${co2}kg CO2 y ${money}€`,
    "success"
  );

  if (navigator.vibrate) navigator.vibrate(50);
};

document.addEventListener("click", (e) => {
  const ecoModal = document.getElementById("eco-modal");
  if (ecoModal && e.target === ecoModal) closeEcoModal();
});

window.openMinesweeperMenu = function () {
  hideAllGameContainers();
  document.getElementById("games-menu").style.display = "none";
  document.getElementById("minesweeper-game-container").style.display = "block";
  document.getElementById("mines-setup").style.display = "block";
  document.getElementById("mines-board-wrapper").style.display = "none";
  document.getElementById("mines-message").style.display = "none";
  trackRecentItem("granaGo_recent_games", "BuscaGraná");
};

window.closeMinesweeper = function () {
  document.getElementById("games-menu").style.display = "flex";
  document.getElementById("minesweeper-game-container").style.display = "none";
};

window.setMinesDiff = function (diff, btn) {
  minesConfig.diff = diff;
  const btns = document.querySelectorAll("#mines-setup .tab-pill");
  btns.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (diff === 'easy') { minesConfig.rows = 8; minesConfig.cols = 8; minesConfig.mines = 10; }
  else if (diff === 'medium') { minesConfig.rows = 12; minesConfig.cols = 10; minesConfig.mines = 20; }
  else { minesConfig.rows = 16; minesConfig.cols = 10; minesConfig.mines = 35; }
};

window.startMinesGame = function () {
  document.getElementById("mines-setup").style.display = "none";
  document.getElementById("mines-board-wrapper").style.display = "block";
  initMinesBoard();
};

function initMinesBoard() {
  minesConfig.gameOver = false;
  minesConfig.flags = 0;
  minesConfig.board = [];
  minesConfig.firstClick = true;
  const totalCells = minesConfig.rows * minesConfig.cols;

  for (let i = 0; i < totalCells; i++) {
    minesConfig.board.push({ mine: false, revealed: false, flagged: false, count: 0 });
  }

  renderMinesBoard();
  updateMinesStats();
}

function placeMinesSafe(firstIdx) {
  const totalCells = minesConfig.rows * minesConfig.cols;
  const forbiddenIdxs = new Set([firstIdx, ...getNeighbors(firstIdx)]);

  let placedMines = 0;
  while (placedMines < minesConfig.mines) {
    let idx = Math.floor(Math.random() * totalCells);
    if (!minesConfig.board[idx].mine && !forbiddenIdxs.has(idx)) {
      minesConfig.board[idx].mine = true;
      placedMines++;
    }
  }

  for (let i = 0; i < totalCells; i++) {
    if (!minesConfig.board[i].mine) {
      let neighbors = getNeighbors(i);
      minesConfig.board[i].count = neighbors.filter(n => minesConfig.board[n].mine).length;
    }
  }
}

function getNeighbors(idx) {
  const r = Math.floor(idx / minesConfig.cols);
  const c = idx % minesConfig.cols;
  const neighbors = [];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      let nr = r + i;
      let nc = c + j;
      if (nr >= 0 && nr < minesConfig.rows && nc >= 0 && nc < minesConfig.cols) {
        neighbors.push(nr * minesConfig.cols + nc);
      }
    }
  }
  return neighbors;
}

function renderMinesBoard() {
  const boardEl = document.getElementById("mines-board");
  boardEl.style.gridTemplateColumns = `repeat(${minesConfig.cols}, 1fr)`;
  boardEl.innerHTML = "";

  minesConfig.board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "mine-cell";

    if (cell.revealed) {
      div.classList.add("revealed");
      if (cell.mine) {
        div.innerHTML = '<i class="ri-close-circle-fill" style="color:#ef4444"></i>';
        div.style.background = "rgba(239, 68, 68, 0.2)";
      } else {
        div.innerText = cell.count > 0 ? cell.count : "";
        div.dataset.count = cell.count;
      }
    } else if (cell.flagged) {
      div.innerHTML = "🚩";
    }

    div.onclick = (e) => {
      revealCell(i);
    };

    div.oncontextmenu = (e) => {
      e.preventDefault();
      toggleFlag(i);
      if (navigator.vibrate) navigator.vibrate(30);
    };

    boardEl.appendChild(div);
  });
}

function revealCell(idx) {
  if (minesConfig.gameOver || minesConfig.board[idx].revealed || minesConfig.board[idx].flagged) return;

  if (minesConfig.firstClick) {
    placeMinesSafe(idx);
    minesConfig.firstClick = false;
  }

  minesConfig.board[idx].revealed = true;

  if (minesConfig.board[idx].mine) {
    endMinesGame(false);
  } else {
    if (minesConfig.board[idx].count === 0) {
      getNeighbors(idx).forEach(n => revealCell(n));
    }
    if (checkMinesWin()) endMinesGame(true);
  }
  renderMinesBoard();
}

function toggleFlag(idx) {
  if (minesConfig.gameOver || minesConfig.board[idx].revealed) return;
  minesConfig.board[idx].flagged = !minesConfig.board[idx].flagged;
  minesConfig.flags += minesConfig.board[idx].flagged ? 1 : -1;
  renderMinesBoard();
  updateMinesStats();
}

function checkMinesWin() {
  return minesConfig.board.every(c => c.mine || c.revealed);
}

function updateMinesStats() {
  document.getElementById("mines-stats-text").innerText =
    `Obstáculos: ${minesConfig.mines} | 🚩: ${minesConfig.flags}`;
}

function endMinesGame(win) {
  minesConfig.gameOver = true;
  minesConfig.board.forEach(c => { if (c.mine) c.revealed = true; });

  const msg = document.getElementById("mines-message");
  const title = document.getElementById("mines-result-title");
  msg.style.display = "block";
  msg.style.borderLeft = `4px solid ${win ? "#10b981" : "#ef4444"}`;

  if (win) {
    updateAchievement('mines_expert', 1);
    title.innerText = "¡Ciudad Limpia!";
    const reward = minesConfig.diff === 'easy' ? 30 : minesConfig.diff === 'medium' ? 60 : 120;
    addGranaSaldo(reward, "despejar la ciudad");
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  } else {
    title.innerText = "¡BOOM! Obstáculo chocado";
    if (navigator.vibrate) navigator.vibrate(500);
  }
}

window.openVehicleConfig = function () {
  document.getElementById('vehicle-config-modal').classList.add('visible');

  const resBtn = document.getElementById("btn-residente-toggle");
  resBtn.innerText = vehicleConfig.isResident ? "SÍ" : "NO";
  resBtn.classList.toggle("active", vehicleConfig.isResident);

  document.querySelectorAll(".badge-opt").forEach(b => {
    b.classList.toggle("active", b.dataset.badge === vehicleConfig.badge);
  });
};

window.closeVehicleConfig = function () {
  document.getElementById('vehicle-config-modal').classList.remove('visible');
};

window.toggleResidentStatus = function () {
  vehicleConfig.isResident = !vehicleConfig.isResident;
  localStorage.setItem("granaGo_is_resident", vehicleConfig.isResident);

  const btn = document.getElementById("btn-residente-toggle");
  btn.innerText = vehicleConfig.isResident ? "SÍ" : "NO";
  btn.classList.toggle("active", vehicleConfig.isResident);
};

window.setVehicleBadge = function (badgeType, btn) {
  vehicleConfig.badge = badgeType;
  localStorage.setItem("granaGo_vehicle_badge", badgeType);

  document.querySelectorAll(".badge-opt").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};

document.addEventListener("click", (e) => {
  const vModal = document.getElementById("vehicle-config-modal");
  if (vModal && e.target === vModal) closeVehicleConfig();
});

async function initWeatherView(lat, lon, cityName) {
  if (cityName === "Tu Ubicación") {
    const realName = await getGPSLocationName(lat, lon);
    cityName = realName;
  }

  weatherLocationActive = { lat, lon, name: cityName };
  document.getElementById('weather-detail-city').innerText = cityName;

  const cacheKey = `${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;
  const now = Date.now();

  if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp < 1800000)) {
    currentWeatherData = weatherCache[cacheKey].data;
    renderWeatherFull(currentWeatherData, weatherCache[cacheKey].aqi);
  } else {
    await fetchFullWeatherData(lat, lon, cacheKey);
  }

  setupWeatherSearch();
  updateWeatherFavIcon();
}

async function fetchFullWeatherData(lat, lon, cacheKey) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;

    const [res, resAqi] = await Promise.all([fetch(url), fetch(aqiUrl)]);
    const data = await res.json();
    const aqiData = await resAqi.json();

    weatherCache[cacheKey] = {
      timestamp: Date.now(),
      data: data,
      aqi: aqiData
    };

    currentWeatherData = data;
    renderWeatherFull(data, aqiData);
  } catch (e) {
    showNotification("Error", "No se pudo obtener el tiempo", "error");
  }
}

function renderWeatherFull(data, aqiData) {
  const current = data.current;
  document.getElementById('hero-temp').innerText = `${Math.round(current.temperature_2m)}°`;
  document.getElementById('hero-wind').innerText = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById('hero-humidity').innerText = `${current.relative_humidity_2m}%`;
  document.getElementById('hero-aqi').innerText = `AQI ${aqiData.current.european_aqi}`;
  document.getElementById('weather-detail-status').innerText = getWeatherDesc(current.weather_code);
  applyWeatherTheme(current.weather_code);

  const daySelector = document.getElementById('weather-day-selector');
  daySelector.innerHTML = "";

  data.daily.time.forEach((day, i) => {
    const date = new Date(day);
    const weekdayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
    const label = i === 0 ? `Hoy (${capitalizedDay})` : capitalizedDay;

    const btn = document.createElement('button');
    btn.className = `tab-pill ${i === 0 ? 'active' : ''}`;
    btn.innerText = label;
    btn.onclick = () => {
      document.querySelectorAll('#weather-day-selector .tab-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHourlyForDay(i);
    };
    daySelector.appendChild(btn);
  });

  renderHourlyForDay(0);

  const dailyContainer = document.getElementById('daily-forecast-container');
  dailyContainer.innerHTML = data.daily.time.map((day, i) => {
    const date = new Date(day);
    const weekdayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
    const label = i === 0 ? `Hoy (${capitalizedDay})` : capitalizedDay;

    return `
            <div class="daily-row">
                <span class="day-name" style="width: auto; min-width: 110px; text-align: left; margin-right: 10px;">${label}</span>
                <i class="${getWeatherIconName(data.daily.weather_code[i])}"></i>
                <div class="day-temps">
                    <span class="max">${Math.round(data.daily.temperature_2m_max[i])}°</span>
                    <span class="min">${Math.round(data.daily.temperature_2m_min[i])}°</span>
                </div>
            </div>`;
  }).join('');
}

function renderHourlyForDay(dayIndex) {
  const container = document.getElementById('hourly-forecast-container');
  container.innerHTML = "";

  const start = dayIndex * 24;
  const end = start + 24;

  for (let i = start; i < end; i++) {
    const time = new Date(currentWeatherData.hourly.time[i]);
    const temp = Math.round(currentWeatherData.hourly.temperature_2m[i]);
    const code = currentWeatherData.hourly.weather_code[i];
    const wind = Math.round(currentWeatherData.hourly.wind_speed_10m[i]);

    const item = document.createElement('div');
    item.className = "hourly-item";
    item.innerHTML = `
            <span class="h-time">${time.getHours()}:00</span>
            <i class="${getWeatherIconName(code)}"></i>
            <span class="h-temp">${temp}°</span>
            <span class="h-wind"><i class="ri-windy-line"></i> ${wind}</span>
        `;
    container.appendChild(item);
  }
  container.scrollLeft = 0;
}

function setupWeatherSearch() {
  const input = document.getElementById('weather-search-input');
  const results = document.getElementById('weather-search-results');

  input.oninput = debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 3) { results.classList.remove('visible'); return; }

    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=es&format=json`);
      const data = await res.json();
      if (!data.results) return;

      results.innerHTML = data.results.map(loc => `
                <div class="search-result-item" onclick="selectWeatherLoc(${loc.latitude}, ${loc.longitude}, '${loc.name}')">
                    <i class="ri-map-pin-2-line result-icon"></i>
                    <div class="result-info">
                        <strong>${loc.name}</strong>
                        <span>${loc.admin1 || ''}, ${loc.country}</span>
                    </div>
                </div>
            `).join('');
      results.classList.add('visible');
    } catch (e) { console.error(e); }
  }, 300);
}

window.selectWeatherLoc = function (lat, lon, name) {
  document.getElementById('weather-search-results').classList.remove('visible');
  document.getElementById('weather-search-input').value = "";
  weatherLocationActive = { lat, lon, name };
  initWeatherView(lat, lon, name);
};

function applyWeatherTheme(code) {
  const hero = document.getElementById('weather-hero-card');
  const icon = document.getElementById('hero-icon');
  let theme = "theme-sunny";

  if (code >= 1 && code <= 3) theme = "theme-cloudy";
  else if (code >= 45 && code <= 48) theme = "theme-fog";
  else if (code >= 51 && code <= 67) theme = "theme-rainy";
  else if (code >= 71 && code <= 77) theme = "theme-snowy";
  else if (code >= 80 && code <= 99) theme = "theme-storm";

  hero.className = `weather-hero-card ${theme}`;

  if (icon) {
    icon.className = `icon ${getWeatherIconName(code)}`;
  }
}

window.closeWelcomeModal = function () {
  const modal = document.getElementById("welcome-modal");
  if (modal) {
    modal.classList.remove("visible");
    localStorage.setItem("granaGo_welcome_seen", "true");
  }
};

document.addEventListener("click", (e) => {
  const welcomeModal = document.getElementById("welcome-modal");
  if (welcomeModal && e.target === welcomeModal && welcomeModal.classList.contains("visible")) {
    closeWelcomeModal();
  }
});

async function cargarRadiosDesdeAPI() {
  const statusInfoHUD = document.getElementById('radio-status-info');
  const statusInfoView = document.getElementById('radio-view-status-info');

  const updateStatusText = (text) => {
    if (statusInfoHUD) statusInfoHUD.innerText = text;
    if (statusInfoView) statusInfoView.innerText = text;
  };

  const cached = localStorage.getItem("granaGo_radio_cache");
  if (cached) {
    RADIO_STATIONS = JSON.parse(cached);
    renderRadioList();
  }

  try {
    const serversRes = await fetch("https://all.api.radio-browser.info/json/servers", { priority: 'low' });
    const servers = await serversRes.json();
    const base_url = `https://${servers[0].name}/json/stations/search?`;
    const [resEspana, resMundo] = await Promise.all([
      fetch(`${base_url}countrycode=ES&https=true&order=clickcount&reverse=true&limit=1000`),
      fetch(`${base_url}countrynotcode=ES&tag=music&https=true&order=clickcount&reverse=true&limit=500`)
    ]);

    const [dataEspana, dataMundo] = await Promise.all([resEspana.json(), resMundo.json()]);

    const mapaRadios = new Map();
    const nombresVistos = new Set();

    const procesarLista = (lista) => {
      lista.forEach(s => {
        const nombreNorm = s.name.trim().toLowerCase();
        const rawFavicon = s.favicon ? s.favicon.trim() : "";

        let finalLogo = 'images/Logo.png';
        if (rawFavicon && rawFavicon !== "" && rawFavicon !== "null" && !rawFavicon.includes("fbcdn.net") && !rawFavicon.includes("facebook.com")) {
          finalLogo = PROXY_URL + encodeURIComponent(rawFavicon);
        }

        if (s.name && s.url_resolved && s.url_resolved.startsWith('https://') &&
          !mapaRadios.has(s.url_resolved) && !nombresVistos.has(nombreNorm)) {
          nombresVistos.add(nombreNorm);
          mapaRadios.set(s.url_resolved, {
            id: btoa(s.url_resolved).substring(0, 16),
            name: s.name.trim(),
            url: s.url_resolved,
            logo: finalLogo
          });
        }
      });
    };

    procesarLista(dataEspana);
    procesarLista(dataMundo);

    RADIO_STATIONS = Array.from(mapaRadios.values());
    localStorage.setItem("granaGo_radio_cache", JSON.stringify(RADIO_STATIONS));

    requestIdleCallback(() => {
      renderRadioList();
      updateStatusText(`${RADIO_STATIONS.length} EMISORAS SINTONIZADAS`);
    });

  } catch (error) {
    console.error("Error API Radio:", error);
    updateStatusText("MODO OFFLINE / ERROR RED");
  }
}

function renderRadioList() {
  const hudContainer = document.getElementById('radio-list-horizontal');
  const viewContainer = document.getElementById('radio-view-list');
  const searchInput = document.getElementById('radio-search-input');
  if (!hudContainer && !viewContainer) return;

  const favs = getRadioFavorites();
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

  let filteredIndices = RADIO_STATIONS.map((_, i) => i);
  if (term) {
    filteredIndices = filteredIndices.filter(idx =>
      RADIO_STATIONS[idx].name.toLowerCase().includes(term)
    );
  }
  filteredIndices.sort((a, b) => {
    return favs.includes(RADIO_STATIONS[b].url) - favs.includes(RADIO_STATIONS[a].url);
  });

  if (hudContainer) {
    hudContainer.innerHTML = "";
    const hudBatch = filteredIndices;
    const hudFrag = document.createDocumentFragment();
    hudBatch.forEach(idx => hudFrag.appendChild(createRadioCard(idx)));
    hudContainer.appendChild(hudFrag);
    setupImageLazyLoading(hudContainer);
  }

  if (viewContainer) {
    viewContainer.innerHTML = "";
    radioMainIndices = filteredIndices;
    radioItemsDisplayed = 0;

    if (filteredIndices.length === 0 && term) {
      viewContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px; text-align: center; width: 100%; opacity: 0.6;">
                  <i class="ri-search-line" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                  <p>No se encontró ninguna emisora con ese nombre.</p>
                </div>`;
    } else {
      renderNextRadioBatch();
    }
  }
}

function createRadioCard(idx) {
  const station = RADIO_STATIONS[idx];
  const isFav = getRadioFavorites().includes(station.url);
  const isCurrent = currentRadioIdx === idx;
  const stationLogo = (station.logo && !station.logo.includes("url=null") && station.logo !== "undefined")
    ? station.logo
    : 'images/Logo.png';

  const card = document.createElement('div');
  card.className = `radio-station-card ${isFav ? 'is-favorite' : ''} ${isCurrent ? 'active' : ''}`;
  if (isCurrent && radioIsPlaying) card.classList.add('playing');
  card.id = `radio-card-${idx}`;

  card.innerHTML = `
      <div class="radio-logo-wrapper" style="position: relative; background: var(--bg-app); border-radius: 12px; overflow: hidden;">
        <img src="images/Logo.png" 
             data-src="${stationLogo}" 
             loading="lazy" 
             decoding="async" 
             alt="" 
             referrerpolicy="no-referrer"
             style="object-fit: cover; width: 100%; height: 100%;"
             onerror="this.onerror=null; this.src='images/Logo.png'; this.parentElement.style.background='transparent';">
        ${isFav ? '<i class="ri-star-fill" style="position:absolute; top:5px; right:5px; color:#fbbf24; z-index:10; text-shadow: 0 0 4px rgba(0,0,0,0.8);"></i>' : ''}
        <div class="radio-equalizer"><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div></div>
        <div class="radio-play-overlay"><i class="${isCurrent && radioIsPlaying ? 'ri-pause-fill' : 'ri-play-fill'}"></i></div>
      </div>
      <span class="radio-card-name" style="display: block; margin-top: 5px; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${station.name}</span>
    `;
  card.onclick = () => toggleStation(idx);
  return card;
}

function renderNextRadioBatch() {
  const viewContainer = document.getElementById('radio-view-list');
  if (!viewContainer || radioItemsDisplayed >= radioMainIndices.length) return;

  const nextBatch = radioMainIndices.slice(radioItemsDisplayed, radioItemsDisplayed + RADIO_PAGE_SIZE);
  const fragment = document.createDocumentFragment();

  let i = 0;
  function processInFrames() {
    const batchLimit = Math.min(i + 5, nextBatch.length);
    for (; i < batchLimit; i++) {
      fragment.appendChild(createRadioCard(nextBatch[i]));
    }

    if (i < nextBatch.length) {
      requestAnimationFrame(processInFrames);
    } else {
      viewContainer.appendChild(fragment);
      radioItemsDisplayed += nextBatch.length;
      setupImageLazyLoading(viewContainer);
      setupInfiniteScroll();
    }
  }
  requestAnimationFrame(processInFrames);
}

function setupInfiniteScroll() {
  const viewContainer = document.getElementById('radio-view-list');
  if (radioScrollObserver) radioScrollObserver.disconnect();

  radioScrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      radioScrollObserver.disconnect();
      renderNextRadioBatch();
    }
  }, { rootMargin: '400px' });

  if (viewContainer.lastElementChild) {
    radioScrollObserver.observe(viewContainer.lastElementChild);
  }
}

function setupImageLazyLoading(container) {
  if (!radioImageObserver) {
    radioImageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const realSrc = img.getAttribute('data-src');
          if (realSrc && realSrc !== 'images/Logo.png' && realSrc !== 'undefined') {
            img.src = realSrc;
          }
          img.removeAttribute('data-src');
          radioImageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '150px' });
  }
  container.querySelectorAll('img[data-src]').forEach(img => radioImageObserver.observe(img));
}

window.toggleStation = async function (index) {
  const audio = document.getElementById('hud-audio-element');
  const statusInfo = document.getElementById('radio-status-info');
  const station = RADIO_STATIONS[index];

  if (!radioIsPlaying || currentRadioIdx !== index) {
    radioStartedFromHUD = drivingModeActive;
  }

  if (currentRadioIdx === index && radioIsPlaying) {
    audio.pause();
    radioIsPlaying = false;
    actualizarUIPlayer();
    if (statusInfo) statusInfo.innerText = "PAUSADO";
    return;
  }

  try {
    if (currentRadioIdx !== index) {
      audio.pause();
      audio.src = RADIO_STATIONS[index].url;
      currentRadioIdx = index;
    }

    statusInfo.innerText = "CONECTANDO...";
    actualizarUIPlayer(true);

    await audio.play();
    radioIsPlaying = true;
    actualizarUIPlayer();
    statusInfo.innerText = `EN DIRECTO: ${RADIO_STATIONS[index].name}`;

    if (navigator.vibrate) navigator.vibrate(30);
  } catch (err) {
    statusInfo.innerText = "ERROR DE CONEXIÓN";
    actualizarUIPlayer();
  }
};

function actualizarUIPlayer() {
  const station = RADIO_STATIONS[currentRadioIdx];
  const favs = getRadioFavorites();

  document.querySelectorAll('.radio-station-card').forEach(card => {
    const cardIdx = parseInt(card.id.split('-').pop());
    card.classList.toggle('active', cardIdx === currentRadioIdx);
    card.classList.toggle('playing', cardIdx === currentRadioIdx && radioIsPlaying);

    const icon = card.querySelector('.radio-play-overlay i');
    if (icon) {
      icon.className = (cardIdx === currentRadioIdx && radioIsPlaying) ? 'ri-pause-fill' : 'ri-play-fill';
    }
  });

  if (currentRadioIdx !== -1 && station) {
    const isFav = favs.includes(station.url);
    const nameEl = document.getElementById('radio-current-name');
    const logoEl = document.getElementById('radio-current-logo');
    const playBtn = document.getElementById('radio-main-play-btn');
    const favBtn = document.getElementById('btn-fav-radio');

    if (nameEl) nameEl.innerText = station.name;
    if (logoEl) {
      const activeVis = localStorage.getItem("granaGo_active_visualizer");

      if (activeVis && radioIsPlaying) {
        logoEl.innerHTML = `<img src="${activeVis}" style="width:100%; height:100%; object-fit:contain; border-radius:20px; background:#000;">`;
      } else {
        logoEl.innerHTML = `<img src="${station.logo}" 
                                 alt="${station.name}" 
                                 style="width:100%; height:100%; object-fit:cover; border-radius:20px;" 
                                 onerror="this.src='images/Logo.png'; this.onerror=null;">`;
      }
    }
    if (playBtn) playBtn.innerHTML = `<i class="${radioIsPlaying ? 'ri-pause-fill' : 'ri-play-fill'}"></i>`;
    if (favBtn) {
      favBtn.innerHTML = `<i class="${isFav ? 'ri-star-fill' : 'ri-star-line'}"></i> ${isFav ? 'Favorito' : 'Añadir a favoritos'}`;
      favBtn.style.color = isFav ? '#fbbf24' : 'inherit';
    }

    if ('mediaSession' in navigator) {
      const activeVis = localStorage.getItem("granaGo_active_visualizer");
      let imageToUse = (activeVis && radioIsPlaying) ? activeVis : station.logo;

      if (!imageToUse || imageToUse === "undefined" || imageToUse.includes("url=null")) {
        imageToUse = "https://granago.github.io/images/Logo.png";
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: "Radio Graná",
        album: "En directo",
        artwork: [
          {
            src: imageToUse,
            sizes: '512x512',
            type: imageToUse.endsWith('.gif') ? 'image/gif' : 'image/png'
          }
        ]
      });
      navigator.mediaSession.setActionHandler('play', () => toggleStation(currentRadioIdx));
      navigator.mediaSession.setActionHandler('pause', () => toggleStation(currentRadioIdx));
    }
  }
}

function getRadioFavorites() {
  return JSON.parse(localStorage.getItem("granaGo_radio_favs") || "[]");
}

window.toggleRadioFav = function () {
  if (currentRadioIdx === -1) return;
  const station = RADIO_STATIONS[currentRadioIdx];
  let favs = getRadioFavorites();
  const isFav = favs.includes(station.url);

  if (isFav) {
    favs = favs.filter(url => url !== station.url);
    showNotification("Eliminado", "Quitado de favoritos", "info");
  } else {
    favs.push(station.url);
    showNotification("Guardado", "Añadido a favoritos", "success");
  }

  localStorage.setItem("granaGo_radio_favs", JSON.stringify(favs));
  actualizarUIPlayer();
  renderRadioList();
};

window.toggleMainPlayer = function () {
  if (currentRadioIdx === -1) {
    toggleStation(0);
  } else {
    toggleStation(currentRadioIdx);
  }
};

window.nextRadio = function () {
  let next = (currentRadioIdx + 1) % RADIO_STATIONS.length;
  toggleStation(next);
};

window.prevRadio = function () {
  let prev = (currentRadioIdx - 1 + RADIO_STATIONS.length) % RADIO_STATIONS.length;
  toggleStation(prev);
};

function initConnectionTracker() {
  if (!navigator.onLine) {
    showOfflineNotice();
  }

  window.addEventListener('offline', () => {
    showOfflineNotice();
  });

  window.addEventListener('online', () => {
    const container = document.getElementById("notification-container");
    if (container) {
      const activeOfflineToasts = container.querySelectorAll(".toast-error");
      activeOfflineToasts.forEach(t => t.remove());
    }

    showNotification(
      "Conexión restablecida",
      "Vuelves a tener internet. Todas las funciones de la aplicación están accesibles de nuevo.",
      "success",
      5000
    );
  });
}

function showOfflineNotice() {
  showNotification(
    "Sin conexión",
    "Estás navegando sin internet. Recuerda que algunas funciones pueden dar error o no ser accesibles.",
    "error",
    15000
  );
}

document.addEventListener("input", (e) => {
  if (e.target.id === "radio-search-input") {
    const term = e.target.value;
    const clearBtn = document.getElementById("clear-radio-search-btn");
    if (clearBtn) clearBtn.style.display = term ? "flex" : "none";

    renderRadioList();
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "clear-radio-search-btn" || e.target.closest("#clear-radio-search-btn")) {
    const input = document.getElementById("radio-search-input");
    if (input) {
      input.value = "";
      document.getElementById("clear-radio-search-btn").style.display = "none";
      renderRadioList();
    }
  }
});

window.toggleHudLayout = async function () {
  const hud = document.getElementById('driving-hud');
  const isHorizontalNow = hud.classList.toggle('hud-horizontal');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  try {
    if (isHorizontalNow) {
      if (isIOS) {
        showNotification(
          "Modo Horizontal",
          "Por favor, gira tu iPhone físicamente y asegúrate de quitar el bloqueo de orientación en el centro de control.",
          "info",
          6000
        );
      } else {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape');
        }

        showNotification(
          "Modo Horizontal",
          "Modo horizontal aplicado correctamente.",
          "success",
          3000
        );
      }
    } else {
      if (!isIOS && screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
      showNotification(
        "Modo Vertical",
        "Volviendo al modo vertical.",
        "success",
        3000
      );
    }
  } catch (err) {
    console.warn("La rotación automática no es compatible con este navegador/S.O.:", err);
    showNotification("Aviso", "Gira el móvil manualmente si no ha rotado automáticamente", "info");
  }

  localStorage.setItem('granaGo_hud_horizontal', isHorizontalNow);
  if (navigator.vibrate) navigator.vibrate(30);
};