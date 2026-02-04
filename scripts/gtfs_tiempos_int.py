import pandas as pd
import json
import os

RUTA_GTFS = "raw_data/gtfs_interurbano"
RUTA_SALIDA = "data/interurbano/tiempos_proximos.json"

AGENCIA_INTERURBANO_OBJETIVO = "CTAG"

def corregir_hora(hora_str):
    """Limpia y ajusta el formato de hora HH:MM:SS a HH:MM."""
    if pd.isna(hora_str): return None
    try:
        h, m, s = map(int, hora_str.split(':'))
        if h >= 24: h -= 24
        return f"{h:02d}:{m:02d}"
    except:
        return None

def procesar():
    print(f"🚀 Generando índice de tiempos por parada (Filtrando agencia: {AGENCIA_INTERURBANO_OBJETIVO})...")
    
    try:
        df_agency = pd.read_csv(f"{RUTA_GTFS}/agency.txt", dtype=str)
        df_calendar = pd.read_csv(f"{RUTA_GTFS}/calendar.txt", dtype=str)
        df_trips = pd.read_csv(f"{RUTA_GTFS}/trips.txt", dtype=str)
        df_stop_times = pd.read_csv(f"{RUTA_GTFS}/stop_times.txt", dtype=str)
        df_routes = pd.read_csv(f"{RUTA_GTFS}/routes.txt", dtype=str)
    except FileNotFoundError as e:
        print(f"❌ Error: No se encontró el archivo {e.filename}")
        return

    agencias_validas = df_agency[df_agency['agency_id'] == AGENCIA_INTERURBANO_OBJETIVO]['agency_id'].unique()
    df_routes = df_routes[df_routes['agency_id'].isin(agencias_validas)]
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

    df_trips = df_trips[df_trips['route_id'].isin(valid_route_ids)]
    df_trips = df_trips[['trip_id', 'route_id', 'service_id']]
    df_stop_times = df_stop_times[['trip_id', 'stop_id', 'departure_time']]
    merged = pd.merge(df_stop_times, df_trips, on='trip_id')
    
    resultado = {}

    for _, row in merged.iterrows():
        linea = mapa_lineas.get(row['route_id'], "N/A")
        if linea == "N/A": continue
        
        stop_id = row['stop_id']
        dias_operativos = mapa_dias.get(row['service_id'], [])
        hora = corregir_hora(row['departure_time'])

        if not hora or not dias_operativos: continue

        if stop_id not in resultado:
            resultado[stop_id] = {}
        
        if linea not in resultado[stop_id]:
            resultado[stop_id][linea] = {"L-J": [], "V": [], "S": [], "D": []}

        for dia in dias_operativos:
            if hora not in resultado[stop_id][linea][dia]:
                resultado[stop_id][linea][dia].append(hora)

    for sid in resultado:
        for lin in resultado[sid]:
            for d in resultado[sid][lin]:
                resultado[sid][lin][d].sort()

    os.makedirs(os.path.dirname(RUTA_SALIDA), exist_ok=True)
    with open(RUTA_SALIDA, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False)
    
    print(f"✅ Archivo creado con éxito en: {RUTA_SALIDA}")

if __name__ == "__main__":
    procesar()