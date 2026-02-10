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

import pandas as pd
import json
import os
from datetime import datetime

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
    },
    "metro": {
        "ruta_gtfs": "raw_data/gtfs_metro",
        "ruta_salida": "data/metro/tiempos_proximos.json",
        "agencia_objetivo": None,
        "usar_stop_code": False
    }
}

def corregir_hora(hora_str):
    if pd.isna(hora_str): return None
    try:
        parts = hora_str.strip().split(':')
        h = int(parts[0])
        m = int(parts[1])
        if h >= 24: h -= 24
        return f"{h:02d}:{m:02d}"
    except: return None

def procesar_tipo(tipo):
    conf = CONFIG[tipo]
    print(f"🚀 Procesando {tipo.upper()}...")
    
    df_calendar = pd.read_csv(os.path.join(conf['ruta_gtfs'], "calendar.txt"), dtype=str)
    df_dates = pd.read_csv(os.path.join(conf['ruta_gtfs'], "calendar_dates.txt"), dtype=str)
    df_trips = pd.read_csv(os.path.join(conf['ruta_gtfs'], "trips.txt"), dtype=str)
    df_routes = pd.read_csv(os.path.join(conf['ruta_gtfs'], "routes.txt"), dtype=str)
    df_stops = pd.read_csv(os.path.join(conf['ruta_gtfs'], "stops.txt"), dtype=str)
    df_stop_times = pd.read_csv(os.path.join(conf['ruta_gtfs'], "stop_times.txt"), dtype=str)

    mapa_dias = {}
    for _, row in df_calendar.iterrows():
        dias = set()
        if any(row[d] == '1' for d in ['monday', 'tuesday', 'wednesday', 'thursday']):
            dias.add("L-J")
        if row['friday'] == '1': dias.add("V")
        if row['saturday'] == '1': dias.add("S")
        if row['sunday'] == '1': dias.add("D")
        mapa_dias[row['service_id']] = dias

    for _, row in df_dates.iterrows():
        sid = row['service_id']
        if row['exception_type'] == '1':
            date_obj = datetime.strptime(row['date'], '%Y%m%d')
            weekday = date_obj.weekday()
            
            if sid not in mapa_dias: mapa_dias[sid] = set()
            
            if weekday < 4: mapa_dias[sid].add("L-J")
            elif weekday == 4: mapa_dias[sid].add("V")
            elif weekday == 5: mapa_dias[sid].add("S")
            elif weekday == 6: mapa_dias[sid].add("D")

    if conf['agencia_objetivo']:
        df_routes = df_routes[df_routes['agency_id'] == conf['agencia_objetivo']]
    
    mapa_lineas = {row['route_id']: row['route_short_name'].lstrip('0') or '0' for _, row in df_routes.iterrows()}
    mapa_paradas = {row['stop_id']: row['stop_code'] for _, row in df_stops.iterrows()} if conf['usar_stop_code'] else {row['stop_id']: row['stop_id'] for _, row in df_stops.iterrows()}
    merged = pd.merge(df_stop_times[['trip_id', 'stop_id', 'departure_time']], 
                      df_trips[['trip_id', 'route_id', 'service_id']], on='trip_id')
    
    resultado = {}
    for _, row in merged.iterrows():
        linea = mapa_lineas.get(row['route_id'])
        if not linea: continue
        
        stop_key = mapa_paradas.get(row['stop_id'], row['stop_id'])
        dias_operativos = mapa_dias.get(row['service_id'], set())
        hora = corregir_hora(row['departure_time'])

        if not hora or not dias_operativos: continue

        if stop_key not in resultado: resultado[stop_key] = {}
        if linea not in resultado[stop_key]:
            resultado[stop_key][linea] = {"L-J": [], "V": [], "S": [], "D": []}

        for dia in dias_operativos:
            if hora not in resultado[stop_key][linea][dia]:
                resultado[stop_key][linea][dia].append(hora)

    for sid in resultado:
        for lin in resultado[sid]:
            for d in resultado[sid][lin]:
                resultado[sid][lin][d].sort()

    with open(conf['ruta_salida'], 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False)
    print(f"✅ Finalizado: {conf['ruta_salida']}")

if __name__ == "__main__":
    procesar_tipo("urbano")
    procesar_tipo("interurbano")
    procesar_tipo("metro")