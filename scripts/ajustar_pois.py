import json
from pathlib import Path
import hashlib

INPUT = Path("raw_data/poi.geojson")
OUTPUT = Path("data/poi_final.geojson")

def get_category(tags):
    """Devuelve la categoría exacta según tu lista de POIs"""
    # Amenity
    if "amenity" in tags:
        amenity_map = {
            "parking": "Parking",
            "bus_station": "Estación de Autobuses",
            "library": "Biblioteca",
            "fountain": "Fuente",
            "place_of_worship": "Lugar de Culto",
            "nightclub": "Discoteca",
            "cinema": "Cine",
            "police": "Policía",
            "fire_station": "Bomberos",
            "hospital": "Hospital",
            "clinic": "Centro de Salud",
            "doctors": "Centro de Salud",
            "townhall": "Ayuntamiento",
            "university": "Universidad",
            "information": "Oficina de Turismo",
        }
        # Diferenciar Guardia Civil
        if tags.get("amenity") == "police" and tags.get("operator", "").lower().find("guardia civil") != -1:
            return "Guardia Civil"
        return amenity_map.get(tags["amenity"])

    # Tourism
    if tags.get("tourism") == "viewpoint":
        return "Mirador"
    if tags.get("tourism") == "museum":
        return "Museo"
    if tags.get("tourism") == "information":
        return "Oficina de Turismo"

    # Historic
    if "historic" in tags:
        historic_map = {
            "monument": "Monumento",
            "castle": "Castillo",
            "archaeological_site": "Sitio Arqueológico",
            "memorial": "Memorial",
            "palace": "Palacio",
        }
        return historic_map.get(tags["historic"])

    # Leisure
    if tags.get("leisure") == "stadium":
        return "Estadio"
    if tags.get("leisure") == "garden":
        return "Jardín"

    # Sport
    if tags.get("sport") == "bullfighting":
        return "Plaza de Toros"

    # Shop
    if tags.get("shop") == "mall":
        return "Centro Comercial"

    # Railway
    if tags.get("railway") == "station":
        return "Estación de Tren"

    # Building (culto)
    building_map = {
        "church": "Iglesia",
        "cathedral": "Catedral",
        "chapel": "Capilla",
        "mosque": "Mezquita",
        "monastery": "Monasterio",
        "abbey": "Abadía"
    }
    if "building" in tags:
        return building_map.get(tags["building"], "Lugar de Culto")

    return None

def generate_id(name, coords):
    """Genera un ID único basado en nombre y coordenadas"""
    hash_input = f"{name}-{coords[0]}-{coords[1]}"
    return hashlib.md5(hash_input.encode("utf-8")).hexdigest()[:8]

# Cargar raw GeoJSON
with INPUT.open(encoding="utf-8") as f:
    raw = json.load(f)

# Deduplicar usando set de hash
seen = set()
features = []

for f in raw["features"]:
    tags = f.get("properties", {})
    name = tags.get("name")
    category = get_category(tags)
    geom = f.get("geometry")
    if not name or not category or not geom:
        continue
    coords = geom.get("coordinates")
    if not coords:
        continue

    uid = generate_id(name, coords)
    if uid in seen:
        continue
    seen.add(uid)

    features.append({
        "type": "Feature",
        "geometry": geom,
        "properties": {
            "id": uid,
            "name": name,
            "category": category
        }
    })

# Ordenar por categoría y luego por nombre
features.sort(key=lambda x: (x["properties"]["category"], x["properties"]["name"]))

# Crear GeoJSON final mínimo
output = {
    "type": "FeatureCollection",
    "features": features
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with OUTPUT.open("w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

print(f"✔ GeoJSON optimizado generado: {len(features)} POIs")
