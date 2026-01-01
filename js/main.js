const GRANADA_COORDS = { lat: 37.1773, lon: -3.5986 };
const API_BASE = "https://movgr.apis.mianfg.me";
const UNAVAILABLE_MESSAGE = "Sin llegadas próximas...";

let newWorker;
let deferredPrompt;
let isManualUpdate = false;

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

let repostarMap = null;
let repostarLayerGroup = null;
let repostarUserMarker = null;
let currentFuelType = null;
let allStationsData = [];
let repostarTileLayer = null;

let restriccionesMap = null;
let restriccionesLayer = null;
let panzoomInstance = null;

let camarasMapInstance = null;
let camarasClusterGroup = null;
let camarasTileLayer = null;
let camarasDataLoaded = false;

let parkingsMapInstance = null;
let parkingsLayerGroup = null;
let parkingsDataLoaded = false;
let parkingInterval = null;

let oraMapInstance = null;
let oraLayerGroup = null;
let oraDataLoaded = false;
let parkingsTileLayer = null;
let oraTileLayer = null;

const loadedScripts = {};
let googleTranslateScriptLoaded = false;

window.metroStationsCache = null;
let linesDataCache = {
  urbano: { paradas: null, rutas: null, horarios: null },
  metro: { paradas: null, rutas: null, horarios: null },
  interurbano: { paradas: null, rutas: null, horarios: null },
};

const FARE_DATA = {
  urbano: [
    {
      title: "Billete Ordinario",
      price: "1,40€",
      desc: "Pago directo al conductor. Permite un solo viaje.",
      color: "#D9281C",
    },
    {
      title: "Credibús 5€",
      price: "0,87€",
      per_trip: true,
      desc: "Tarjeta recargable. Coste de la tarjeta 2€ (fianza).",
      badge: "Recargable",
      color: "#D9281C",
    },
    {
      title: "Credibús 10€",
      price: "0,85€",
      per_trip: true,
      desc: "Bonificación mayor al recargar 10€.",
      badge: "Más usado",
      color: "#D9281C",
    },
    {
      title: "Credibús 20€",
      price: "0,83€",
      per_trip: true,
      desc: "La opción más económica por viaje para usuarios frecuentes.",
      badge: "Ahorro",
      color: "#D9281C",
    },
    {
      title: "Bono Mensual",
      price: "41,00€",
      desc: "Viajes ilimitados durante 30 días naturales.",
      badge: "Ilimitado",
      color: "#D9281C",
    },
    {
      title: "Transbordo",
      price: "Gratis",
      desc: "60 minutos permitidos entre distintas líneas.",
      color: "#475569",
    },
  ],
  metro: [
    {
      title: "Tarjeta Monedero",
      price: "0,49€",
      per_trip: true,
      desc: "Precio rebajado 2025 (Antes 0,82€). Saldo no caduca.",
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
  triunfo: { lat: 37.184731, lng: -3.605899 },
  pedroantonio: { lat: 37.1733032, lng: -3.6065272 },
  loscarmenes: { lat: 37.1513787, lng: -3.595468 },
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
    ];

    if (viewsWithMap.includes(viewId)) {
      if (document.getElementById("map-loader")) showLoader(true);
      await loadScript("js/leaflet.js");

      const extraScripts = [];
      if (["paradas", "lugares", "camaras", "repostar-map"].includes(viewId)) {
        extraScripts.push(loadScript("js/leaflet.markercluster.js"));
      }
      if (["camaras", "ora", "zonas-restringidas"].includes(viewId)) {
        extraScripts.push(loadScript("js/leaflet-omnivore.min.js"));
      }
      await Promise.all(extraScripts);
    }
    if (viewId === "zbe") {
      await loadScript("js/panzoom.min.js");
    }
  } catch (error) {
    console.error("Error cargando scripts:", error);
    showLoader(false);
    return;
  }

  if (viewId === "paradas") {
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

window.toggleSidebar = function () {
  const panel = document.getElementById("sidebar-panel");
  const backdrop = document.getElementById("sidebar-backdrop");
  const body = document.body;

  if (panel.classList.contains("open")) {
    panel.classList.remove("open");
    backdrop.classList.remove("visible");
    setTimeout(() => (backdrop.style.display = "none"), 300);
    body.style.overflow = "";
  } else {
    backdrop.style.display = "block";
    requestAnimationFrame(() => {
      panel.classList.add("open");
      backdrop.classList.add("visible");
    });
    body.style.overflow = "hidden";
  }
};

window.showNotification = function (title, message, type = "info") {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const lastToast = container.lastElementChild;
  if (lastToast) {
    const lastTitle = lastToast.querySelector(
      ".notification-title"
    )?.textContent;
    const lastMessage = lastToast.querySelector(
      ".notification-message"
    )?.textContent;

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
  }, 2500);
};

function initTheme() {
  const toggle = document.getElementById("theme-toggle");
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
      const metaColor = document.querySelector('meta[name="theme-color"]');
      if (metaColor) metaColor.content = isDark ? "#0f172a" : "#f0f2f5";

      checkMapTheme();
      checkMapThemePlaces();
      checkMapThemeCortes();
      checkMapThemeRepostar();
    });
  }
}

function initWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherData(
          position.coords.latitude,
          position.coords.longitude,
          "Tu Ubicación"
        );
      },
      (error) => {
        console.warn("GPS clima no disponible o denegado, usando defecto.");
        fetchWeatherData(GRANADA_COORDS.lat, GRANADA_COORDS.lon, "Granada");
      },
      { timeout: 1000, maximumAge: 30000 }
    );
  } else {
    fetchWeatherData(GRANADA_COORDS.lat, GRANADA_COORDS.lon, "Granada");
  }
}

async function fetchWeatherData(lat, lon, locationName) {
  const container = document.getElementById("weather-widget-container");
  if (!container) return;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error API");
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const humidity = data.current.relative_humidity_2m;
    const weatherIconName = getWeatherIconName(code);

    container.innerHTML = `
            <div class="weather-card-premium fade-in-up">
                <div class="weather-left">
                    <div class="location-badge notranslate">
                        <i class="icon ri-map-pin-user-fill"></i> ${locationName}
                    </div>
                    <div class="weather-temp notranslate">${temp}°</div>
                    <div class="weather-desc">${getWeatherDesc(code)}</div>
                </div>
                <div class="weather-right">
                    <i class="icon weather-icon-lg ${weatherIconName}"></i>
                    <div class="weather-humidity">
                        <i class="icon ri-drop-line"></i> ${humidity}%
                    </div>
                </div>
            </div>`;
  } catch (e) {
    console.error("Error clima", e);
    container.innerHTML = `
            <div class="weather-card-premium" style="background: var(--bg-card); color: var(--text-secondary); justify-content: center;">
                <span class="text-sm flex items-center gap-2"><span class="icon">cloud_off</span> Sin conexión</span>
            </div>`;
  }
}

function getWeatherIconName(code) {
  if (code === 0) return "ri-sun-line";
  if (code >= 1 && code <= 3) return "ri-sun-cloudy-line";
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
      currentPlacesTileLayer
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
}

