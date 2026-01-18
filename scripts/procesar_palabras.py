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
import os

ARCHIVO_ENTRADA = "raw_data/raw_palabras.json"
ARCHIVO_PAISES = "raw_data/paisciudad.min.json"
ARCHIVO_ESP = "raw_data/esp.json"
ARCHIVO_SALIDA = "data/palabras.json"

def normalizar_palabra(palabra):
    return palabra.strip()

def procesar():

    todas_las_palabras = set()

    if os.path.exists(ARCHIVO_ENTRADA):
        print(f"📖 Leyendo palabras desde {ARCHIVO_ENTRADA}...")
        with open(ARCHIVO_ENTRADA, 'r', encoding='utf-8') as f:
            datos = json.load(f)
            if isinstance(datos, list):
                for item in datos:
                    p = item if isinstance(item, str) else item.get('palabra', '')
                    todas_las_palabras.add(p)

    if os.path.exists(ARCHIVO_PAISES):
        print(f"📖 Leyendo países y ciudades desde {ARCHIVO_PAISES}...")
        with open(ARCHIVO_PAISES, 'r', encoding='utf-8') as f:
            datos_paises = json.load(f)
            for pais, ciudades in datos_paises.items():
                todas_las_palabras.add(pais)
                todas_las_palabras.update(ciudades)

    if os.path.exists(ARCHIVO_ESP):
        print(f"📖 Leyendo divisiones de España desde {ARCHIVO_ESP}...")
        with open(ARCHIVO_ESP, 'r', encoding='utf-8') as f:
            datos_esp = json.load(f)
            for ccaa in datos_esp:
                todas_las_palabras.add(ccaa.get("label", ""))
                for provincia in ccaa.get("provinces", []):
                    todas_las_palabras.add(provincia.get("label", ""))
                    for pueblo in provincia.get("towns", []):
                        todas_las_palabras.add(pueblo.get("label", ""))

    if not todas_las_palabras:
        print("❌ No hay datos para procesar.")
        return
    palabras_filtradas = []
    conteo = {4: 0, 5: 0, 6: 0}

    for palabra in sorted(list(todas_las_palabras)):
        if not isinstance(palabra, str):
            continue
            
        palabra = normalizar_palabra(palabra)
        
        if len(palabra) not in [4, 5, 6]:
            continue
            
        if ' ' in palabra or '-' in palabra or any(c.isdigit() for c in palabra):
            continue
        
        palabras_filtradas.append(palabra)
        conteo[len(palabra)] += 1
                
    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(palabras_filtradas, f, ensure_ascii=False, separators=(',', ':'))
        
    print(f"✅ ¡LISTO! Archivo generado en {ARCHIVO_SALIDA}")
    print(f"   📊 Total único: {len(palabras_filtradas)} palabras.")
    print(f"   🔹 4 letras: {conteo[4]}")
    print(f"   🔹 5 letras: {conteo[5]}")
    print(f"   🔹 6 letras: {conteo[6]}")

if __name__ == "__main__":
    procesar()