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

import csv
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
    if not hora_str: return None
    try:
        parts = hora_str.strip().split(':')
        h = int(parts[0])
        m = int(parts[1])
        if h >= 24: h -= 24
        return f"{h:02d}:{m:02d}"
    except: return None

def cargar_csv(ruta, archivo):
    path = os.path.join(ruta, archivo)
    if not os.path.exists(path):
        return []
    with open(path, mode='r', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

def procesar_tipo(tipo):
    conf = CONFIG[tipo]
    print(f"🚀 Procesando {tipo.upper()}...")
    
    mapa_dias = {}
    for row in cargar_csv(conf['ruta_gtfs'], "calendar.txt"):
        dias = set()
        if any(row.get(d) == '1' for d in ['monday', 'tuesday', 'wednesday', 'thursday']):
            dias.add("L-J")
        if row.get('friday') == '1': dias.add("V")
        if row.get('saturday') == '1': dias.add("S")
        if row.get('sunday') == '1': dias.add("D")
        mapa_dias[row['service_id']] = dias

    for row in cargar_csv(conf['ruta_gtfs'], "calendar_dates.txt"):
        sid = row['service_id']
        if row.get('exception_type') == '1':
            try:
                date_obj = datetime.strptime(row['date'], '%Y%m%d')
                weekday = date_obj.weekday()
                if sid not in mapa_dias: mapa_dias[sid] = set()
                if weekday < 4: mapa_dias[sid].add("L-J")
                elif weekday == 4: mapa_dias[sid].add("V")
                elif weekday == 5: mapa_dias[sid].add("S")
                elif weekday == 6: mapa_dias[sid].add("D")
            except: pass

    agencia_filtro = conf['agencia_objetivo']
    mapa_lineas = {}
    for row in cargar_csv(conf['ruta_gtfs'], "routes.txt"):
        if agencia_filtro and row.get('agency_id') != agencia_filtro:
            continue
        mapa_lineas[row['route_id']] = row.get('route_short_name', '').lstrip('0') or '0'

    mapa_paradas = {}
    for row in cargar_csv(conf['ruta_gtfs'], "stops.txt"):
        mapa_paradas[row['stop_id']] = row.get('stop_code', row['stop_id']) if conf['usar_stop_code'] else row['stop_id']

    mapa_trips = {}
    for row in cargar_csv(conf['ruta_gtfs'], "trips.txt"):
        if row['route_id'] in mapa_lineas:
            mapa_trips[row['trip_id']] = {
                'route_id': row['route_id'],
                'service_id': row['service_id']
            }

    resultado = {}
    stop_times_path = os.path.join(conf['ruta_gtfs'], "stop_times.txt")
    
    if os.path.exists(stop_times_path):
        with open(stop_times_path, mode='r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                trip_info = mapa_trips.get(row['trip_id'])
                if not trip_info: continue
                
                linea = mapa_lineas.get(trip_info['route_id'])
                stop_key = mapa_paradas.get(row['stop_id'], row['stop_id'])
                dias_operativos = mapa_dias.get(trip_info['service_id'], set())
                hora = corregir_hora(row.get('departure_time'))

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

    os.makedirs(os.path.dirname(conf['ruta_salida']), exist_ok=True)
    with open(conf['ruta_salida'], 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, separators=(',', ':'))
    print(f"✅ Finalizado: {conf['ruta_salida']}")

if __name__ == "__main__":
    procesar_tipo("urbano")
    procesar_tipo("interurbano")
    procesar_tipo("metro")