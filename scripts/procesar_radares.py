import json
import re
import os
from pypdf import PdfReader

# ================= CONFIGURACIÓN =================
ARCHIVO_PDF = "raw_data/radares.pdf"
ARCHIVO_GEOJSON = "raw_data/pks.geojson"
ARCHIVO_SALIDA = "data/radares.json"

def leer_pdf_robusto(ruta_pdf):
    """Lee el PDF y devuelve todo el texto junto para buscar patrones globales."""
    if not os.path.exists(ruta_pdf):
        print(f"❌ ERROR: No existe el archivo {ruta_pdf}")
        return ""
    
    reader = PdfReader(ruta_pdf)
    texto_completo = ""
    for page in reader.pages:
        texto_completo += page.extract_text() + "\n"
    
    return texto_completo

def cargar_pks_geojson(ruta_geojson):
    """Carga SOLO los puntos kilométricos del GeoJSON."""
    print(f"📍 Leyendo GeoJSON: {ruta_geojson}")
    with open(ruta_geojson, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    pks_map = {}
    count_pks = 0
    
    for feature in data.get('features', []):
        geom = feature.get('geometry', {})
        props = feature.get('properties', {})
        
        # IMPORTANTE: Ignoramos 'LineString', solo queremos 'Point' con 'pk'
        if geom['type'] == 'Point' and 'pk' in props:
            ref = props.get('ref', 'Desconocida').replace(" ", "").replace("-", "").upper()
            pk = float(props['pk'])
            coords = geom['coordinates']
            
            if ref not in pks_map:
                pks_map[ref] = {}
            pks_map[ref][pk] = coords
            count_pks += 1
            
    print(f"   -> Encontrados {count_pks} puntos kilométricos (PKs) para referencia.")
    return pks_map

def obtener_tramo(pks_map, ref, inicio, fin):
    if ref not in pks_map: return None
    # Recolectar coordenadas entre inicio y fin
    pks = sorted([k for k in pks_map[ref].keys() if inicio <= k <= fin])
    if len(pks) < 2: return None
    return [pks_map[ref][k] for k in pks]

def procesar():
    # 1. Cargar Mapa Base
    mapa_geo = cargar_pks_geojson(ARCHIVO_GEOJSON)
    if not mapa_geo:
        print("⚠️ ALERTA: No se cargaron PKs del GeoJSON. Revisa si el archivo tiene 'Point' con propiedad 'pk'.")
    
    # 2. Leer PDF
    print("📄 Leyendo PDF...")
    texto_pdf = leer_pdf_robusto(ARCHIVO_PDF)
    
    # DEBUG: Mostrar un poco del texto para ver qué está leyendo
    print("--- INICIO MUESTRA TEXTO PDF ---")
    print(texto_pdf[:300].replace('\n', ' | ')) 
    print("--- FIN MUESTRA ---")

    # 3. Extraer Radares con Regex Mejorado
    # Busca: "Provincia","Carretera","Tipo","PK","Sentido"
    # Permite espacios extra alrededor de las comas y comillas
    patron = re.compile(r'"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"')
    
    matches = patron.findall(texto_pdf)
    print(f"🔍 Encontradas {len(matches)} filas potenciales en el PDF.")

    features = []
    
    for m in matches:
        provincia, carretera, tipo, pk_txt, sentido = m
        
        # Filtro Granada
        if "GRANADA" not in provincia.upper():
            continue
            
        ref = carretera.replace(" ", "").replace("-", "").upper() # Ej: N432
        
        # Extraer números del PK
        nums = re.findall(r"[\d\.]+", pk_txt)
        pks_vals = []
        try:
            pks_vals = [float(n) for n in nums if n != '.']
        except:
            continue
            
        if not pks_vals: continue
        
        feature = None
        
        # Lógica de emparejamiento
        # A) Radar Fijo (Punto)
        if "FIJO" in tipo.upper() or len(pks_vals) == 1:
            pk_target = pks_vals[0]
            if ref in mapa_geo:
                # Buscar el PK más cercano disponible en el mapa (max 2km diferencia)
                closest = min(mapa_geo[ref].keys(), key=lambda k: abs(k-pk_target))
                if abs(closest - pk_target) < 2.0:
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": "Point", "coordinates": mapa_geo[ref][closest] },
                        "properties": {
                            "road": carretera,
                            "type": "fijo",
                            "pk": pk_target,
                            "desc": f"Radar Fijo - {carretera} PK {pk_target}"
                        }
                    }
        
        # B) Radar Móvil (Tramo)
        elif len(pks_vals) >= 2:
            start, end = min(pks_vals), max(pks_vals)
            coords = obtener_tramo(mapa_geo, ref, start, end)
            if coords:
                feature = {
                    "type": "Feature",
                    "geometry": { "type": "LineString", "coordinates": coords },
                    "properties": {
                        "road": carretera,
                        "type": "movil",
                        "tramo": f"{start}-{end}",
                        "desc": f"Radar Móvil - {carretera}"
                    }
                }
        
        if feature:
            features.append(feature)

    # 4. Guardar
    output = { "type": "FeatureCollection", "features": features }
    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(output, f)
        
    print(f"✅ FINALIZADO: {len(features)} radares guardados en {ARCHIVO_SALIDA}")

if __name__ == "__main__":
    procesar()