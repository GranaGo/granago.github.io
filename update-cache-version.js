const fs = require("fs");
const path = require("path");

// Definir rutas de los archivos
const swPath = path.join(__dirname, "sw.js");
const indexPath = path.join(__dirname, "index.html");

// Leer contenidos
let swContent = fs.readFileSync(swPath, "utf8");
let indexContent = fs.readFileSync(indexPath, "utf8");

// 1. ENCONTRAR Y CALCULAR NUEVA VERSIÓN
// Busca patrón: const CACHE_VERSION = 'v6.4';
const versionRegex = /const CACHE_VERSION = ["']v(\d+)\.(\d+)["'];/;
const match = swContent.match(versionRegex);

if (match) {
  let major = parseInt(match[1]);
  let minor = parseInt(match[2]);

  // Incrementar versión (ej: 6.4 -> 6.5)
  minor += 1;
  if (minor >= 10) {
    major += 1;
    minor = 0;
  }

  const newVersion = `v${major}.${minor}`;
  console.log(`♻️  Actualizando versión: ${match[0]} -> ${newVersion}`);

  // 2. ACTUALIZAR SW.JS
  const newSwContent = swContent.replace(
    versionRegex,
    `const CACHE_VERSION = '${newVersion}';`
  );
  fs.writeFileSync(swPath, newSwContent);
  console.log("✅ sw.js actualizado.");

  // 3. ACTUALIZAR INDEX.HTML (CACHE BUSTING)
  // Expresión regular para encontrar styles.css y main.js con o sin parámetros previos
  // Busca: src="js/main.js" o src="js/main.js?v=6.4"

  // Actualizar CSS
  const cssRegex = /(href=["']css\/styles\.css)(?:\?v=[^"']*)?(["'])/g;
  if (cssRegex.test(indexContent)) {
    indexContent = indexContent.replace(cssRegex, `$1?v=${newVersion}$2`);
    console.log("   -> CSS actualizado en index.html");
  } else {
    console.warn(
      "   ⚠️ No se encontró el enlace a css/styles.css en index.html"
    );
  }

  // Actualizar JS
  const jsRegex = /(src=["']js\/main\.js)(?:\?v=[^"']*)?(["'])/g;
  if (jsRegex.test(indexContent)) {
    indexContent = indexContent.replace(jsRegex, `$1?v=${newVersion}$2`);
    console.log("   -> JS actualizado en index.html");
  } else {
    console.warn("   ⚠️ No se encontró el script js/main.js en index.html");
  }

  // Guardar index.html
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✅ index.html actualizado a la versión ${newVersion}`);
} else {
  console.error(
    '❌ ERROR: No se encontró el patrón "const CACHE_VERSION = ..." en sw.js'
  );
}
