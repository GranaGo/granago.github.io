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
from collections import defaultdict, Counter

RUTAS_ENTRADA = {
    "metro": "raw_data/gtfs_metro",
    "urbano": "raw_data/gtfs_urbano",
    "interurbano": "raw_data/gtfs_interurbano"
}

AGENCIA_INTERURBANO_OBJETIVO = "CTAG"
CARPETA_SALIDA = "data"

COLORES_DEFECTO = {
    "metro": "009A44",
    "urbano": "D9281C",
    "interurbano": "2757F5"
}

def limpiar_nombre_linea(nombre, es_interurbano):
    if not nombre: return "Sin Nombre"
    nombre = str(nombre).strip()
    if es_interurbano:
        return nombre.lstrip('0') or "0"
    return nombre

def corregir_hora(hora_str):
    if not hora_str: return None
    try:
        h, m, s = map(int, hora_str.split(':'))
        if h >= 24: h -= 24
        return f"{h:02d}:{m:02d}"
    except:
        return hora_str

def cargar_csv(ruta, archivo):
    path = os.path.join(ruta, archivo)
    if not os.path.exists(path): return []
    with open(path, mode='r', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

def analizar_calendario(datos_calendar, datos_dates):
    mapa_servicios = defaultdict(set)
    
    for row in datos_calendar:
        sid = row['service_id']
        if any(row.get(d) == '1' for d in ['monday', 'tuesday', 'wednesday', 'thursday']):
            mapa_servicios[sid].add("L-J")
        if row.get('friday') == '1': mapa_servicios[sid].add("V")
        if row.get('saturday') == '1': mapa_servicios[sid].add("S")
        if row.get('sunday') == '1': mapa_servicios[sid].add("D")

    for row in datos_dates:
        sid = row['service_id']
        if row.get('exception_type') == '1':
            try:
                fecha = datetime.strptime(row['date'], '%Y%m%d')
                weekday = fecha.weekday()
                if weekday < 4: mapa_servicios[sid].add("L-J")
                elif weekday == 4: mapa_servicios[sid].add("V")
                elif weekday == 5: mapa_servicios[sid].add("S")
                elif weekday == 6: mapa_servicios[sid].add("D")
            except:
                pass
    return {k: list(v) for k, v in mapa_servicios.items()}

def procesar_gtfs(modo, ruta_entrada):
    print(f"\n--- 🚌 Procesando {modo.upper()} ---")
    
    datos_agency = cargar_csv(ruta_entrada, "agency.txt")
    datos_routes = cargar_csv(ruta_entrada, "routes.txt")
    datos_trips = cargar_csv(ruta_entrada, "trips.txt")
    datos_stops = cargar_csv(ruta_entrada, "stops.txt")
    datos_calendar = cargar_csv(ruta_entrada, "calendar.txt")
    datos_dates = cargar_csv(ruta_entrada, "calendar_dates.txt")
    
    mapa_dias = analizar_calendario(datos_calendar, datos_dates)

    valid_agency_ids = set()
    if modo == "interurbano" and datos_agency:
        valid_agency_ids = {a['agency_id'] for a in datos_agency if a.get('agency_id') == AGENCIA_INTERURBANO_OBJETIVO}
        datos_routes = [r for r in datos_routes if r.get('agency_id') in valid_agency_ids]
        print(f"   ✅ Filtrado CTAG: {len(datos_routes)} líneas.")

    valid_route_ids = {r['route_id'] for r in datos_routes}
    valid_trips = [t for t in datos_trips if t['route_id'] in valid_route_ids]
    valid_trip_ids = {t['trip_id'] for t in valid_trips}
    
    used_shape_ids = {t['shape_id'] for t in valid_trips if t.get('shape_id')}
    path_shapes = os.path.join(ruta_entrada, "shapes.txt")
    mapa_shapes = defaultdict(list)
    if os.path.exists(path_shapes):
        with open(path_shapes, mode='r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                if row['shape_id'] in used_shape_ids:
                    mapa_shapes[row['shape_id']].append({
                        'lat': float(row['shape_pt_lat']),
                        'lon': float(row['shape_pt_lon']),
                        'seq': int(row['shape_pt_sequence'])
                    })
    for sid in mapa_shapes:
        mapa_shapes[sid].sort(key=lambda x: x['seq'])

    path_times = os.path.join(ruta_entrada, "stop_times.txt")
    stop_times_por_trip = defaultdict(list)
    if os.path.exists(path_times):
        with open(path_times, mode='r', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                if row['trip_id'] in valid_trip_ids:
                    stop_times_por_trip[row['trip_id']].append({
                        'stop_id': row['stop_id'],
                        'departure_time': row.get('departure_time', ''),
                        'seq': int(row['stop_sequence'])
                    })
    for tid in stop_times_por_trip:
        stop_times_por_trip[tid].sort(key=lambda x: x['seq'])

    mapa_paradas_info = {s['stop_id']: s for s in datos_stops}

    out_rutas = {}
    out_paradas = {}
    out_horarios = {}
    out_colores = {}

    for ruta in datos_routes:
        rid = ruta['route_id']
        r_short = limpiar_nombre_linea(ruta.get('route_short_name', ''), modo == "interurbano")
        r_long = ruta.get('route_long_name', '')
        
        c_str = ruta.get('route_color', '').strip()
        color_final = c_str if c_str and c_str.lower() != "nan" else COLORES_DEFECTO[modo]
        if not color_final.startswith('#'): color_final = '#' + color_final
            
        out_colores[r_short] = color_final
        out_rutas[r_short] = {"ida": [], "vuelta": []}
        out_paradas[r_short] = {"ida": [], "vuelta": []}
        out_horarios[r_short] = {"ida": {"L-J":[], "V":[], "S":[], "D":[]}, 
                                 "vuelta": {"L-J":[], "V":[], "S":[], "D":[]}}

        trips_linea = [t for t in valid_trips if t['route_id'] == rid]

        for direction_id in ['0', '1']:
            dir_key = "ida" if direction_id == '0' else "vuelta"
            trips_dir = [t for t in trips_linea if t.get('direction_id') == direction_id]
            if not trips_dir: continue

            shapes_counts = Counter(t['shape_id'] for t in trips_dir if t.get('shape_id'))
            if shapes_counts:
                s_id = shapes_counts.most_common(1)[0][0]
                if s_id in mapa_shapes:
                    out_rutas[r_short][dir_key] = [[pt['lat'], pt['lon']] for pt in mapa_shapes[s_id]]

            trip_ids_dir = list({t['trip_id'] for t in trips_dir})
            best_trip = None
            max_stops = -1
            
            for t in trip_ids_dir[:5]:
                count = len(stop_times_por_trip.get(t, []))
                if count > max_stops:
                    max_stops = count
                    best_trip = t
            
            if best_trip and max_stops > 0:
                lista_p = []
                for st in stop_times_por_trip[best_trip]:
                    s_info = mapa_paradas_info.get(st['stop_id'], {})
                    if not s_info: continue
                    lista_p.append({
                        "stop_id": st['stop_id'],
                        "stop_code": str(s_info.get('stop_code', '')),
                        "n": s_info.get('stop_name', ''),
                        "lat": round(float(s_info.get('stop_lat', 0)), 5),
                        "lon": round(float(s_info.get('stop_lon', 0)), 5),
                        "linea": r_short,
                        "nombre_linea": r_long
                    })
                out_paradas[r_short][dir_key] = lista_p

            temp_horarios = {"L-J": [], "V": [], "S": [], "D": []}
            for trip in trips_dir:
                tid = trip['trip_id']
                sid = trip['service_id']
                dias_operativos = mapa_dias.get(sid, [])
                if not dias_operativos: continue

                times = stop_times_por_trip.get(tid, [])
                if not times: continue

                raw_salida = times[0]['departure_time']
                h_salida = corregir_hora(raw_salida)
                if not h_salida: continue
                
                dato_viaje = { "sort": raw_salida, "show": h_salida }
                for dia in dias_operativos:
                    temp_horarios[dia].append(dato_viaje)

            for dia in ["L-J", "V", "S", "D"]:
                lista = temp_horarios[dia]
                if not lista:
                    out_horarios[r_short][dir_key][dia] = None 
                else:
                    lista.sort(key=lambda x: x['sort'])
                    if modo == "interurbano":
                        horas_unicas = sorted(list(set([x['show'] for x in lista])))
                        out_horarios[r_short][dir_key][dia] = horas_unicas
                    else:
                        out_horarios[r_short][dir_key][dia] = {
                            "inicio": lista[0]['show'],
                            "fin": lista[-1]['show']
                        }

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

if __name__ == "__main__":
    os.makedirs(CARPETA_SALIDA, exist_ok=True)
    try: procesar_gtfs("metro", RUTAS_ENTRADA["metro"])
    except Exception as e: print(f"❌ Error Metro: {e}")

    try: procesar_gtfs("urbano", RUTAS_ENTRADA["urbano"])
    except Exception as e: print(f"❌ Error Urbano: {e}")

    try: procesar_gtfs("interurbano", RUTAS_ENTRADA["interurbano"])
    except Exception as e: print(f"❌ Error Interurbano: {e}")