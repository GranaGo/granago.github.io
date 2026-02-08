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
    if pd.isna(hora_str): return None
    try:
        h, m, s = map(int, hora_str.split(':'))
        if h >= 24: h -= 24
        return f"{h:02d}:{m:02d}"
    except:
        return None

def procesar_tipo(tipo):
    conf = CONFIG[tipo]
    print(f"🚀 Generando índice de tiempos para: {tipo.upper()}...")
    
    try:
        df_calendar = pd.read_csv(f"{conf['ruta_gtfs']}/calendar.txt", dtype=str)
        df_trips = pd.read_csv(f"{conf['ruta_gtfs']}/trips.txt", dtype=str)
        df_stop_times = pd.read_csv(f"{conf['ruta_gtfs']}/stop_times.txt", dtype=str)
        df_routes = pd.read_csv(f"{conf['ruta_gtfs']}/routes.txt", dtype=str)
        
        mapa_paradas_id_a_clave = {}
        if conf['usar_stop_code']:
            df_stops = pd.read_csv(f"{conf['ruta_gtfs']}/stops.txt", dtype=str)
            for _, row in df_stops.iterrows():
                mapa_paradas_id_a_clave[row['stop_id']] = row.get('stop_code') or row['stop_id']
    except FileNotFoundError as e:
        print(f"❌ Error: No se encontró el archivo {e.filename}")
        return

    if conf['agencia_objetivo']:
        df_routes = df_routes[df_routes['agency_id'] == conf['agencia_objetivo']]
    
    valid_route_ids = set(df_routes['route_id'])

    mapa_dias = {}
    for _, row in df_calendar.iterrows():
        sid = row['service_id']
        dias = []
        if row.get('monday') == '1' and row.get('thursday') == '1': dias.append("L-J")
        if row.get('friday') == '1': dias.append("V")
        if row.get('saturday') == '1': dias.append("S")
        if row.get('sunday') == '1': dias.append("D")
        mapa_dias[sid] = dias

    mapa_lineas = {r['route_id']: str(r['route_short_name']).lstrip('0') or "0" 
                   for _, r in df_routes.iterrows()}

    df_trips = df_trips[df_trips['route_id'].isin(valid_route_ids)][['trip_id', 'route_id', 'service_id']]
    df_stop_times = df_stop_times[['trip_id', 'stop_id', 'departure_time']]
    merged = pd.merge(df_stop_times, df_trips, on='trip_id')
    
    resultado = {}

    for _, row in merged.iterrows():
        linea = mapa_lineas.get(row['route_id'])
        if not linea: continue
        
        stop_id_interno = row['stop_id']
        stop_key = mapa_paradas_id_a_clave.get(stop_id_interno, stop_id_interno) if conf['usar_stop_code'] else stop_id_interno

        dias_operativos = mapa_dias.get(row['service_id'], [])
        hora = corregir_hora(row['departure_time'])

        if not hora or not dias_operativos: continue

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
    with open(conf['ruta_salida'], "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False)
    
    print(f"✅ Archivo creado con éxito en: {conf['ruta_salida']}")

if __name__ == "__main__":
    procesar_tipo("urbano")
    procesar_tipo("interurbano")