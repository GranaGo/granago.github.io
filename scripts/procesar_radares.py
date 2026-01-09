import json
import re
import os
from pypdf import PdfReader

# ================= CONFIGURACIÓN =================
ARCHIVO_PDF = "raw_data/radares.pdf"
ARCHIVO_VIALES = "raw_data/BTN0605L_CARRETERA.json" 
ARCHIVO_PKS = "raw_data/BTN0618P_KIL_CARR.json"     
ARCHIVO_SALIDA = "data/radares.json"

# Offset manual por si alguna carretera antigua (como la GR-30) 
# sigue usando kilometraje viejo en el PDF de la DGT.
OFFSETS_PKS = {
    "GR30": 116.0 
}

def leer_pdf_aplanado(ruta_pdf):
    if not os.path.exists(ruta_pdf): return ""
    reader = PdfReader(ruta_pdf)
    texto = ""
    for page in reader.pages:
        texto += page.extract_text() + " "
    return re.sub(r'\s+', ' ', texto)

def cargar_mapa_ign(ruta_viales, ruta_pks):
    print("📍 Cargando Cartografía Oficial del IGN...")
    
    # 1. Mapear ID_VIAL -> Nombre Carretera (ej: 12345 -> "A-44")
    id_a_nombre = {}
    try:
        with open(ruta_viales, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for feat in data.get('features', []):
                props = feat.get('properties', {})
                id_vial = props.get('ID_VIAL')
                nombre = props.get('NOMBRE')
                
                if id_vial and nombre:
                    # Normalizamos: "N-323a " -> "N323A"
                    nombre_norm = nombre.replace(" ", "").replace("-", "").upper()
                    id_a_nombre[id_vial] = nombre_norm
    except Exception as e:
        print(f"❌ Error leyendo viales: {e}")
        return {}

    print(f"   -> Identificadas {len(id_a_nombre)} carreteras.")

    # 2. Asignar Coordenadas a cada PK
    pks_map = {}
    count_pks = 0
    
    try:
        with open(ruta_pks, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for feat in data.get('features', []):
                props = feat.get('properties', {})
                geom = feat.get('geometry', {})
                
                id_vial = props.get('ID_VIAL')
                pk_val = float(props.get('PK_0618', 0)) # El PK oficial (ej: 14)
                
                if id_vial in id_a_nombre and geom['type'] == 'Point':
                    nombre_carr = id_a_nombre[id_vial]
                    coords = geom['coordinates'] # [lon, lat]
                    
                    if nombre_carr not in pks_map:
                        pks_map[nombre_carr] = {}
                    
                    # Guardamos la coordenada para ese PK
                    pks_map[nombre_carr][pk_val] = coords
                    count_pks += 1
                    
    except Exception as e:
        print(f"❌ Error leyendo PKs: {e}")
        return {}

    print(f"   -> Georreferenciados {count_pks} puntos kilométricos.")
    return pks_map

def buscar_pk_cercano(pks_disponibles, pk_objetivo, margen=2.0):
    """Busca el PK más cercano en el mapa (Nearest Neighbor)"""
    if not pks_disponibles: return None
    pk_mas_cercano = min(pks_disponibles.keys(), key=lambda k: abs(k - pk_objetivo))
    
    # Si la distancia es razonable (menos de 'margen' km), lo aceptamos
    if abs(pk_mas_cercano - pk_objetivo) <= margen:
        return pks_disponibles[pk_mas_cercano]
    return None

def obtener_tramo_coords(pks_map, ref, inicio, fin):
    if ref not in pks_map: return None
    offset = OFFSETS_PKS.get(ref, 0.0)
    inicio_map, fin_map = inicio + offset, fin + offset
    
    coords = []
    pks_ordenados = sorted(pks_map[ref].keys())
    
    # Recolectar todos los puntos entre Inicio y Fin
    for pk in pks_ordenados:
        # Margen de 0.5km para asegurar cobertura en bordes
        if min(inicio_map, fin_map) - 0.5 <= pk <= max(inicio_map, fin_map) + 0.5:
            coords.append(pks_map[ref][pk])
            
    # Si no hay puntos intermedios, devolvemos al menos el punto de inicio
    if len(coords) < 2:
        res = buscar_pk_cercano(pks_map[ref], inicio_map, margen=5.0)
        if res: return [res] # Un solo punto
        return None
    
    return coords

def procesar():
    mapa_geo = cargar_mapa_ign(ARCHIVO_VIALES, ARCHIVO_PKS)
    if not mapa_geo: return

    print("📄 Leyendo Radares del PDF...")
    texto_limpio = leer_pdf_aplanado(ARCHIVO_PDF)
    
    # Regex flexible para capturar líneas
    patron = re.compile(r'Granada\s+([A-Z0-9\-]+)\s+(Radar\s+[^\d]+)([\d\.\,\-\s\(\)m]+)\s+(Creciente|Decreciente|Ambos)', re.IGNORECASE)
    matches = patron.findall(texto_limpio)
    
    features = []
    ignorados = []
    
    for m in matches:
        ctra_raw, tipo_txt, pk_raw, sentido = m
        ref = ctra_raw.replace(" ", "").replace("-", "").upper()
        
        feature = None
        motivo = ""

        # Ver si existe la carretera en nuestros datos oficiales
        if ref not in mapa_geo:
            ignorados.append(f"{ctra_raw}: No encontrada en IGN")
            continue

        # --- CASO A: TRAMO (ej: 10.5 (1.800 m)) ---
        if "tramo" in tipo_txt.lower() or "(" in pk_raw:
            match = re.search(r'([\d\.]+)\s*\(([\d\.]+)\s*m\)', pk_raw)
            if match:
                inicio = float(match.group(1))
                dist = float(match.group(2))
                fin = inicio + (dist / 1000.0 if dist > 100 else dist)
                
                coords = obtener_tramo_coords(mapa_geo, ref, inicio, fin)
                if coords:
                    g_type = "LineString" if len(coords) > 1 else "Point"
                    g_coords = coords if len(coords) > 1 else coords[0]
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": g_type, "coordinates": g_coords },
                        "properties": { "road": ctra_raw, "type": "tramo", "tramo": f"{inicio}-{round(fin,2)}", "sentido": sentido, "desc": f"Radar Tramo {dist}m" }
                    }
                else: motivo = "Sin coordenadas en rango"

        # --- CASO B: MÓVIL (ej: 10 - 20) ---
        elif "-" in pk_raw:
            nums = re.findall(r"[\d\.]+", pk_raw)
            pks = [float(n.rstrip('.')) for n in nums if n != '.']
            if len(pks) >= 2:
                inicio, fin = min(pks), max(pks)
                coords = obtener_tramo_coords(mapa_geo, ref, inicio, fin)
                if coords:
                    g_type = "LineString" if len(coords) > 1 else "Point"
                    g_coords = coords if len(coords) > 1 else coords[0]
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": g_type, "coordinates": g_coords },
                        "properties": { "road": ctra_raw, "type": "movil", "tramo": f"{inicio}-{fin}", "sentido": sentido, "desc": "Radar Móvil" }
                    }
                else: motivo = "Rango sin datos"

        # --- CASO C: FIJO (ej: 14.5) ---
        else:
            nums = re.findall(r"[\d\.]+", pk_raw)
            if nums:
                pk_val = float(nums[0].rstrip('.'))
                pk_mapa = pk_val + OFFSETS_PKS.get(ref, 0.0)
                coords = buscar_pk_cercano(mapa_geo[ref], pk_mapa)
                if coords:
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": "Point", "coordinates": coords },
                        "properties": { "road": ctra_raw, "type": "fijo", "pk": pk_val, "sentido": sentido, "desc": f"Radar Fijo PK {pk_val}" }
                    }
                else: motivo = f"PK {pk_val} no encontrado"

        if feature:
            features.append(feature)
        elif motivo:
            ignorados.append(f"{ctra_raw} {pk_raw}: {motivo}")

    # Guardar JSON
    salida = { "type": "FeatureCollection", "features": features }
    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False)
        
    print(f"✅ ¡LISTO! {len(features)} radares generados con precisión oficial.")
    if ignorados:
        print(f"⚠️ {len(ignorados)} ignorados. (Probablemente fuera de la provincia o datos erróneos en PDF)")

if __name__ == "__main__":
    procesar()