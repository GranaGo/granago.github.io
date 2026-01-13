import json
import os
import unicodedata

ARCHIVO_ENTRADA = "raw_data/raw_palabras.json"
ARCHIVO_SALIDA = "data/encadenadas.json"

def normalizar_texto(texto):
    """Elimina acentos y convierte a minúsculas para facilitar el enlace."""
    return ''.join(c for c in unicodedata.normalize('NFD', texto)
                  if unicodedata.category(c) != 'Mn').lower()

def obtener_vinculo_encadenada(palabra):
    palabra = palabra.lower().strip()
    if not palabra: return ""
    
    vocales_fuertes = "aeoáéó"
    vocales_debiles = "iuüíú"
    vocales = vocales_fuertes + vocales_debiles
    
    pos_vocales = [i for i, char in enumerate(palabra) if char in vocales]
    if len(pos_vocales) < 2: return palabra

    v_ultima = pos_vocales[-1]
    v_penultima = pos_vocales[-2]
    
    def es_hiato(idx1, idx2):
        c1, c2 = palabra[idx1], palabra[idx2]
        if c1 in vocales_fuertes and c2 in vocales_fuertes: return True
        if (c1 in "íú" and c2 in vocales_fuertes) or (c2 in "íú" and c1 in vocales_fuertes): return True
        return False

    corte = 0
    if v_ultima == v_penultima + 1:
        if es_hiato(v_penultima, v_ultima):
            corte = v_ultima
        else:
            corte = v_penultima - 1 if v_penultima > 0 else 0
    else:
        entre = palabra[v_penultima+1 : v_ultima]
        grupos = ['br','cr','dr','gr','fr','pr','tr','bl','cl','fl','gl','pl','ch','ll']
        
        if len(entre) >= 2 and entre[-2:] in grupos:
            corte = v_ultima - 2
        elif len(entre) >= 2 and entre[-2:] == "rr":
            corte = v_ultima - 1
        else:
            corte = v_ultima - 1

    resultado = palabra[max(0, corte):]
    return normalizar_texto(resultado)

def procesar():
    print(f"🔗 Generando diccionario para Granábras Encadenadas...")
    encadenadas = {}

    if not os.path.exists(ARCHIVO_ENTRADA):
        print(f"❌ No se encuentra {ARCHIVO_ENTRADA}")
        return

    with open(ARCHIVO_ENTRADA, 'r', encoding='utf-8') as f:
        datos = json.load(f)
        
    for p in datos:
        palabra = p if isinstance(p, str) else p.get('palabra', '')
        palabra = palabra.lower().strip()
        
        if len(palabra) < 3 or not palabra.isalpha():
            continue
            
        vinculo = obtener_vinculo_encadenada(palabra)
        # Guardamos: {"palabra_original": "vinculo_normalizado"}
        encadenadas[palabra] = vinculo

    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
    with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
        json.dump(encadenadas, f, ensure_ascii=False)
    
    print(f"✅ Diccionario listo con {len(encadenadas)} palabras.")

if __name__ == "__main__":
    procesar()