function checkMapThemePlaces() {
  currentPlacesTileLayer = updateMapTheme(
    placesMapInstance,
    currentPlacesTileLayer
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
}

async function initMapParadas() {
  const mapContainer = document.getElementById("map-paradas");
  if (!mapContainer) return;
  ensureMapContainerIsClean("map-paradas");

  try {
    const minimumTimePromise = new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    if (!mapInstance) {
      mapInstance = L.map("map-paradas", {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        maxZoom: 19,
      }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);

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
        { enableHighAccuracy: true, timeout: 3000 }
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
        mapInstance
      );
      mapLayers.urbano = createTransportCluster("cluster-urbano-theme").addTo(
        mapInstance
      );
      mapLayers.interurbano = createTransportCluster(
        "cluster-inter-theme"
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
        "success"
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
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

    processStops(
      metroStops,
      metroColors,
      mapLayers.metro,
      "#009a44",
      "ri-train-fill",
      "popup-border-metro",
      "metro"
    );
    processStops(
      urbanoStops,
      urbanoColors,
      mapLayers.urbano,
      "#D9281C",
      "ri-bus-fill",
      "popup-border-urbano",
      "urbano"
    );
    processStops(
      interStops,
      interColors,
      mapLayers.interurbano,
      "#2757f5",
      "ri-bus-2-fill",
      "popup-border-inter",
      "interurbano"
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
  layerKey
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

    if (layerKey === "urbano" || layerKey === "metro") {
      let apiId = "";
      if (layerKey === "urbano") apiId = stop.stop_code;
      else if (layerKey === "metro") apiId = stop.stop_id;

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
      }
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
          stop.lines.toLowerCase().includes(term)
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
            `.filter-chip[data-layer="${layerKey}"]`
          );
          if (filterBtn) filterBtn.classList.add("active");
          showNotification(
            "Filtro activado",
            `Se ha activado la capa ${layerKey} para mostrar la parada.`,
            "info"
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
      t.innerText.toLowerCase().includes(type)
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
      (id) => id === "1" || id.toUpperCase().includes("M")
    );
  } else if (type === "interurbano") {
    filteredIds = allIds.filter(
      (id) => !isNaN(id) && id.length >= 3 && id !== "111" && id !== "121"
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
                ${
                  type === "metro"
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
      a.localeCompare(b, undefined, { numeric: true })
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
    "#64748b"
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

async function fetchRealTimeData(id, type) {
  const content = document.getElementById("realtime-content");
  try {
    let url = "";
    if (type === "urbano") {
      url = `${API_BASE}/bus/llegadas/${id}`;
    } else if (type === "metro") {
      const numericId = parseInt(id);
      const finalId = 100 + numericId;
      url = `${API_BASE}/metro/llegadas/${finalId}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Error API");
    const data = await res.json();
    renderRealTimeResults(data, type);
  } catch (e) {
    console.error("Error Tiempos:", e);
    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 0 && currentHour < 7;
    const errorIcon = isNightTime ? "🌙" : "⚠️";
    const errorMsg = isNightTime ? "Servicio nocturno" : UNAVAILABLE_MESSAGE;

    content.innerHTML = `
      <div class="status-message" style="text-align:center; padding:20px; color:var(--text-secondary);">
         <span style="font-size:2rem; display:block; margin-bottom:10px;">${errorIcon}</span>
         <span style="font-weight:600;">${errorMsg}</span>
         ${
           isNightTime
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
          "Metro"
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
        "i"
      );
      const destinoClean = p.destino.replace(regexRedundancy, "").trim();
      const timeObj = formatTime(p.minutos, "urbano");
      const realColor =
        window.appColors &&
        window.appColors.urbano &&
        window.appColors.urbano[lineId]
          ? window.appColors.urbano[lineId]
          : "#D9281C";
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
  destinationName
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
    (f) => f.id === currentLineId && f.type === currentTransportType
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
    (f) => f.id === currentLineId && f.type === currentTransportType
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
                <div class="fav-info" onclick="openLineDetail('${l.id}', '${
        l.type
      }', '${l.color}', '${l.name}')" style="cursor:pointer; flex:1;">
                    <div class="fav-icon-box" style="background-color:${
                      l.color
                    }; color:white; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.1rem;">
                        ${
                          l.type === "metro"
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
                    <button class="icon-btn-small" onclick="deleteFavLine('${
                      l.id
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
      let bgStyle =
        f.type === "metro"
          ? "background: rgba(0, 154, 68, 0.1); color:#009a44;"
          : "background: rgba(217, 40, 28, 0.1); color:#D9281C;";
      const safeName = f.name.replace(/'/g, "\\'");

      const card = document.createElement("div");
      card.className = "fav-card";
      card.innerHTML = `
                <div class="fav-info" onclick="openRealTimeModal('${f.id}', '${
        f.type
      }', '${safeName}')" style="cursor:pointer; flex:1;">
                    <div class="fav-icon-box" style="${bgStyle}">
                        <i class="icon ${iconClass}"></i>
                    </div>
                    <div class="fav-text">
                        <h4>${f.name}</h4>
                        <p>${
                          f.type === "metro"
                            ? "Metro de Granada"
                            : "Líneas: " + f.lines
                        }</p>
                    </div>
                </div>
                <div class="fav-actions">
                    <button class="icon-btn-small" onclick="openRealTimeModal('${
                      f.id
                    }', '${f.type}', '${safeName}')">
                         <i class="icon ri-time-line" style="color:var(--text-accent); font-size:1.2rem;"></i>
                    </button>
                    <button class="icon-btn-small" onclick="toggleFavorite('${
                      f.id
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
      () => {},
      { enableHighAccuracy: true, timeout: 3000 }
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
              feature.properties.name
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
            { closeButton: false }
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
        "error"
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
    () => (label.style.transform = "scale(0.96)")
  );
  label.addEventListener(
    "touchend",
    () => (label.style.transform = "scale(1)")
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
    '#filters-container-list input[type="checkbox"]'
  );
  checkboxes.forEach((cb) => {
    const category = cb.getAttribute("data-cat");
    cb.checked = state;
    toggleCategoryLayer(category, state);
  });
  showNotification(
    state ? "Capas activadas" : "Capas ocultas",
    state ? "Mostrando todos los puntos" : "Mapa despejado",
    "info"
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
          p.category.toLowerCase().includes(val)
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
            </div>`
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
        "error"
      );
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
};

window.openMapsApp = function (lat, lng) {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    window.open(
      `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      "_system"
    );
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_system"
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

async function renderMobilityEvents() {
  ensureMapContainerIsClean("map-cortes");
  if (!cortesMapInstance) {
    cortesMapInstance = L.map("map-cortes", {
      zoomControl: false,
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);

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
    const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(RSS_URL);

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
        /Ubicación.*?\(([\d.-]+),\s*([\d.-]+)\)/i
      );
      const typeMatch = descriptionHTML.match(/Tipo de corte:\s*(.*?)<\/p>/i);
      const endDateMatch = descriptionHTML.match(
        /Fin de la publicación:\s*([\d-]+)/i
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

  cortesLayersGroup.clearLayers();
  container.innerHTML = "";

  const filtered = allMobilityEvents.filter((evt) => {
    return (
      evt.title.toLowerCase().includes(searchTerm) ||
      evt.desc.toLowerCase().includes(searchTerm) ||
      evt.typeKey.toLowerCase().includes(searchTerm)
    );
  });

  if (filtered.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No se encontraron eventos.</div>';
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
    const firstCard = wrapper.querySelector(".event-card");
    if (firstCard) {
      firstCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

  showNotification("Detalle", "Evento localizado en la lista", "info");
};

window.locateEventOnMap = function (lat, lng) {
  if (!cortesMapInstance) return;
  window.scrollTo({ top: 0, behavior: "smooth" });

  let targetLayer = null;
  if (cortesLayersGroup) {
    cortesLayersGroup.eachLayer((layer) => {
      const layerLatLng = layer.getLatLng();
      if (
        Math.abs(layerLatLng.lat - lat) < 0.0001 &&
        Math.abs(layerLatLng.lng - lng) < 0.0001
      ) {
        targetLayer = layer;
      }
    });
  }

  if (!targetLayer) return;
  cortesMapInstance.setView([lat, lng], 16, {
    animate: true,
    duration: 1.0,
    easeLinearity: 0.25,
  });
  cortesMapInstance.once("moveend", () => {
    targetLayer.openPopup();
  });

  const currentCenter = cortesMapInstance.getCenter();
  const dist = Math.sqrt(
    Math.pow(currentCenter.lat - lat, 2) + Math.pow(currentCenter.lng - lng, 2)
  );

  if (dist < 0.00001) {
    targetLayer.openPopup();
    cortesMapInstance.off("moveend");
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
            repostarMap
          );
        } else {
          repostarUserMarker.setLatLng(latlng);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 3000 }
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
    const PROXY = "https://corsproxy.io/?";
    const TARGET = encodeURIComponent(
      "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia/18"
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
      html: `<div class="${markerClass}" style="background-color: ${bgColor}; border: 2px solid white; width: ${
        isRanking ? 40 : 32
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
      { closeButton: false }
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
      (a, b) => a._priceVal - b._priceVal
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
        "info"
      );
      return;
    }

    nearStations.sort((a, b) => a._priceVal - b._priceVal);
    const top5Near = nearStations.slice(0, 5);
    renderFuelMarkers(top5Near, true);

    const group = L.featureGroup(
      top5Near.map((s) => L.marker([s._lat, s._lng]))
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
          s["Municipio"].toLowerCase().includes(val)
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
                <strong style="color:${color}">${
        isFree ? "GRATIS" : "DE PAGO"
      }</strong>
                <p style="margin:5px 0;">${
                  el.tags.operator || "Cargador Público"
                }</p>
                <small>${details}</small>
                <button class="btn-navigate-popup" onclick="openMapsApp(${
                  el.lat
                }, ${el.lon})">
                    <i class="ri-direction-fill"></i> Ir
                </button>
             </div>
        `,
      { closeButton: false }
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
    "info"
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
          repostarMap
        );
      } else {
        repostarUserMarker.setLatLng(latlng);
      }
      showNotification("Localizado", "Ubicación actualizada", "success");
    },
    (error) => {
      showNotification("Error", "No se pudo obtener la ubicación", "error");
    },
    { enableHighAccuracy: true, timeout: 5000 }
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
      () => {},
      { enableHighAccuracy: true, timeout: 3000 }
    );
  } else {
    camarasMapInstance.invalidateSize();
  }

  if (!camarasDataLoaded) {
    try {
      await Promise.all([loadLocalKMLCameras(), loadDGTXMLCameras()]);
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
  const PROXY_URL = "https://corsproxy.io/?";
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
            Math.pow(lon - GRANADA_COORDS.lon, 2)
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
    { enableHighAccuracy: true }
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
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 13);

    checkMapTheme();

    parkingsLayerGroup = L.layerGroup().addTo(parkingsMapInstance);

    parkingsMapInstance.locate({ setView: true, maxZoom: 14 });
    parkingsMapInstance.on("locationfound", (e) => {
      const gpsIcon = L.divIcon({
        className: "gps-marker-container",
        html: `<div class="gps-dot-animated"></div>`,
        iconSize: [24, 24],
      });
      L.marker(e.latlng, { icon: gpsIcon }).addTo(parkingsMapInstance);
    });
  } else {
    parkingsMapInstance.invalidateSize();
  }

  if (parkingInterval) clearInterval(parkingInterval);

  await fetchParkingsData();
  parkingsDataLoaded = true;

  parkingInterval = setInterval(() => {
    console.log("Actualizando datos de parking...");
    fetchParkingsData();
  }, 120000);

  if (loader) loader.classList.remove("visible");
}

async function fetchParkingsData() {
  const PROXY = "https://corsproxy.io/?";
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
          { closeButton: false }
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
      attributionControl: false,
    }).setView([GRANADA_COORDS.lat, GRANADA_COORDS.lon], 14);

    checkMapTheme();

    oraMapInstance.locate({ setView: true, maxZoom: 15 });
    oraMapInstance.on("locationfound", (e) => {
      const gpsIcon = L.divIcon({
        className: "gps-marker-container",
        html: `<div class="gps-dot-animated"></div>`,
        iconSize: [24, 24],
      });
      L.marker(e.latlng, { icon: gpsIcon }).addTo(oraMapInstance);
    });
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
        "error"
      );
    });
}

window.openFullImage = function (src) {
  const modal = document.getElementById("image-modal");
  const img = document.getElementById("full-image-src");
  const scene = document.getElementById("panzoom-scene");

  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");

  if (modal && img && scene) {
    img.src = src;
    modal.classList.add("visible");

    if (panzoomInstance) {
      panzoomInstance.dispose();
      img.style.transform = "";
    }

    setTimeout(() => {
      panzoomInstance = Panzoom(img, {
        maxScale: 6,
        minScale: 1,
        contain: null,
        startScale: 1,
        cursor: "move",
      });

      scene.addEventListener("wheel", panzoomInstance.zoomWithWheel);

      zoomInBtn.onclick = () => panzoomInstance.zoomIn();
      zoomOutBtn.onclick = () => panzoomInstance.zoomOut();

      setTimeout(() => {
        panzoomInstance.zoom(1, { animate: true });
      }, 50);
    }, 200);
  }
};

window.closeFullImage = function () {
  const modal = document.getElementById("image-modal");
  if (modal) {
    modal.classList.remove("visible");
    if (panzoomInstance) {
      panzoomInstance.reset();
    }
  }
};

async function initHomeDashboard() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!window.userMarker && typeof L !== "undefined") {
          window.userMarker = {
            getLatLng: () => L.latLng(lat, lng),
          };
        }
        updateHomeFuel();
      },
      () => {
        console.log("GPS no permitido en Home");
      }
    );
  }
  Promise.allSettled([
    updateHomeEventsAndBus(),
    updateHomeParking(),
    updateHomeFuel(),
  ]);
}

async function updateHomeEventsAndBus() {
  const eventsList = document.getElementById("home-events-list");
  const busContent = document.getElementById("home-bus-content");

  try {
    const RSS_URL = "http://www.movilidadgranada.com/app/noticias/rss.php";
    const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(RSS_URL);

    const response = await fetch(PROXY_URL);
    const strXML = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(strXML, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const eventsFragment = document.createDocumentFragment();
    let eventCount = 0;
    let affectedLines = new Set();

    items.forEach((item) => {
      const description = item.querySelector("description").textContent;
      const dateMatch = description.match(
        /Fin de la publicación:\s*([\d\-]+)/i
      );

      if (dateMatch) {
        const eventEndDate = dateMatch[1].trim();

        if (eventEndDate === todayStr) {
          if (eventCount < 3) {
            const title = item.querySelector("title").textContent;
            const cleanTitle = title
              .replace(/^Corte de tráfico en /i, "")
              .replace(/^Afección al tráfico /i, "")
              .replace(/^Corte parcial en /i, "")
              .trim();

            const div = document.createElement("div");
            div.className = "mini-event-title";
            div.textContent = cleanTitle;
            eventsFragment.appendChild(div);

            eventCount++;
          }

          const busMatch = description.match(
            /Posible afección a líneas:\s*([A-Z0-9,\s]+)/i
          );
          if (busMatch) {
            const rawLines = busMatch[1].split(",");
            rawLines.forEach((line) => {
              const cleanLine = line.trim();
              if (cleanLine.length > 0) affectedLines.add(cleanLine);
            });
          }
        }
      }
    });

    eventsList.innerHTML = "";
    if (eventCount === 0) {
      eventsList.innerHTML = `<div class="summary-sub">Ningún evento disponible hoy.</div>`;
    } else {
      eventsList.appendChild(eventsFragment);
    }

    const linesArray = Array.from(affectedLines).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    busContent.innerHTML = "";

    if (linesArray.length > 0) {
      const titleDiv = document.createElement("div");
      titleDiv.className = "bus-status-text";
      titleDiv.style.cssText = "color:#ef4444; font-weight:700;";
      titleDiv.textContent = "Líneas afectadas:";

      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "bus-lines-wrapper";

      const linesFragment = document.createDocumentFragment();
      linesArray.forEach((l) => {
        const span = document.createElement("span");
        span.className = "bus-line-pill";
        span.textContent = l;
        linesFragment.appendChild(span);
      });

      wrapperDiv.appendChild(linesFragment);
      busContent.appendChild(titleDiv);
      busContent.appendChild(wrapperDiv);
    } else {
      busContent.innerHTML = `
        <div class="summary-value" style="color:#10b981; font-size:1.2rem">Normal</div>
        <div class="summary-sub">Sin desvíos específicos.</div>
      `;
    }
  } catch (e) {
    console.error("Error Home RSS:", e);
    eventsList.innerHTML = `<div class="summary-sub">No disponible</div>`;
    busContent.innerHTML = `<div class="summary-sub">No disponible</div>`;
  }
}

async function updateHomeParking() {
  const container = document.getElementById("home-parking-content");
  try {
    const PROXY = "https://corsproxy.io/?";
    const TABLE_URL =
      "http://www.movilidadgranada.com/aparcamientos/par_tabla.php";

    const response = await fetch(PROXY + encodeURIComponent(TABLE_URL));
    const text = await response.text();
    const htmlDoc = new DOMParser().parseFromString(text, "text/html");
    const rows = htmlDoc.querySelectorAll("tr");

    let totalOpen = 0;
    let totalFull = 0;
    let totalParkings = 0;

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

    let statusText = "";
    let color = "";
    let subText = "";

    if (totalParkings === 0) {
      statusText = "Sin Datos";
      subText = "Inténtalo más tarde";
    } else if (totalFull > totalOpen) {
      statusText = "Saturado";
      color = "#ef4444";
      subText = "Mayoría de parkings completos.";
    } else if (totalFull > 0 && totalFull < totalOpen) {
      statusText = "Ocupado";
      color = "#f59e0b";
      subText = "Plazas libres moderadas.";
    } else {
      statusText = "Libre";
      color = "#10b981";
      subText = "Buena disponibilidad general.";
    }

    container.innerHTML = `
            <div class="summary-value" style="color:${color}">${statusText}</div>
            <div class="summary-sub">${subText}</div>
        `;
  } catch (e) {
    container.innerHTML = `<div class="summary-sub">Error de conexión</div>`;
  }
}
async function updateHomeFuel() {
  const container = document.getElementById("home-fuel-content");
  const title = document.getElementById("fuel-widget-title");

  try {
    const PROXY = "https://corsproxy.io/?";
    const TARGET = encodeURIComponent(
      "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia/18"
    );

    const res = await fetch(PROXY + TARGET);
    const data = await res.json();
    const rawList = data.ListaEESSPrecio;

    const types = [
      { key: "Precio Gasolina 95 E5", label: "Gas 95" },
      { key: "Precio Gasolina 98 E5", label: "Gas 98" },
      { key: "Precio Gasoleo A", label: "Diésel A" },
      { key: "Precio Gasoleo Premium", label: "Diésel +" },
    ];

    let userLoc = null;
    if (typeof userMarker !== "undefined" && userMarker) {
      userLoc = userMarker.getLatLng();
    } else if (typeof mapInstance !== "undefined") {
    }

    let pricesToShow = {};
    let isNearestMode = false;

    if (userLoc) {
      isNearestMode = true;
      let minDistance = Infinity;
      let nearestStation = null;

      rawList.forEach((s) => {
        const lat = parseFloat(s["Latitud"].replace(",", "."));
        const lng = parseFloat(s["Longitud (WGS84)"].replace(",", "."));
        const dist = userLoc.distanceTo([lat, lng]);

        if (dist < minDistance) {
          minDistance = dist;
          nearestStation = s;
        }
      });

      if (nearestStation) {
        title.innerHTML = `Más Cercana <i class="ri-map-pin-user-fill" style="font-size:0.8em"></i>`;
        types.forEach((t) => {
          const val = nearestStation[t.key];
          pricesToShow[t.label] = val && val !== "" ? val : "-";
        });

        container.innerHTML = `<div style="font-size:0.75rem; font-weight:700; color:var(--color-primary); margin-bottom:5px; text-align:center;">${nearestStation["Rótulo"]}</div>`;
      }
    }

    if (!isNearestMode) {
      title.innerText = "Precios Medios";

      types.forEach((t) => {
        let sum = 0;
        let count = 0;
        rawList.forEach((s) => {
          const valStr = s[t.key];
          if (valStr) {
            const val = parseFloat(valStr.replace(",", "."));
            if (!isNaN(val)) {
              sum += val;
              count++;
            }
          }
        });
        pricesToShow[t.label] = count > 0 ? (sum / count).toFixed(3) : "-";
      });
      container.innerHTML = "";
    }

    let gridHtml = '<div class="fuel-price-grid">';
    types.forEach((t) => {
      gridHtml += `
                <div class="fuel-price-item">
                    <span class="fuel-type-label">${t.label}</span>
                    <span class="fuel-price-val">${
                      pricesToShow[t.label]
                    } €</span>
                </div>
            `;
    });
    gridHtml += "</div>";

    container.innerHTML += gridHtml;
  } catch (e) {
    console.error("Error Fuel:", e);
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
    "google_translate_element"
  );
};

function loadGoogleTranslateScript() {
  return new Promise((resolve, reject) => {
    if (googleTranslateScriptLoaded) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;

    script.onload = () => {
      googleTranslateScriptLoaded = true;
      setTimeout(resolve, 500);
    };

    script.onerror = () => {
      reject(new Error("Error al cargar Google Translate"));
    };

    document.body.appendChild(script);
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
        "info"
      );
    }
    return;
  }

  if (!googleTranslateScriptLoaded) {
    showNotification("Cargando idiomas", "Preparando traducción...", "info");
    try {
      await loadGoogleTranslateScript();
    } catch (error) {
      console.error(error);
      showNotification("Error", "No se pudo cargar el traductor", "error");
      return;
    }
  }

  const googleSelect = document.querySelector(".goog-te-combo");

  if (googleSelect) {
    googleSelect.value = lang;
    googleSelect.dispatchEvent(new Event("change"));

    const langNames = {
      es: "Español",
      en: "English",
      fr: "Français",
      it: "Italiano",
    };
    showNotification(
      "Idioma cambiado",
      `Traduciendo a ${langNames[lang] || lang}...`,
      "success"
    );
  } else {
    console.warn("El widget de traducción no se inicializó correctamente.");
  }
};

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
        "info"
      );
    });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("Service Worker registrado:", reg);

        reg.addEventListener("updatefound", () => {
          newWorker = reg.installing;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setTimeout(() => {
                showUpdateNotification();
              }, 7500);
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
  toggleSidebar();
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    showNotification(
      "¡Ya la tienes!",
      "GranáGo ya está instalada en tu dispositivo.",
      "success"
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
        "success"
      );
    }
  } else {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      showNotification(
        "Instalar en iPhone",
        "Pulsa el botón 'Compartir' de Safari y selecciona 'Añadir a la pantalla de inicio'.",
        "info"
      );
    } else {
      showNotification(
        "Instalación",
        "Si no ves la opción, busca 'Instalar aplicación' en el menú de tu navegador.",
        "info"
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
    "success"
  );
});

window.hardReload = async function () {
  showNotification(
    "Reiniciando...",
    "Borrando caché y actualizando...",
    "info"
  );

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
  window.location.reload(true);
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
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      content.innerHTML =
        '<div class="empty-state">Tu navegador no soporta geolocalización.</div>';
    }
  }
};

function calculateNearbyStops(lat, lng) {
  const content = document.getElementById("nearby-list-content");

  if (!allSearchableStops || allSearchableStops.length === 0) {
    content.innerHTML =
      '<p style="text-align:center;">No hay datos de paradas cargados aún.</p>';
    return;
  }

  const withDistance = allSearchableStops.map((stop) => {
    const dist = getDistanceFromLatLonInKm(lat, lng, stop.lat, stop.lon);
    return { ...stop, distance: dist };
  });

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
  const isInter = stop.layerKey === "interurbano";
  const distDisplay =
    stop.distance < 1
      ? Math.round(stop.distance * 1000) + " m"
      : stop.distance.toFixed(1) + " km";

  let color = "#64748b";
  if (stop.layerKey === "urbano") color = "#D9281C";
  if (stop.layerKey === "metro") color = "#009a44";
  if (stop.layerKey === "interurbano") color = "#2757f5";

  let actionsHtml = "";
  if (!isInter) {
    const safeName = stop.name.replace(/'/g, "\\'");
    const safeLines = (stop.lines || "").replace(/'/g, "\\'");

    const favs = getFavorites();
    const isFav = favs.some((f) => f.id == stop.id);
    const starIcon = isFav ? "ri-star-fill" : "ri-star-line";
    const starClass = isFav ? "active" : "";

    actionsHtml = `
            <button class="icon-btn-small" onclick="openRealTimeModal('${
              stop.id
            }', '${stop.layerKey}', '${safeName}')">
                <i class="icon ri-search-line" style="font-size:1.2rem; color:var(--text-primary);"></i>
            </button>
            <button class="icon-btn-small ${starClass}" onclick="toggleFavorite('${
      stop.id
    }', '${stop.layerKey}', '${safeName}', '${safeLines}', this)">
                <i class="icon ${starIcon}" style="font-size:1.2rem; color:${
      isFav ? "#fbbf24" : "var(--text-secondary)"
    };"></i>
            </button>
        `;
  }

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
    mapInstance.flyTo([lat, lon], 18);
    toggleNearbyPanel();
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
