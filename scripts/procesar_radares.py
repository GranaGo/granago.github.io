import json
import re
import os
import math
from pypdf import PdfReader

# ================= CONFIGURACIÓN =================
# Rutas relativas a la raíz del repo (como se ejecutan en GitHub Actions)
ARCHIVO_PDF = "raw_data/radares.pdf"
ARCHIVO_GEOJSON = "raw_data/pks_carr_granada.geojson"
ARCHIVO_SALIDA = "data/radares.json"

def extraer_datos_pdf(ruta_pdf):
    """
    Lee el PDF y extrae las filas basándose en el patrón de comillas del documento.
    Formato detectado: "PROVINCIA","CARRETERA","TIPO","PK","SENTIDO",...
    """
    if not os.path.exists(ruta_pdf):
        print(f"⚠️ No se encontró el PDF en {ruta_pdf}")
        return []

    reader = PdfReader(ruta_pdf)
    datos_limpios = []
    
    # Regex para capturar filas que parecen CSV: "Texto","Texto","Texto"...
    # Captura 5 grupos principales: Provincia, Ctra, Tipo, PK, Sentido
    patron_fila = re.compile(r'"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"')

    for page in reader.pages:
        texto = page.extract_text()
        # Procesamos línea a línea
        for linea in texto.split('\n'):
            match = patron_fila.search(linea)
            if match:
                datos_limpios.append({
                    "provincia": match.group(1).strip(),
                    "carretera": match.group(2).strip().replace(" ", "").upper(), # Normalizamos: A-92 -> A92
                    "tipo": match.group(3).strip(),
                    "pk_texto": match.group(4).strip(),
                    "sentido": match.group(5).strip()
                })
    return datos_limpios

def cargar_geometria_carreteras(ruta_geojson):
    """
    Carga el GeoJSON y crea un índice de coordenadas por carretera y PK.
    Retorna: { "A92": { 10.5: [lon, lat], 11.0: [lon, lat]... } }
    """
    if not os.path.exists(ruta_geojson):
        print(f"⚠️ No se encontró GeoJSON en {ruta_geojson}")
        return {}

    with open(ruta_geojson, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)

    mapa_carreteras = {}

    for feature in geo_data.get('features', []):
        props = feature.get('properties', {})
        geom = feature.get('geometry', {})
        
        # Solo nos sirven los Puntos con PK definido
        if geom['type'] == 'Point' and 'pk' in props and 'ref' in props:
            # Normalización agresiva para asegurar coincidencia (GR-30 vs GR 30)
            nombre_ctra = props['ref'].replace(" ", "").replace("-", "").upper()
            try:
                pk = float(props['pk'])
                coords = geom['coordinates'] # [lon, lat]
                
                if nombre_ctra not in mapa_carreteras:
                    mapa_carreteras[nombre_ctra] = {}
                
                mapa_carreteras[nombre_ctra][pk] = coords
            except ValueError:
                continue
                
    return mapa_carreteras

def obtener_tramo_coords(mapa_pks, ctra, inicio, fin):
    """Obtiene las coordenadas para dibujar la línea de un radar móvil (tramo)."""
    if ctra not in mapa_pks:
        return None
    
    pks_disponibles = sorted(mapa_pks[ctra].keys())
    coords = []
    
    # Coger todos los puntos que caigan dentro del rango del radar
    for pk in pks_disponibles:
        if inicio <= pk <= fin:
            coords.append(mapa_pks[ctra][pk])
            
    # Si tenemos puntos, devolvemos la línea. Si no, intentamos aproximar los extremos.
    if len(coords) < 2:
        return None 
        
    return coords

def procesar_radares():
    print("📍 1. Indexando carreteras de Granada...")
    mapa_geo = cargar_geometria_carreteras(ARCHIVO_GEOJSON)
    
    print("📄 2. Leyendo PDF de la DGT...")
    lista_radares = extraer_datos_pdf(ARCHIVO_PDF)
    
    features_output = []
    
    print(f"🔄 3. Cruzando datos ({len(lista_radares)} registros encontrados)...")
    
    for item in lista_radares:
        # 1. Filtro: Solo Granada
        if "GRANADA" not in item['provincia'].upper():
            continue
            
        # Normalizar nombre para buscar en nuestro mapa
        ctra_ref = item['carretera'].replace("-", "") # A-92 -> A92
        
        # Extraer números del PK (puede ser "150.5" o "10.0-20.0")
        numeros = re.findall(r"[\d\.]+", item['pk_texto'])
        try:
            pks_valores = [float(n) for n in numeros if n != '.']
        except:
            continue
            
        if not pks_valores:
            continue

        feature = None
        
        # --- CASO A: RADAR FIJO (Un solo punto) ---
        if "FIJO" in item['tipo'].upper() or len(pks_valores) == 1:
            pk_objetivo = pks_valores[0]
            
            # Buscar coincidencia en el mapa
            if ctra_ref in mapa_geo:
                pks_carretera = mapa_geo[ctra_ref]
                # Encontrar el PK más cercano (Nearest Neighbor)
                pk_mas_cercano = min(pks_carretera.keys(), key=lambda k: abs(k - pk_objetivo))
                
                # Si la diferencia es menor a 3km, lo aceptamos (los PKs a veces varían)
                if abs(pk_mas_cercano - pk_objetivo) < 3.0:
                    coords = pks_carretera[pk_mas_cercano]
                    feature = {
                        "type": "Feature",
                        "geometry": { "type": "Point", "coordinates": coords },
                        "properties": {
                            "carretera": item['carretera'], # Nombre original bonito
                            "tipo": "fijo",
                            "pk": pk_objetivo,
                            "sentido": item['sentido'],
                            "desc": f"Radar Fijo PK {pk_objetivo}"
                        }
                    }

        # --- CASO B: RADAR MÓVIL (Tramo) ---
        elif len(pks_valores) >= 2:
            inicio, fin = min(pks_valores), max(pks_valores)
            
            # Intentar construir la geometría de la línea
            # Probamos variaciones del nombre si no existe (ej. GR30 vs GR-30)
            coords_linea = obtener_tramo_coords(mapa_geo, ctra_ref, inicio, fin)
            
            if coords_linea:
                feature = {
                    "type": "Feature",
                    "geometry": { "type": "LineString", "coordinates": coords_linea },
                    "properties": {
                        "carretera": item['carretera'],
                        "tipo": "movil",
                        "tramo": f"{inicio} - {fin}",
                        "sentido": item['sentido'],
                        "desc": f"Radar Móvil ({inicio}-{fin})"
                    }
                }

        if feature:
            features_output.append(feature)

    # Guardar JSON final
    salida = { "type": "FeatureCollection", "features": features_output }
    
    # Asegurar que el directorio existe
    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False)
        
    print(f"✅ ¡Éxito! Se han generado {len(features_output)} radares en {ARCHIVO_SALIDA}")

if __name__ == "__main__":
    procesar_radares()