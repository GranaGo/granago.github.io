#  Copyright (C) 2026 GranáGo - https://github.com/granago/granago.github.io
#
#  Este programa es software libre: puedes redistribuirlo y/o modificarlo 
#  bajo los términos de la Licencia Pública General GNU publicada por 
#  la Free Software Foundation, ya sea la versión 3 de la Licencia, o 
#  (a tu elección) cualquier versión posterior.
#
#  Este programa se distribuye con la esperanza de que sea útil, 
#  pero SIN NINGUNA GARANTÍA; incluso sin la garantía implícita de 
#  COMERCIALIZACIÓN o APTITUD PARA UN PROPÓSITO PARTICULAR.

import json
from pathlib import Path
import hashlib

INPUT = Path("raw_data/poi.geojson")
OUTPUT = Path("data/poi_final.geojson")

def get_category(tags):
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
        if tags.get("amenity") == "police" and tags.get("operator", "").lower().find("guardia civil") != -1:
            return "Guardia Civil"
        return amenity_map.get(tags["amenity"])

    if tags.get("tourism") == "viewpoint":
        return "Mirador"
    if tags.get("tourism") == "museum":
        return "Museo"
    if tags.get("tourism") == "information":
        return "Oficina de Turismo"

    if "historic" in tags:
        historic_map = {
            "monument": "Monumento",
            "castle": "Castillo",
            "archaeological_site": "Sitio Arqueológico",
            "memorial": "Memorial",
            "palace": "Palacio",
        }
        return historic_map.get(tags["historic"])

    if tags.get("leisure") == "stadium":
        return "Estadio"
    if tags.get("leisure") == "garden":
        return "Jardín"

    if tags.get("sport") == "bullfighting":
        return "Plaza de Toros"

    if tags.get("shop") == "mall":
        return "Centro Comercial"

    if tags.get("railway") == "station":
        return "Estación de Tren"

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
    hash_input = f"{name}-{coords[0]}-{coords[1]}"
    return hashlib.md5(hash_input.encode("utf-8")).hexdigest()[:8]

with INPUT.open(encoding="utf-8") as f:
    raw = json.load(f)

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

features.sort(key=lambda x: (x["properties"]["category"], x["properties"]["name"]))

output = {
    "type": "FeatureCollection",
    "features": features
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with OUTPUT.open("w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

print(f"✔ GeoJSON optimizado generado: {len(features)} POIs")
