import json
import re
import os
from pypdf import PdfReader

# ================= CONFIGURACIÓN =================
ARCHIVO_PDF = "raw_data/radares.pdf"
ARCHIVO_GEOJSON = "raw_data/pks.geojson"
ARCHIVO_SALIDA = "data/radares.json"

# Corrección de desfases de kilometraje (DGT vs Mapas antiguos)
# Si el mapa tiene PKs antiguos (ej. GR-30 empezando en 116), ajustamos aquí.
OFFSETS_PKS = {
    "GR30": 116.0  # La DGT dice PK 10, el mapa tiene PK 126 (10+116)
}

def leer_pdf_aplanado(ruta_pdf):
    if not os.path.exists(ruta_pdf): return ""
    reader = PdfReader(ruta_pdf)
    texto = ""
    for page in reader.pages:
        texto += page.extract_text() + " "
    # Aplanar saltos de línea para que "10.02 \n (1.877 m)" sea legible
    return re.sub(r'\s+', ' ', texto)

def cargar_pks_geojson(ruta_geojson):
    print(f"📍 Leyendo GeoJSON: {ruta_geojson}")
    try:
        with open(ruta_geojson, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except:
        return {}
    
    pks_map = {}
    for feature in data.get('features', []):
        geom = feature.get('geometry', {})
        props = feature.get('properties', {})
        
        if geom['type'] == 'Point' and 'pk' in props:
            ref = props.get('ref', '').replace(" ", "").replace("-", "").upper()
            pk = float(props['pk'])
            coords = geom['coordinates']
            
            if ref:
                if ref not in pks_map: pks_map[ref] = {}
                pks_map[ref][pk] = coords
    return pks_map

def buscar_pk_cercano(pks_disponibles, pk_objetivo, margen=3.0):
    """Devuelve (pk_encontrado, coordenadas) o None"""
    if not pks_disponibles: return None
    pk_mas_cercano = min(pks_disponibles.keys(), key=lambda k: abs(k - pk_objetivo))
    if abs(pk_mas_cercano - pk_objetivo) <= margen:
        return pk_mas_cercano, pks_disponibles[pk_mas_cercano]
    return None

def obtener_tramo_coords(pks_map, ref, inicio, fin):
    if ref not in pks_map: return None
    
    # Aplicar offset si es necesario (ej. GR-30)
    offset = OFFSETS_PKS.get(ref, 0.0)
    inicio_map, fin_map = inicio + offset, fin + offset
    
    coords = []
    pks_ordenados = sorted(pks_map[ref].keys())
    
    for pk in pks_ordenados:
        if min(inicio_map, fin_map) <= pk <= max(inicio_map, fin_map):
            coords.append(pks_map[ref][pk])
            
    # Si no hay puntos suficientes para una línea, intentamos devolver al menos un punto
    if len(coords) < 2:
        # Buscamos el punto más cercano al inicio para no perder el radar
        res = buscar_pk_cercano(pks_map[ref], inicio_map, margen=5.0)
        if res:
            return [res[1]] # Devolvemos lista con 1 solo punto
        return None
        
    return coords

def procesar():
    mapa_geo = cargar_pks_geojson(ARCHIVO_GEOJSON)
    if not mapa_geo: return

    print("📄 Procesando PDF...")
    texto_limpio = leer_pdf_aplanado(ARCHIVO_PDF)
    
    # Regex para capturar todo
    patron = re.compile(r'Granada\s+([A-Z0-9\-]+)\s+(Radar\s(?:Fijo|Móvil|Tramo|de\sTramo))\s+([0-9\.\,\-\s\(\)m]+)\s+(Creciente|Decreciente|Ambos)')
    matches = patron.findall(texto_limpio)
    
    features = []
    
    for m in matches:
        ctra_raw, tipo_raw, pk_raw, sentido = m
        ref = ctra_raw.replace(" ", "").replace("-", "").upper()
        offset = OFFSETS_PKS.get(ref, 0.0)
        
        feature = None
        
        # --- TIPO 1: TRAMO (Con distancia en metros) ---
        if "Tramo" in tipo_raw or "(" in pk_raw:
            match = re.search(r'([\d\.]+)\s*\(([\d\.]+)\s*m\)', pk_raw)
            if match:
                inicio = float(match.group(1))
                dist_raw = float(match.group(2))
                dist_km = dist_raw / 1000.0 if dist_raw > 100 else dist_raw
                fin = inicio + dist_km
                
                coords = obtener_tramo_coords(mapa_geo, ref, inicio, fin)
                
                if coords:
                    geom_type = "LineString" if len(coords) > 1 else "Point"
                    geom_coords = coords if len(coords) > 1 else coords[0]
                    
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": geom_type, "coordinates": geom_coords },
                        "properties": {
                            "road": ctra_raw,
                            "type": "tramo",
                            "tramo": f"{inicio} - {round(fin, 2)}",
                            "sentido": sentido,
                            "desc": f"Radar de Tramo ({dist_raw}m)"
                        }
                    }

        # --- TIPO 2: MÓVIL (Rango A - B) ---
        elif "-" in pk_raw:
            nums = re.findall(r"[\d\.]+", pk_raw)
            pks = [float(n.rstrip('.')) for n in nums if n != '.']
            if len(pks) >= 2:
                inicio, fin = min(pks), max(pks)
                coords = obtener_tramo_coords(mapa_geo, ref, inicio, fin)
                
                if coords:
                    # Si solo hay 1 punto (A-403R3), lo pintamos como punto 'movil'
                    geom_type = "LineString" if len(coords) > 1 else "Point"
                    geom_coords = coords if len(coords) > 1 else coords[0]
                    
                    desc_text = "Radar Móvil Frecuente"
                    if len(coords) == 1: desc_text += " (Inicio tramo)"

                    feature = {
                        "type": "Feature",
                        "geometry": { "type": geom_type, "coordinates": geom_coords },
                        "properties": {
                            "road": ctra_raw,
                            "type": "movil",
                            "tramo": f"{inicio}-{fin}",
                            "sentido": sentido,
                            "desc": desc_text
                        }
                    }

        # --- TIPO 3: FIJO (Punto) ---
        else:
            nums = re.findall(r"[\d\.]+", pk_raw)
            if nums:
                pk_obj = float(nums[0].rstrip('.')) + offset # Aplicamos offset aquí también
                
                if ref in mapa_geo:
                    res = buscar_pk_cercano(mapa_geo[ref], pk_obj)
                    if res:
                        feature = {
                            "type": "Feature",
                            "geometry": { "type": "Point", "coordinates": res[1] },
                            "properties": {
                                "road": ctra_raw,
                                "type": "fijo",
                                "pk": float(nums[0]), # Mostramos el PK original
                                "sentido": sentido,
                                "desc": f"Radar Fijo - PK {nums[0]}"
                            }
                        }

        if feature:
            features.append(feature)

    # Guardar
    output = { "type": "FeatureCollection", "features": features }
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
        
    print(f"✅ ¡LISTO! {len(features)} radares recuperados (incluyendo GR-30 y tramos cortos).")

if __name__ == "__main__":
    procesar()