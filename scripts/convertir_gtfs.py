import pandas as pd
import json
import os

# ================= CONFIGURACIÓN =================
RUTAS_ENTRADA = {
    "metro": "raw_data/gtfs_metro",
    "urbano": "raw_data/gtfs_urbano",
    "interurbano": "raw_data/gtfs_interurbano"
}

AGENCIA_INTERURBANO_OBJETIVO = "CTAG"
CARPETA_SALIDA = "data"

# Colores por defecto (usados si el GTFS falla y no hay manual)
COLORES_DEFECTO = {
    "metro": "009A44",       # Corregido (le faltaba un 4)
    "urbano": "D9281C",      # Rojo Rober
    "interurbano": "2757F5"  # Verde Consorcio
}

# --- 🎨 COLORES MANUALES (OPCIONAL) ---
# Si alguna línea se resiste, ponla aquí.
COLORES_MANUALES = {
    "urbano": {
        "N5": "000000" # Ejemplo
    }
}

# ================= FUNCIONES AUXILIARES =================

def limpiar_nombre_linea(nombre, es_interurbano):
    """Quita ceros a la izquierda solo si es interurbano (ej: 0177 -> 177)"""
    if pd.isna(nombre): return "Sin Nombre"
    nombre = str(nombre).strip()
    if es_interurbano:
        return nombre.lstrip('0') or "0"
    return nombre

def corregir_hora(hora_str):
    """24:30:00 -> 00:30:00"""
    if pd.isna(hora_str): return None
    try:
        h, m, s = map(int, hora_str.split(':'))
        if h >= 24: h -= 24
        return f"{h:02d}:{m:02d}"
    except:
        return hora_str

def cargar_csv(ruta, archivo):
    path = os.path.join(ruta, archivo)
    if os.path.exists(path):
        # dtype=str es vital para no perder ceros en colores o IDs
        return pd.read_csv(path, dtype=str)
    return pd.DataFrame()

def analizar_calendario(df_calendar):
    mapa_servicios = {}
    if df_calendar.empty: return mapa_servicios

    for _, row in df_calendar.iterrows():
        sid = row['service_id']
        dias = []
        lunes = int(row.get('monday', 0))
        jueves = int(row.get('thursday', 0))
        viernes = int(row.get('friday', 0))
        sabado = int(row.get('saturday', 0))
        domingo = int(row.get('sunday', 0))

        if lunes == 1 and jueves == 1: dias.append("L-J")
        if viernes == 1: dias.append("V")
        if sabado == 1: dias.append("S")
        if domingo == 1: dias.append("D")

        mapa_servicios[sid] = dias
    return mapa_servicios

# ================= PROCESAMIENTO PRINCIPAL =================

