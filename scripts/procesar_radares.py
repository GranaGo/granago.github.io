import json
import re
import os
from pypdf import PdfReader

# ================= CONFIGURACIÓN =================
ARCHIVO_PDF = "raw_data/radares.pdf" # Asegúrate que coincide con el nombre de tu archivo
ARCHIVO_GEOJSON = "raw_data/pks.geojson"      # Asegúrate que coincide con el nombre de tu archivo
ARCHIVO_SALIDA = "data/radares.json"

# Corrección de desfases (DGT dice PK X, Mapa dice PK Y)
OFFSETS_PKS = {
    "GR30": 116.0  # La GR-30 empieza en el 116 en algunos mapas antiguos
}

def leer_pdf_aplanado(ruta_pdf):
    if not os.path.exists(ruta_pdf): return ""
    reader = PdfReader(ruta_pdf)
    texto = ""
    for page in reader.pages:
        texto += page.extract_text() + " "
    # Convertimos todo a texto plano (sin saltos de línea raros)
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
            # Normalizamos nombre: GR-30 -> GR30
            ref = props.get('ref', '').replace(" ", "").replace("-", "").upper()
            pk = float(props['pk'])
            coords = geom['coordinates']
            if ref:
                if ref not in pks_map: pks_map[ref] = {}
                pks_map[ref][pk] = coords
    return pks_map

def buscar_pk_cercano(pks_disponibles, pk_objetivo, margen=3.0):
    if not pks_disponibles: return None
    pk_mas_cercano = min(pks_disponibles.keys(), key=lambda k: abs(k - pk_objetivo))
    if abs(pk_mas_cercano - pk_objetivo) <= margen:
        return pks_disponibles[pk_mas_cercano]
    return None

def obtener_tramo_coords(pks_map, ref, inicio, fin):
    if ref not in pks_map: return None
    offset = OFFSETS_PKS.get(ref, 0.0)
    inicio_map, fin_map = inicio + offset, fin + offset
    
    coords = []
    pks_ordenados = sorted(pks_map[ref].keys())
    
    for pk in pks_ordenados:
        # Permitimos una tolerancia pequeña para capturar puntos en los bordes
        if min(inicio_map, fin_map) - 0.1 <= pk <= max(inicio_map, fin_map) + 0.1:
            coords.append(pks_map[ref][pk])
            
    # Fallback: Si no hay línea, devolvemos al menos un punto (el inicio)
    if len(coords) < 2:
        res = buscar_pk_cercano(pks_map[ref], inicio_map, margen=5.0)
        if res: return [res]
        return None
    return coords

def procesar():
    mapa_geo = cargar_pks_geojson(ARCHIVO_GEOJSON)
    if not mapa_geo: return

    print("📄 Procesando PDF con escáner mejorado...")
    texto_limpio = leer_pdf_aplanado(ARCHIVO_PDF)
    
    # --- REGEX SUPER FLEXIBLE ---
    # 1. Busca "Granada"
    # 2. Coge la carretera (letras/numeros/guiones)
    # 3. Busca "Radar" y CUALQUIER COSA (texto) hasta que llegue un número
    # 4. Coge los números/guiones/parentesis del PK
    # 5. Coge el sentido
    patron = re.compile(r'Granada\s+([A-Z0-9\-]+)\s+(Radar\s+[^\d]+)([\d\.\,\-\s\(\)m]+)\s+(Creciente|Decreciente|Ambos)', re.IGNORECASE)
    
    matches = patron.findall(texto_limpio)
    print(f"🔍 Filas detectadas en el PDF: {len(matches)}")
    
    features = []
    ignorados = []
    
    for m in matches:
        ctra_raw, tipo_txt, pk_raw, sentido = m
        ref = ctra_raw.replace(" ", "").replace("-", "").upper()
        offset = OFFSETS_PKS.get(ref, 0.0)
        
        tipo_lower = tipo_txt.lower()
        feature = None
        motivo_error = "Desconocido"

        # Validar si existe carretera
        if ref not in mapa_geo:
            ignorados.append(f"{ctra_raw} (No existe en GeoJSON)")
            continue

        # --- CASO 1: TRAMO (Paréntesis con metros) ---
        if "tramo" in tipo_lower or "(" in pk_raw:
            match = re.search(r'([\d\.]+)\s*\(([\d\.]+)\s*m\)', pk_raw)
            if match:
                inicio = float(match.group(1))
                dist = float(match.group(2))
                dist_km = dist / 1000.0 if dist > 100 else dist
                fin = inicio + dist_km
                
                coords = obtener_tramo_coords(mapa_geo, ref, inicio, fin)
                if coords:
                    geom_type = "LineString" if len(coords) > 1 else "Point"
                    geom_data = coords if len(coords) > 1 else coords[0]
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": geom_type, "coordinates": geom_data },
                        "properties": {
                            "road": ctra_raw, "type": "tramo",
                            "tramo": f"{inicio} - {round(fin, 2)}",
                            "sentido": sentido, "desc": f"Radar de Tramo ({dist}m)"
                        }
                    }
                else: motivo_error = f"Tramo {inicio}-{fin} sin coordenadas en mapa"

        # --- CASO 2: MÓVIL (Rango A-B) ---
        elif "-" in pk_raw:
            nums = re.findall(r"[\d\.]+", pk_raw)
            pks = [float(n.rstrip('.')) for n in nums if n != '.']
            if len(pks) >= 2:
                inicio, fin = min(pks), max(pks)
                coords = obtener_tramo_coords(mapa_geo, ref, inicio, fin)
                if coords:
                    geom_type = "LineString" if len(coords) > 1 else "Point"
                    geom_data = coords if len(coords) > 1 else coords[0]
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": geom_type, "coordinates": geom_data },
                        "properties": {
                            "road": ctra_raw, "type": "movil",
                            "tramo": f"{inicio}-{fin}",
                            "sentido": sentido, "desc": "Radar Móvil Frecuente"
                        }
                    }
                else: motivo_error = f"Rango {inicio}-{fin} fuera del mapa"

        # --- CASO 3: FIJO (Punto) ---
        else:
            nums = re.findall(r"[\d\.]+", pk_raw)
            if nums:
                pk_val = float(nums[0].rstrip('.'))
                pk_mapa = pk_val + offset
                coords_fijo = buscar_pk_cercano(mapa_geo[ref], pk_mapa)
                
                if coords_fijo:
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": "Point", "coordinates": coords_fijo },
                        "properties": {
                            "road": ctra_raw, "type": "fijo",
                            "pk": pk_val,
                            "sentido": sentido, "desc": f"Radar Fijo PK {pk_val}"
                        }
                    }
                else: motivo_error = f"PK {pk_val} no encontrado en mapa"

        if feature:
            features.append(feature)
        else:
            ignorados.append(f"{ctra_raw} {tipo_txt} {pk_raw} -> {motivo_error}")

    # Guardar
    output = { "type": "FeatureCollection", "features": features }
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
        
    print(f"✅ FINALIZADO: {len(features)} radares exportados.")
    
    if ignorados:
        print("\n⚠️ RADARES IGNORADOS (Revisar):")
        for ig in ignorados:
            print(f" - {ig}")
    else:
        print("\n✨ ¡Perfecto! Se procesaron todos los radares detectados.")

if __name__ == "__main__":
    procesar()