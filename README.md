<p align="center">
  <img src="imagenes/Logo.webp" alt="GranáGo Logo" width="150">
</p>

# 📍 GranáGo - Movilidad Urbana en Granada

**GranáGo** es una aplicación web progresiva (PWA) diseñada para facilitar la movilidad y el turismo en la ciudad de Granada, España. Ofrece información en tiempo real sobre transporte público, zonas de aparcamiento, cortes de tráfico y puntos de interés turístico, todo en una interfaz moderna y adaptada a móviles.

## 📑 Índice

1. [✨ Características Principales](#caracteristicas)
2. [📖 Manual de Uso](#manual)

- [🚌 Transporte Público](#transporte)
- [🌿 Zona de Bajas Emisiones](#zbe)
- [🅿️ Estacionamiento ORA](#ora)
- [🚧 Cortes y Eventos](#cortes)
- [🚗 Mi Coche](#coche)
- [🗺️ Turismo y Puntos de Interés](#turismo)
- [ℹ️ Información de Transporte](#info-transporte)
- [⛽ Precios de Gasolineras](#precios-de-gasolineras)
- [🅿️ Estado de Parkings](#parkings)
- [🎭 Cultura y Ocio](#cultura)
- [⚙️ Configuración y Privacidad](#configuracion)

3. [📱 Experiencia de Usuario](#ux)
4. [🛠️ Tecnologías Utilizadas](#tecnologias)
5. [⚖️ Aviso Legal y Privacidad](#legal)

## <a id="caracteristicas"></a>✨ Características Principales

### 🚌 Transporte Público Inteligente

- **Autobuses y Metro en Tiempo Real:** Consulta de tiempos de llegada precisos mediante API oficial.
- **Modo Offline/Resiliente:** Si falla la conexión o la API, la app es capaz de identificar la parada por su código utilizando una base de datos interna, permitiéndote guardarla en favoritos incluso sin internet.
- **Gestión de Errores Contextual:** La interfaz se adapta al momento del día (Modo Noche 🌙) y ofrece feedback visual claro si una parada no tiene servicio.
- **Mapa Interactivo Optimizado:** Carga asíncrona de capas para evitar bloqueos visuales al mostrar miles de paradas (Urbano e Interurbano).

### ℹ️ Centro de Información de Transporte

- **Enciclopedia de Movilidad:** Acceso centralizado a datos de **Metro**, **Bus Urbano** y **Bus Interurbano**.
- **Rutas de Alta Precisión:** Visualización de recorridos sobre el mapa que siguen la geometría real de las calles (para autobuses) y vías (para metro), diferenciando claramente los sentidos de ida y vuelta.
- **Datos Tarifarios 2025:** Tablas actualizadas con los precios vigentes, incluyendo bonificaciones del Consorcio, Credibús y detalles sobre transbordos gratuitos.
- **Horarios y Servicios Especiales:** Cuadrantes con primeros y últimos servicios clasificados por tipo de día. Incluye una interfaz exclusiva para las líneas nocturnas **Búho (111 y 121)**.

### 🚗 Gestión de Vehículo Privado

- **Aparcamiento Persistente:** Guarda la ubicación GPS y la hora. Los datos persisten incluso si cierras el navegador.
- **Ruta a Pie:** Traza el camino de vuelta a tu coche con un solo toque.
- **ZBE (Zona de Bajas Emisiones):** Mapa de alta resolución con zoom y navegación táctil, junto con un resumen claro de la normativa de etiquetas (B, C, ECO, 0).
- **ORA (Zona Azul):** Listado detallado de calles por zonas (Roja, Azul, Verde) y tarifas actualizadas verano/invierno.

### 🗺️ Turismo y Puntos de Interés (POI)

- **Directorio Ampliado:** Más de 10 categorías incluyendo Hospitales, Farmacias, Bibliotecas, Discotecas y Miradores.
- **Navegación Activa "Ir Ahora":** - Traza la ruta a pie desde tu posición.
  - **Aviso de Llegada:** El sistema monitoriza tu GPS y lanza una notificación visual "¡HAS LLEGADO!" cuando estás a menos de 30 metros del destino.
- **Buscador Instantáneo:** Filtra puntos de interés en tiempo real mientras escribes.

### 🚧 Estado del Tráfico

- **Feed en Tiempo Real:** Conexión directa con Movilidad Granada.
- **Código de Colores:** Los marcadores del mapa cambian de color según la gravedad: 🔴 Cortes Totales, 🟠 Parciales, 🟣 Manifestaciones, 🔵 Obras.
- **Buscador Sincronizado:** Al buscar un evento en la lista, el mapa se filtra automáticamente para mostrar solo esa incidencia.

### ⛽ Consultor de Gasolineras Avanzado

- **Precios en Tiempo Real:** Conexión directa con la API del Ministerio para la Transición Ecológica.
- **Filtros Inteligentes:**
  - Búsqueda por tipo de combustible (Gasolina 95/98, Diesel A/B, GLP, eléctricos...).
  - Filtrado por marcas y franquicias (Repsol, Cepsa, Low Cost, Plenoil, etc.).
- **Asistente de Ahorro:** Botones de acceso rápido para localizar las **"Top 3 Baratas"** y las **"Top 5 Cercanas"** (radio < 3km).
- **Semáforo de Precios:** Código de colores (🟢 Verde, 🟠 Naranja, 🔴 Rojo) para identificar visualmente las estaciones más económicas respecto a la media.
- **Navegación GPS "Turn-by-turn":** Cálculo de ruta en coche desde tu ubicación actual hasta el surtidor, con aviso visual de "¡Has llegado!".

### 🅿️ Estado de Parkings en Tiempo Real

- **Disponibilidad al Minuto:** Conexión directa con los datos oficiales de Movilidad para mostrar las plazas libres exactas en los aparcamientos públicos.
- **Visualización Inteligente:** Tabla de datos sincronizada con el mapa. Incluye un botón de localización rápida para volar directamente a la entrada del parking.
- **Semáforo de Ocupación:** Pines y etiquetas con código de colores dinámico:
  - 🟢 **Verde:** Disponible.
  - 🟠 **Naranja:** Últimas plazas.
  - 🔴 **Rojo:** Completo o Cerrado.

### 🎭 Agenda Cultural Unificada

- **Motor de Búsqueda Híbrido:** Agregación en tiempo real de eventos procedentes de la **Junta de Andalucía** y el **Ayuntamiento de Granada**.
- **Algoritmo de Filtrado Inteligente:** Sistema propio que analiza el feed de noticias municipales y utiliza listas de palabras clave para separar automáticamente contenidos culturales (conciertos, teatro, talleres) de trámites administrativos (plenos, licitaciones), garantizando una agenda limpia.
- **Parsing de Fechas Avanzado:** Tecnología de extracción de texto capaz de leer y normalizar fechas incrustadas en títulos desordenados para mostrar calendarios precisos y descartar eventos pasados.
- **Normalización de Datos:** Unificación de formatos dispares (XML antiguo y JSON moderno) en una interfaz visual coherente.

## <a id="ux"></a>📱 Experiencia de Usuario (UX)

- **Modo Oscuro:** Soporte nativo para tema claro y oscuro.
- **Multiidioma:** Traducción integrada (Español/Inglés).
- **PWA:** Instalable en dispositivos móviles como una app nativa.

## <a id="manual"></a>📖 Manual de Uso

Aquí tienes una guía rápida para sacar el máximo partido a cada sección de GranáGo:

### <a id="transporte"></a>🚌 Transporte Público

El centro de mando para moverte en bus y metro.

- **Mapa Interactivo:** Al entrar, verás todas las paradas. Usa los botones superiores (`Urbano`, `Interurbano`, `Metro`) para encender o apagar las capas según lo que necesites. Usa los botones superiores. El sistema está optimizado para que los botones respondan inmediatamente al toque, incluso antes de cargar las miles de paradas.
- **Buscador Inteligente:** Escribe el nombre de la calle o parada en la barra superior para filtrar los marcadores del mapa al instante. Si buscas una parada y no hay conexión, la app intentará recuperar el nombre real de su base de datos interna para que puedas guardarla en favoritos de todos modos.
- **Tiempos de Llegada:** Toca cualquier parada en el mapa y pulsa **"Ver Tiempos"**. También puedes introducir el código de parada manualmente en las cajas de abajo (roja para Bus, verde para Metro).
- **Favoritos:** Pulsa la estrella ⭐ en el resultado de una parada para guardarla. Aparecerá como un acceso directo la próxima vez que entres.

### <a id="zbe"></a>🌿 Zona de Bajas Emisiones (ZBE)

- Consulta el mapa oficial de la zona restringida. Puedes tocar el mapa para abrirlo en **pantalla completa** y hacer zoom con los dedos para ver los límites exactos de las calles.
- Revisa la normativa simplificada para saber si tu vehículo puede acceder.

### <a id="ora"></a>🅿️ Estacionamiento ORA

Evita multas conociendo la normativa.

- **Mapa Dual:** Alterna entre el **"Mapa de Vías"** (coloreado por tipo de zona) y el **"Mapa de Parquímetros"** usando los botones superiores.
- **Calculadora y Horarios:** Consulta de un vistazo los horarios de verano/invierno y las tarifas exactas para Zona Azul, Verde y Roja.
- **Buscador de Calles:** ¿No sabes si tu calle es de pago? Búscala en el listado inferior.

### <a id="cortes"></a>🚧 Cortes y Eventos

Mantente informado sobre el tráfico en tiempo real.

- **Mapa de Incidencias:** Los iconos en el mapa indican obras, manifestaciones o cortes totales/parciales. Toca uno para ver el detalle.
- **Lista y Filtro:** Debajo del mapa tienes un listado ordenado por fecha. Usa la barra de búsqueda para encontrar eventos específicos (ej: "Manifestación"). Al escribir, tanto la lista como el mapa se filtran automáticamente.
- **Lectura Rápida:**
  - 🔴 **Rojo:** Corte Total.
  - 🟠 **Naranja:** Corte Parcial.
  - 🟣 **Morado:** Manifestación.
  - 🔵 **Azul:** Obras.

### <a id="coche"></a>🚗 ¿Dónde he aparcado? (Mi Coche)

Nunca más olvidarás dónde dejaste el coche.

1.  **Guardar:** Cuando aparques, pulsa el botón gigante **"🅿️ AQUÍ HE APARCADO"**. La app guardará tus coordenadas GPS y la hora exacta en la memoria de tu teléfono (privacidad total, nada se sube a la nube).
2.  **Volver:** Cuando quieras regresar, verás un panel con la hora de estacionamiento. Pulsa **"🚶 IR AL COCHE"** y la app trazará una ruta a pie desde tu posición actual hasta tu vehículo.
3.  **Borrar:** Una vez llegues, pulsa el icono de la papelera 🗑️ para limpiar la ubicación. Para evitar accidentes, al intentar borrar la ubicación del coche se te pedirá confirmación mediante un mensaje emergente.

### <a id="turismo"></a>🗺️ Lugares de Interés (Turismo)

Descubre Granada con información útil.

- **Categorías:** Usa los botones de colores (Hotel, Museo, Farmacia, etc.) para filtrar qué quieres ver en el mapa.
- **Navegación:** Al tocar un lugar, verás un botón **"IR AHORA 🚶"**. Esto activará el modo navegación, dibujando la ruta a pie y avisándote con una notificación cuando estés a menos de 30 metros de tu destino.

### <a id="info-transporte"></a>ℹ️ Información de Transporte

Tu guía completa con todos los datos estáticos y oficiales de la red.

1. **Selección de Modo:** Elige entre **Metro**, **Bus Urbano** o **Interurbano** desde el menú principal.
2. **Selección de Línea:** Accede al listado completo de líneas con sus colores oficiales para identificar rápidamente la tuya.
3. **Herramientas de Detalle:** Una vez dentro de una línea, dispones de 4 opciones:

   - **🗺️ Ruta en Mapa:** Visualiza el trazado exacto de la línea. Toca los marcadores de las paradas para ver su nombre y **conexiones de transbordo** con otras líneas.
   - **📋 Ruta en Lista:** Consulta la secuencia ordenada de paradas, dividida en pestañas de Ida y Vuelta.
   - **💶 Tarifas:** Revisa los precios actualizados para 2025, tipos de billetes y descuentos por tarjeta.
   - **🕒 Horarios:** Consulta las horas de salida del primer y último servicio. _Nota: Las líneas Búho muestran un diseño especial con sus frecuencias nocturnas._

### <a id="precios-de-gasolineras"></a>⛽ Precios de Gasolineras

Este módulo te permite ahorrar encontrando el combustible más barato o la estación más cercana en Granada.

1. **Modos de Visualización**

- **Modo Mapa (Por defecto):** Si no seleccionas combustible, verás los logotipos de todas las gasolineras para orientarte.
- **Modo Precios:** Al seleccionar un combustible (ej: _Gasolina sin plomo 95_), los iconos cambiarán para mostrar el precio por litro.

2. **Uso de Filtros**

1. **Tipo de Combustible:** Selecciona primero qué necesitas repostar. Es obligatorio para ver precios.
1. **Filtrar por Marca:** (Opcional) Puedes limpiar el mapa para ver solo gasolineras de una franquicia concreta (ej: solo _Repsol_ o _Shell_).
1. **Botones Rápidos:**

   - **💶 TOP 3 BARATAS:** Localiza y destaca en verde las 3 estaciones más económicas de la ciudad.
   - **📍 TOP 5 CERCANAS:** Usa tu GPS para encontrar las 5 estaciones más próximas (radio máx. 3km) y te indica la distancia.

1. **Código de Colores (Semáforo)**

El sistema calcula la media de precios en pantalla y colorea las etiquetas:

- 🟢 **Verde:** Precio excelente (Muy barato).
- 🟠 **Amarillo/Naranja:** Precio estándar/medio.
- 🔴 **Rojo:** Precio elevado (Caro).

4. **Navegación GPS**

1. Toca cualquier gasolinera para abrir su ficha.
1. Pulsa el botón **"🚗 IR ALLÍ"**.
1. Se trazará una ruta azul en el mapa desde tu posición.
1. Conduce siguiendo la línea; la app actualizará tu posición en tiempo real y te avisará cuando llegues al destino.
1. Puedes cancelar la navegación pulsando el botón rojo flotante **"Cancelar Ruta"**.

### <a id="parkings"></a>🅿️ Estado de Parkings

Evita dar vueltas innecesarias consultando la ocupación de los parkings públicos (Violón, San Agustín, Triunfo, etc.) antes de llegar.

1. **Tabla en Tiempo Real:**
   Consulta el listado para ver el número exacto de plazas libres.

   - 🟢 **Disponible:** Plazas suficientes.
   - 🟠 **Últimas:** Menos de 20 plazas libres.
   - 🔴 **Completo:** No hay disponibilidad o el recinto está cerrado.

2. **Mapa Interactivo:**
   Los marcadores en el mapa cambian de color según su estado actual para que identifiques las mejores opciones de un vistazo.

3. **Herramienta de Localización:**
   ¿Ves un parking con sitio en la tabla pero no sabes dónde está? Pulsa el botón azul con la flecha/chincheta (📍) situado junto al nombre del parking. El mapa hará zoom automáticamente y se centrará en esa ubicación.

4. **Refresco de Datos:**
   Pulsa el botón **"Actualizar Datos"** arriba a la derecha para volver a descargar la información más reciente desde el servidor.

### <a id="cultura"></a>🎭 Cultura y Ocio

Descubre qué hacer en Granada con una agenda siempre actualizada que combina múltiples fuentes oficiales.

1. **Auto-Carga Inteligente:**
   Al entrar, la app escanea las fuentes oficiales y elimina automáticamente los eventos caducados.

2. **Herramientas de Búsqueda:**

   - **Buscador por Texto:** Escribe "Jazz", "Lorca" o "Infantil" para filtrar la lista instantáneamente.
   - **Selector de Categorías:** Usa el desplegable para aislar tipos de eventos específicos (Música, Exposiciones, Literatura...).

3. **Lectura de Tarjetas:**
   La interfaz adapta el diseño según la fuente para ofrecerte la mejor información disponible:

   - **Eventos con Imagen:** Se muestran con la carátula oficial del evento a la izquierda.
   - **Eventos sin Imagen:** Muestran un bloque distintivo con la fecha destacada.
   - **Etiquetas:** Identifica rápidamente si es gratuito, el horario y el lugar.

4. **Acceso a Fuente:**
   Para comprar entradas o leer la nota de prensa completa, pulsa el botón **"🔗 Ver Noticia Original"**, que te llevará a la web oficial del organizador en una nueva pestaña sin cerrar la app.

### <a id="configuracion"></a>⚙️ Configuración y Privacidad

- **Modo Oscuro:** Toca la luna/sol (🌙/☀️) arriba a la derecha. Todo el mapa (incluyendo los popups de las paradas) se adaptará para no deslumbrarte de noche.
- **Idioma:** Puedes cambiar entre Español e Inglés al instante.
- **Cookies:** La app incluye un gestor de consentimiento. Solo se activan las cookies de traducción (Google Translate) si das tu permiso explícito.

## <a id="tecnologias"></a>🛠️ Tecnologías Utilizadas

El proyecto está construido utilizando tecnologías web estándar sin necesidad de compiladores complejos, lo que facilita su despliegue y edición.

- **HTML5 & CSS3:** Estructura semántica y estilos modernos.
- **JavaScript (ES6+):** Lógica completa de la aplicación (SPA).
- **[TailwindCSS](https://tailwindcss.com/):** Framework de utilidades CSS (cargado vía CDN).
- **[Leaflet.js](https://leafletjs.com/):** Librería para mapas interactivos.
- **[Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/):** Motor de cálculo de rutas (OSRM).
- **APIs Externas:**
  - `movgr.apis.mianfg.me`: Datos de transporte en tiempo real.
  - Movilidad Granada: Datos de incidencias de tráfico (procesados vía Proxy).
  - OpenStreetMap: Capas de mapas.

## <a id="legal"></a>⚖️ Aviso Legal y Privacidad

### 1. Identificación (LSSI)

En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa que este sitio web acepta donaciones y es gestionado por:

- **Titular:** Javier Martín Herrera
- **NIF/DNI:** 77964557P
- **Domicilio/Contacto:** contacto.granago@gmail.com

### 2. Privacidad y Protección de Datos

**GranáGo** está diseñada bajo el principio de "Privacidad por Diseño".

- **Ubicación (GPS):** La aplicación solicita acceso a tu ubicación para trazar rutas y mostrar tu posición en el mapa. **Estos datos NO se envían a ningún servidor.** Se procesan exclusivamente en tu dispositivo móvil.
- **Datos del Coche:** La ubicación de tu aparcamiento se guarda en el **almacenamiento local (LocalStorage)** de tu navegador. Nadie más tiene acceso a ella y se borra si limpias la caché.
- **Cookies:** Utilizamos el servicio de **Google Translate** para ofrecer multiidioma, el cual puede instalar cookies técnicas de terceros. Al usar la web, aceptas este funcionamiento.

### 3. Propiedad Intelectual

- Los datos de transporte provienen de fuentes públicas y APIs de terceros.
- Los iconos y recursos gráficos pertenecen a sus respectivos autores o licencias libres.
- El código fuente de este proyecto es Open Source.

<p align="center">
  © 2025 <strong>GranáGo</strong>. Todo el proyecto, contenido y marca quedan registrados a nombre de GranáGo.
</p>