def procesar_gtfs(modo, ruta_entrada):
    print(f"\n--- 🚌 Procesando {modo.upper()} ---")
    
    # 1. Cargar Datos
    df_agency = cargar_csv(ruta_entrada, "agency.txt")
    df_routes = cargar_csv(ruta_entrada, "routes.txt")
    df_trips = cargar_csv(ruta_entrada, "trips.txt")
    df_stops = cargar_csv(ruta_entrada, "stops.txt")
    df_times = cargar_csv(ruta_entrada, "stop_times.txt")
    df_shapes = cargar_csv(ruta_entrada, "shapes.txt")
    df_calendar = cargar_csv(ruta_entrada, "calendar.txt")

    # 2. Filtrado Interurbano (CTAG)
    if modo == "interurbano" and not df_agency.empty:
        agencias = df_agency[df_agency['agency_id'] == AGENCIA_INTERURBANO_OBJETIVO]['agency_id'].tolist()
        if agencias:
            df_routes = df_routes[df_routes['agency_id'].isin(agencias)]
            df_trips = df_trips[df_trips['route_id'].isin(df_routes['route_id'])]
            df_times = df_times[df_times['trip_id'].isin(df_trips['trip_id'])]
            valid_stops = df_times['stop_id'].unique()
            df_stops = df_stops[df_stops['stop_id'].isin(valid_stops)]
            print(f"   ✅ Filtrado CTAG: {len(df_routes)} líneas.")

    # 3. Mapa de Calendario
    mapa_dias = analizar_calendario(df_calendar)

    # 4. Estructuras de Salida
    out_rutas = {}
    out_paradas = {}
    out_horarios = {}
    out_colores = {}

    # Agrupar por línea (Route)
    for _, ruta in df_routes.iterrows():
        rid = ruta['route_id']
        r_short = limpiar_nombre_linea(ruta.get('route_short_name', ''), modo == "interurbano")
        r_long = ruta.get('route_long_name', '')
        
        # --- LÓGICA DE COLORES ---
        color_final = None
        
        # 1. ¿Está en COLORES_MANUALES?
        if modo in COLORES_MANUALES and r_short in COLORES_MANUALES[modo]:
            color_final = COLORES_MANUALES[modo][r_short]
        
        # 2. Si no, mirar route_color del GTFS
        if not color_final:
            gtfs_color = ruta.get('route_color')
            
            # Verificamos que no sea NaN y tenga contenido
            if pd.notna(gtfs_color):
                c_str = str(gtfs_color).strip()
                if c_str and c_str.lower() != "nan":
                    color_final = c_str
        
        # 3. Si sigue vacío, usar color por defecto
        if not color_final:
            color_final = COLORES_DEFECTO[modo]
        
        # 4. Asegurar formato Hex con #
        if not color_final.startswith('#'):
            color_final = '#' + color_final
            
        out_colores[r_short] = color_final
        # -----------------------------------

        # Inicializar diccionarios
        out_rutas[r_short] = {"ida": [], "vuelta": []}
        out_paradas[r_short] = {"ida": [], "vuelta": []}
        out_horarios[r_short] = {"ida": {"L-J":[], "V":[], "S":[], "D":[]}, 
                                 "vuelta": {"L-J":[], "V":[], "S":[], "D":[]}}

        # Filtrar trips de esta línea
        trips_linea = df_trips[df_trips['route_id'] == rid]

        for direction_id in ['0', '1']:
            dir_key = "ida" if direction_id == '0' else "vuelta"
            trips_dir = trips_linea[trips_linea['direction_id'] == direction_id]
            
            if trips_dir.empty: continue

            # --- A. RUTAS (SHAPES) ---
            if not df_shapes.empty:
                shape_id = trips_dir['shape_id'].mode()
                if not shape_id.empty:
                    s_id = shape_id[0]
                    puntos = df_shapes[df_shapes['shape_id'] == s_id].sort_values(by='shape_pt_sequence', key=lambda x: x.astype(int))
                    out_rutas[r_short][dir_key] = puntos[['shape_pt_lat', 'shape_pt_lon']].astype(float).values.tolist()

            # --- B. PARADAS ---
            trip_ids = trips_dir['trip_id'].unique()
            best_trip = None
            max_stops = 0
            
            for t in trip_ids[:5]:
                count = len(df_times[df_times['trip_id'] == t])
                if count > max_stops:
                    max_stops = count
                    best_trip = t
            
            if best_trip:
                st_trip = df_times[df_times['trip_id'] == best_trip].sort_values(by='stop_sequence', key=lambda x: x.astype(int))
                lista_p = []
                for _, row in st_trip.iterrows():
                    stop_info = df_stops[df_stops['stop_id'] == row['stop_id']].iloc[0]
                    lista_p.append({
                        "stop_id": row['stop_id'],
                        "stop_code": str(stop_info.get('stop_code', '')),
                        "n": stop_info['stop_name'],
                        "lat": round(float(stop_info['stop_lat']), 5),
                        "lon": round(float(stop_info['stop_lon']), 5),
                        "linea": r_short,
                        "nombre_linea": r_long
                    })
                out_paradas[r_short][dir_key] = lista_p

            # --- C. HORARIOS (HÍBRIDO: Lista completa para Inter, Resumen para otros) ---
            temp_horarios = {"L-J": [], "V": [], "S": [], "D": []}

            for _, trip in trips_dir.iterrows():
                tid = trip['trip_id']
                sid = trip['service_id']
                
                dias_operativos = mapa_dias.get(sid, [])
                if not dias_operativos: continue

                times = df_times[df_times['trip_id'] == tid].sort_values(by='stop_sequence', key=lambda x: x.astype(int))
                if times.empty: continue

                raw_salida = times.iloc[0]['departure_time']
                h_salida = corregir_hora(raw_salida)
                
                dato_viaje = { "sort": raw_salida, "show": h_salida }

                for dia in dias_operativos:
                    temp_horarios[dia].append(dato_viaje)

            # PROCESAR
            for dia in ["L-J", "V", "S", "D"]:
                lista = temp_horarios[dia]
                
                if not lista:
                    out_horarios[r_short][dir_key][dia] = None 
                else:
                    # Ordenar siempre cronológicamente
                    lista.sort(key=lambda x: x['sort'])
                    
                    if modo == "interurbano":
                        # CASO 1: Lista COMPLETA (solo las horas formateadas)
                        # Usamos un set para evitar duplicados exactos si hubiera, y volvemos a ordenar
                        horas_unicas = sorted(list(set([x['show'] for x in lista])))
                        out_horarios[r_short][dir_key][dia] = horas_unicas
                    else:
                        # CASO 2: Resumen INICIO/FIN (Urbano/Metro)
                        primer_viaje = lista[0]['show']
                        ultimo_viaje = lista[-1]['show']
                        out_horarios[r_short][dir_key][dia] = {
                            "inicio": primer_viaje,
                            "fin": ultimo_viaje
                        }
    # 5. Guardar Archivos
    path_salida = os.path.join(CARPETA_SALIDA, modo)
    os.makedirs(path_salida, exist_ok=True)

    with open(f"{path_salida}/paradas.json", "w", encoding="utf-8") as f:
        json.dump(out_paradas, f, ensure_ascii=False)
    with open(f"{path_salida}/rutas.json", "w", encoding="utf-8") as f:
        json.dump(out_rutas, f, ensure_ascii=False)
    with open(f"{path_salida}/horarios.json", "w", encoding="utf-8") as f:
        json.dump(out_horarios, f, ensure_ascii=False)
    with open(f"{path_salida}/colores.json", "w", encoding="utf-8") as f:
        json.dump(out_colores, f, ensure_ascii=False)
    
    print(f"   💾 Guardados paradas, rutas, horarios y colores en {path_salida}")

# ================= EJECUCIÓN =================
if __name__ == "__main__":
    os.makedirs(CARPETA_SALIDA, exist_ok=True)
    
    try: procesar_gtfs("metro", RUTAS_ENTRADA["metro"])
    except Exception as e: print(f"❌ Error Metro: {e}")

    try: procesar_gtfs("urbano", RUTAS_ENTRADA["urbano"])
    except Exception as e: print(f"❌ Error Urbano: {e}")

    try: procesar_gtfs("interurbano", RUTAS_ENTRADA["interurbano"])
    except Exception as e: print(f"❌ Error Interurbano: {e}")