import json
import re
import os
from pypdf import PdfReader

# ================= CONFIGURACIÓN =================
ARCHIVO_PDF = "raw_data/radares.pdf"
ARCHIVO_GEOJSON = "raw_data/pks.geojson"
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
        
        if geom['type'] == 'Point' and 'pk' in props:
            ref = props.get('ref', '').replace(" ", "").replace("-", "").upper()
            pk = float(props['pk'])
            coords = geom['coordinates']
            
            if ref:
                if ref not in pks_map: pks_map[ref] = {}
                pks_map[ref][pk] = coords
            
    return pks_map

def obtener_tramo_coords(pks_map, ref, inicio, fin):
    if ref not in pks_map: return None
    todos_pks = sorted(pks_map[ref].keys())
    coords = []
    
    # Aseguramos orden correcto
    p_min, p_max = min(inicio, fin), max(inicio, fin)

    for pk in todos_pks:
        if p_min <= pk <= p_max:
            coords.append(pks_map[ref][pk])
            
    if len(coords) < 2: return None
    return coords

def procesar():
    mapa_geo = cargar_pks_geojson(ARCHIVO_GEOJSON)
    if not mapa_geo: return

    print("📄 Leyendo PDF...")
    texto_pdf = leer_pdf_texto(ARCHIVO_PDF)
    
    # --- REGEX ACTUALIZADA ---
    # 1. Permite "Radar de Tramo" además de Fijo/Móvil
    # 2. En el grupo del PK, permite parentesis '(', ')' y la letra 'm'
    patron = re.compile(r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)\s+([A-Za-z0-9\-]+)\s+(Radar\s(?:Fijo|Móvil|de\sTramo))\s+([0-9\.\,\-\s\(\)m]+)\s+(Creciente|Decreciente|Ambos)')
    
    matches = patron.findall(texto_pdf)
    print(f"🔍 Filas encontradas (Fijos + Móviles + Tramo): {len(matches)}")
    
    features = []
    
    for m in matches:
        provincia, ctra_raw, tipo_raw, pk_raw, sentido = m
        
        if "Granada" not in provincia: continue

        ref = ctra_raw.replace(" ", "").replace("-", "").upper()
        feature = None
        
        # --- CASO 1: RADAR DE TRAMO ---
        # Formato esperado: "10.02 (1.877 m)"
        if "Tramo" in tipo_raw:
            # Buscamos: numero flotante + parentesis + numero + m
            match_tramo = re.search(r'([\d\.]+)\s*\(([\d\.]+)\s*m\)', pk_raw)
            if match_tramo:
                pk_inicio = float(match_tramo.group(1))
                metros = float(match_tramo.group(2).replace('.', '')) # Cuidado con el punto de miles si existe
                
                # A veces el PDF pone 1.877 m significando 1km y 800m.
                # Si el numero es pequeño (ej 1.8) son km? No, la DGT suele poner metros.
                # Asumiremos que el punto es decimal si es pequeño, o miles si es grande.
                # Ajuste simple: convertir metros a KM para sumar al PK
                distancia_km = metros / 1000.0
                if metros < 10.0: # Corrección por si pone km en vez de m
                     distancia_km = metros 
                
                pk_fin = pk_inicio + distancia_km
                
                coords = obtener_tramo_coords(mapa_geo, ref, pk_inicio, pk_fin)
                if coords:
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": "LineString", "coordinates": coords },
                        "properties": {
                            "road": ctra_raw,
                            "type": "tramo",
                            "tramo": f"{pk_inicio} - {round(pk_fin, 2)}",
                            "sentido": sentido,
                            "desc": f"Radar de Tramo ({metros} m)"
                        }
                    }

        # --- CASO 2: RADAR MÓVIL (Rango explícito) ---
        elif "Móvil" in tipo_raw:
            numeros = re.findall(r"[\d\.]+", pk_raw)
            pks = [float(n.rstrip('.')) for n in numeros if n != '.']
            if len(pks) >= 2:
                coords = obtener_tramo_coords(mapa_geo, ref, min(pks), max(pks))
                if coords:
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": "LineString", "coordinates": coords },
                        "properties": {
                            "road": ctra_raw,
                            "type": "movil",
                            "tramo": f"{min(pks)}-{max(pks)}",
                            "sentido": sentido,
                            "desc": "Radar Móvil Frecuente"
                        }
                    }

        # --- CASO 3: RADAR FIJO (Punto único) ---
        elif "Fijo" in tipo_raw:
            numeros = re.findall(r"[\d\.]+", pk_raw)
            if numeros:
                pk_obj = float(numeros[0].rstrip('.'))
                if ref in mapa_geo:
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

        if feature:
            features.append(feature)

    output = { "type": "FeatureCollection", "features": features }
    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
        
    print(f"✅ FINALIZADO: {len(features)} radares (Fijos, Móviles y Tramos) guardados.")

if __name__ == "__main__":
    procesar()