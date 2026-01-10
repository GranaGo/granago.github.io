import json
import os
import unicodedata

# ================= CONFIGURACIÓN =================
ARCHIVO_ENTRADA = "raw_data/index.json"
ARCHIVO_SALIDA = "data/palabras.json"

def normalizar_palabra(palabra):
    """
    Elimina tildes y normaliza para comparaciones futuras si es necesario.
    Para el diccionario de Wordle, nos interesa guardar la versión limpia 
    para validar (sin tilde) y/o la original.
    
    En este caso, guardaremos la palabra TAL CUAL viene en el diccionario
    pero filtraremos las que no sean válidas.
    """
    return palabra.strip()

def procesar():
    if not os.path.exists(ARCHIVO_ENTRADA):
        print(f"⚠️ No se encontró {ARCHIVO_ENTRADA}. Saltando procesamiento.")
        return

    print(f"📖 Leyendo diccionario gigante desde {ARCHIVO_ENTRADA}...")
    
    try:
        with open(ARCHIVO_ENTRADA, 'r', encoding='utf-8') as f:
            datos = json.load(f)
            
        palabras_filtradas = []
        conteo = {4: 0, 5: 0, 6: 0}
        
        # Detectar si el JSON es una lista plana ["a", "b"] o lista de objetos
        if isinstance(datos, list):
            for item in datos:
                # Obtener string si es objeto
                palabra = item if isinstance(item, str) else list(item.values())[0]
                palabra = palabra.strip()
                
                # --- FILTROS ---
                # 1. Longitud 4, 5 o 6
                if len(palabra) not in [4, 5, 6]:
                    continue
                    
                # 2. Sin espacios, guiones ni números
                if ' ' in palabra or '-' in palabra or any(c.isdigit() for c in palabra):
                    continue
                
                # Añadir a la lista
                palabras_filtradas.append(palabra)
                conteo[len(palabra)] += 1
                
        # Guardar resultado optimizado
        os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)
        
        with open(ARCHIVO_SALIDA, 'w', encoding='utf-8') as f:
            json.dump(palabras_filtradas, f, ensure_ascii=False, separators=(',', ':'))
            
        print(f"✅ ¡LISTO! Archivo generado en {ARCHIVO_SALIDA}")
        print(f"   📊 Total: {len(palabras_filtradas)} palabras.")
        print(f"   🔹 4 letras: {conteo[4]}")
        print(f"   🔹 5 letras: {conteo[5]}")
        print(f"   🔹 6 letras: {conteo[6]}")
        
        # Mostrar reducción de tamaño
        size_in = os.path.getsize(ARCHIVO_ENTRADA) / (1024 * 1024)
        size_out = os.path.getsize(ARCHIVO_SALIDA) / (1024 * 1024)
        print(f"   📉 Reducción: {size_in:.2f} MB -> {size_out:.2f} MB")

    except Exception as e:
        print(f"❌ Error procesando palabras: {e}")

if __name__ == "__main__":
    procesar()