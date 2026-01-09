import json
import re
import os
from pypdf import PdfReader

# ================= CONFIGURACIÓN =================
ARCHIVO_PDF = "raw_data/radares.pdf"
ARCHIVO_GEOJSON = "raw_data/pks.geojson" # Ajusta si tu ruta es distinta
ARCHIVO_SALIDA = "data/radares.json"

def leer_pdf_texto(ruta_pdf):
    if not os.path.exists(ruta_pdf):
        print(f"❌ ERROR: No existe {ruta_pdf}")
        return ""
    
    reader = PdfReader(ruta_pdf)
    texto_completo = ""
    for page in reader.pages:
        texto_completo += page.extract_text() + "\n"
    return texto_completo

def cargar_pks_geojson(ruta_geojson):
    print(f"📍 Leyendo GeoJSON: {ruta_geojson}")
    try:
        with open(ruta_geojson, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error leyendo GeoJSON: {e}")
        return {}
    
    pks_map = {}
    
    for feature in data.get('features', []):
        geom = feature.get('geometry', {})
        props = feature.get('properties', {})
        
        # Solo procesamos puntos con PK
        if geom['type'] == 'Point' and 'pk' in props:
            # Normalizamos nombre: GR-30 -> GR30
            ref = props.get('ref', '').replace(" ", "").replace("-", "").upper()
            pk = float(props['pk'])
            coords = geom['coordinates']
            
            if ref:
                if ref not in pks_map:
                    pks_map[ref] = {}
                pks_map[ref][pk] = coords
            
    return pks_map

def obtener_tramo_coords(pks_map, ref, inicio, fin):
    """Obtiene coordenadas para línea continua entre dos PKs"""
    if ref not in pks_map: return None
    
    # Obtener todos los PKs ordenados de esa carretera
    todos_pks = sorted(pks_map[ref].keys())
    coords = []
    
    for pk in todos_pks:
        if inicio <= pk <= fin:
            coords.append(pks_map[ref][pk])
            
    # Si tenemos pocos puntos, devolvemos None para no pintar líneas raras
    if len(coords) < 2: return None
    return coords

def procesar():
    # 1. Cargar Mapa
    mapa_geo = cargar_pks_geojson(ARCHIVO_GEOJSON)
    if not mapa_geo:
        print("⚠️ No hay datos geográficos cargados.")
        return

    # 2. Leer PDF
    print("📄 Leyendo PDF...")
    texto_pdf = leer_pdf_texto(ARCHIVO_PDF)
    
    # 3. Nueva Regex basada en tu log:
    # Grupo 1: Provincia (Palabra)
    # Grupo 2: Carretera (Letras, numeros, guiones)
    # Grupo 3: Tipo (Radar Fijo o Movil)
    # Grupo 4: PK (Numeros, puntos, guiones y espacios en medio)
    # Grupo 5: Sentido (Creciente, Decreciente, Ambos)
    
    patron = re.compile(r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)\s+([A-Za-z0-9\-]+)\s+(Radar\s(?:Fijo|Móvil))\s+([\d\.\s\-]+)\s+(Creciente|Decreciente|Ambos)')
    
    matches = patron.findall(texto_pdf)
    print(f"🔍 Filas encontradas con patrón: {len(matches)}")
    
    features = []
    
    for m in matches:
        provincia, ctra_raw, tipo_raw, pk_raw, sentido = m
        
        # Filtro: Solo GRANADA
        if "Granada" not in provincia:
            continue

        # Limpieza de datos
        ref = ctra_raw.replace(" ", "").replace("-", "").upper()
        
        # Extraer números del PK (ej: "17.300 - 34.800" -> [17.3, 34.8])
        numeros = re.findall(r"[\d\.]+", pk_raw)
        try:
            # Convertimos quitando el ultimo punto si lo hay (ej 10. -> 10.0)
            pks = [float(n.rstrip('.')) for n in numeros if n != '.']
        except:
            continue
            
        if not pks: continue
        
        feature = None
        es_fijo = "Fijo" in tipo_raw
        
        # --- CASO A: RADAR FIJO ---
        if es_fijo or len(pks) == 1:
            pk_obj = pks[0]
            if ref in mapa_geo:
                # Buscar PK más cercano (tolerancia 2km)
                closest = min(mapa_geo[ref].keys(), key=lambda k: abs(k - pk_obj))
                if abs(closest - pk_obj) < 2.0:
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": "Point", "coordinates": mapa_geo[ref][closest] },
                        "properties": {
                            "road": ctra_raw,
                            "type": "fijo",
                            "pk": pk_obj,
                            "sentido": sentido,
                            "desc": f"Radar Fijo - PK {pk_obj}"
                        }
                    }

        # --- CASO B: RADAR MÓVIL (TRAMO) ---
        elif len(pks) >= 2:
            start, end = min(pks), max(pks)
            coords = obtener_tramo_coords(mapa_geo, ref, start, end)
            
            if coords:
                feature = {
                    "type": "Feature",
                    "geometry": { "type": "LineString", "coordinates": coords },
                    "properties": {
                        "road": ctra_raw,
                        "type": "movil",
                        "tramo": f"{start}-{end}",
                        "sentido": sentido,
                        "desc": f"Radar Móvil ({start}-{end})"
                    }
                }
        
        if feature:
            features.append(feature)

    # 4. Guardar
    output = { "type": "FeatureCollection", "features": features }
    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
        
    print(f"✅ FINALIZADO: {len(features)} radares de Granada guardados en {ARCHIVO_SALIDA}")

if __name__ == "__main__":
    procesar()