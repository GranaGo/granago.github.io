import pandas as pd
import json
import os

CONFIG = {
    "urbano": {
        "ruta_gtfs": "raw_data/gtfs_urbano",
        "ruta_salida": "data/urbano/tiempos_proximos.json",
        "agencia_objetivo": None,
        "usar_stop_code": True
    },
    "interurbano": {
        "ruta_gtfs": "raw_data/gtfs_interurbano",
        "ruta_salida": "data/interurbano/tiempos_proximos.json",
        "agencia_objetivo": "CTAG",
        "usar_stop_code": False
    }
}

def corregir_hora(hora_str):
    """Normaliza las horas GTFS (que pueden ser > 24h) al formato HH:MM"""
    if pd.isna(hora_str): return None
    try:
        parts = hora_str.strip().split(':')
        h = int(parts[0])
        m = int(parts[1])
        if h >= 24: h -= 24
        return f"{h:02d}:{m:02d}"
    except:
        return None

def procesar_tipo(tipo):
    conf = CONFIG[tipo]
    print(f"🚀 Generando índice de tiempos para: {tipo.upper()}...")
    
    f_calendar = os.path.join(conf['ruta_gtfs'], "calendar.txt")
    f_trips = os.path.join(conf['ruta_gtfs'], "trips.txt")
    f_routes = os.path.join(conf['ruta_gtfs'], "routes.txt")
    f_stops = os.path.join(conf['ruta_gtfs'], "stops.txt")
    f_stop_times = os.path.join(conf['ruta_gtfs'], "stop_times.txt")

    try:
        df_calendar = pd.read_csv(f_calendar, dtype=str)
        df_trips = pd.read_csv(f_trips, dtype=str)
        df_routes = pd.read_csv(f_routes, dtype=str)
        df_stops = pd.read_csv(f_stops, dtype=str)
        df_stop_times = pd.read_csv(f_stop_times, dtype=str)
    except Exception as e:
        print(f"❌ Error cargando archivos para {tipo}: {e}")
        return

    mapa_dias = {}
    for _, row in df_calendar.iterrows():
        dias = set()
        if any(row.get(d) == '1' for d in ['monday', 'tuesday', 'wednesday', 'thursday']):
            dias.add("L-J")
        if row.get('friday') == '1': dias.add("V")
        if row.get('saturday') == '1': dias.add("S")
        if row.get('sunday') == '1': dias.add("D")
        mapa_dias[row['service_id']] = list(dias)

    if conf['agencia_objetivo']:
        print(f"🔍 Filtrando rutas por agencia: {conf['agencia_objetivo']}")
        df_routes = df_routes[df_routes['agency_id'] == conf['agencia_objetivo']]

    mapa_lineas = {row['route_id']: row['route_short_name'] for _, row in df_routes.iterrows()}
    
    if conf['usar_stop_code'] and 'stop_code' in df_stops.columns:
        mapa_paradas_id_a_clave = {row['stop_id']: row['stop_code'] for _, row in df_stops.iterrows()}
    else:
        mapa_paradas_id_a_clave = {row['stop_id']: row['stop_id'] for _, row in df_stops.iterrows()}

    df_merged = pd.merge(df_stop_times[['trip_id', 'stop_id', 'departure_time']], 
                         df_trips[['trip_id', 'route_id', 'service_id']], 
                         on='trip_id')
    
    resultado = {}

    for _, row in df_merged.iterrows():
        linea = mapa_lineas.get(row['route_id'])
        if not linea: continue
        
        stop_id_interno = row['stop_id']
        stop_key = mapa_paradas_id_a_clave.get(stop_id_interno, stop_id_interno)

        dias_operativos = mapa_dias.get(row['service_id'], [])
        hora = corregir_hora(row['departure_time'])

        if not hora or not dias_operativos:
            continue

        if stop_key not in resultado:
            resultado[stop_key] = {}
        
        if linea not in resultado[stop_key]:
            resultado[stop_key][linea] = {"L-J": [], "V": [], "S": [], "D": []}

        for dia in dias_operativos:
            if hora not in resultado[stop_key][linea][dia]:
                resultado[stop_key][linea][dia].append(hora)

    for sid in resultado:
        for lin in resultado[sid]:
            for d in resultado[sid][lin]:
                resultado[sid][lin][d].sort()

    os.makedirs(os.path.dirname(conf['ruta_salida']), exist_ok=True)
    with open(conf['ruta_salida'], 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False)
    
    print(f"✅ Archivo generado: {conf['ruta_salida']}")
    
    if tipo == "urbano" and "74" in resultado and "9" in resultado["74"]:
        print("⭐ ¡ÉXITO! La línea 9 se ha encontrado para la parada 74.")

if __name__ == "__main__":
    procesar_tipo("urbano")
    procesar_tipo("interurbano")