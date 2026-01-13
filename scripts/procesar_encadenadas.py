import json
import os
import re

ARCHIVO_ENTRADA = "raw_data/raw_palabras.json"
ARCHIVO_SALIDA = "data/encadenadas.json"

def separar_silabas(palabra):
    palabra = palabra.lower().strip()
    vocales = "aeiouáéíóúü"
    consonantes_pegadas = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'dr', 'ch', 'll', 'rr']

    syllable_pattern = re.compile(
        r'([^' + vocales + r']*(?=[' + vocales + r'])[' + vocales + r']+(?:[^' + vocales + r'](?![^' + vocales + r']*[' + vocales + r'])|[^' + vocales + r']*(?=$))*)',
        re.IGNORECASE
    )
    
    silabas = syllable_pattern.findall(palabra)
    
    res = []
    for i, s in enumerate(silabas):
        if i > 0:
            pass 
        res.append(s)
        
    return res if res else [palabra]

def procesar():
    print(f"📖 Procesando sílabas desde {ARCHIVO_ENTRADA}...")
    palabras_mapeadas = {}

    if not os.path.exists(ARCHIVO_ENTRADA):
        print("❌ Error: No se encuentra el archivo raw_palabras.json")
        return

    with open(ARCHIVO_ENTRADA, 'r', encoding='utf-8') as f:
        datos = json.load(f)
        
    for p in datos:
        palabra = p if isinstance(p, str) else p.get('palabra', '')
        palabra = palabra.lower().strip()
        
        if len(palabra) < 3 or not palabra.isalpha():
            continue
            
        silabas = separar_silabas(palabra)
        ultima_silaba = silabas[-1]
        
        palabras_mapeadas[palabra] = ultima_silaba

    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(palabras_mapeadas, f, ensure_ascii=False)
    
    print(f"✅ ¡Éxito! {len(palabras_mapeadas)} palabras listas para encadenar.")

if __name__ == "__main__":
    procesar()