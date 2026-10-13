"""Verificación con datos sintéticos contra la API local de esta práctica."""
import json
import urllib.request
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

BASE = 'http://localhost:8080/api/v1'
OUT = Path(__file__).parent / 'evidencias'
OUT.mkdir(exist_ok=True)

def api(method, path, body=None):
    request = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), method=method, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = response.read()
            return response.status, json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())

def crear(path, body):
    status, data = api('POST', path, body)
    assert status == 201, (path, status, data)
    return data

tag = datetime.now().strftime('%m%d%H%M')
categoria = crear('/categorias', {'nombre': 'S9 Prueba ' + tag, 'descripcion': 'Datos sintéticos para comprobar la práctica', 'estado': True})
libre = crear('/categorias', {'nombre': 'S9 Baja ' + tag, 'descripcion': 'Registro de prueba sin asociaciones', 'estado': True})
clientes = []
for i in range(3):
    clientes.append(crear('/clientes', {'dni': str(90000000 + int(tag[-6:]) * 10 + i), 'nombres': 'S9 Prueba ' + tag, 'apellidos': 'Huamán ' + str(i + 1), 'email': f's9-{tag}-{i}@example.com', 'telefono': None, 'direccion': 'Datos sintéticos', 'estado': True}))
productos = []
for i in range(5):
    productos.append(crear('/productos', {'nombre': f'S9 Prueba {tag} Producto {i + 1}', 'precio': 2.5 + i, 'stock': 10 if i < 4 else 1, 'estado': True, 'categoriaId': categoria['id']}))
resultados = []
status, _ = api('DELETE', '/categorias/' + str(libre['id']))
status_read, data = api('GET', '/categorias/' + str(libre['id']))
assert status == 204 and status_read == 200 and data['estado'] is False
resultados.append({'caso': 'Baja lógica categoría', 'resultado': 'Registro conservado con el mismo ID y estado inactivo'})
status, data = api('DELETE', '/categorias/' + str(categoria['id']))
assert status == 409 and 'productos asociados' in data['message']
resultados.append({'caso': 'Categoría con productos', 'estadoHTTP': status, 'mensaje': data['message']})
status, _ = api('DELETE', '/clientes/' + str(clientes[2]['id']))
status_read, data = api('GET', '/clientes/' + str(clientes[2]['id']))
assert status == 204 and status_read == 200 and data['estado'] is False
resultados.append({'caso': 'Baja lógica cliente', 'resultado': 'Registro conservado con el mismo ID y estado inactivo'})

# Dos solicitudes simultáneas consumen exclusivamente la última unidad sintética.
body = {'clienteId': clientes[0]['id'], 'detalles': [{'productoId': productos[4]['id'], 'cantidad': 1}]}
with ThreadPoolExecutor(max_workers=2) as executor:
    carreras = list(executor.map(lambda _: api('POST', '/ventas', body), range(2)))
assert sorted(status for status, _ in carreras) == [201, 409], carreras
_, stock = api('GET', '/productos/' + str(productos[4]['id']))
assert stock['stock'] == 0
venta = next(data for status, data in carreras if status == 201)
resultados.append({'caso': '15: concurrencia', 'estadosHTTP': [status for status, _ in carreras], 'stockFinal': stock['stock'], 'ventaId': venta['id']})

# Si la segunda línea falla, la primera debe recuperar su stock.
status, data = api('POST', '/ventas', {'clienteId': clientes[0]['id'], 'detalles': [{'productoId': productos[0]['id'], 'cantidad': 1}, {'productoId': productos[4]['id'], 'cantidad': 1}]})
assert status == 409
_, stock = api('GET', '/productos/' + str(productos[0]['id']))
assert stock['stock'] == 10
resultados.append({'caso': '15: rollback', 'estadoHTTP': status, 'stockPrimeraLinea': stock['stock']})
status, data = api('DELETE', '/clientes/' + str(clientes[0]['id']))
assert status == 409 and 'ventas asociadas' in data['message']
resultados.append({'caso': 'Cliente con ventas', 'estadoHTTP': status, 'mensaje': data['message']})

manifest = {'tag': tag, 'categoria': categoria, 'categoriaInactivaId': libre['id'], 'clientes': clientes, 'productos': productos, 'ventaConcurrencia': venta, 'resultados': resultados}
(OUT / 'verificacion-api.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'tag': tag, 'categoriaId': categoria['id'], 'clientesIds': [c['id'] for c in clientes], 'productosIds': [p['id'] for p in productos], 'verificaciones': resultados}, ensure_ascii=False, indent=2))
