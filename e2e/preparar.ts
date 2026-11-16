import { request } from '@playwright/test';
import { randomInt } from 'node:crypto';

/** Crea datos propios en el backend de pruebas; nunca borra las ventas existentes. */
export default async function preparar() {
  const api = await request.newContext({
    baseURL: process.env['E2E_API_URL'] ?? 'http://localhost:8080',
  });
  try {
    const password = process.env['E2E_ADMIN_PASSWORD'];
    if (!password) throw new Error('Falta E2E_ADMIN_PASSWORD. Usa scripts/ejecutar-e2e.ps1.');
    const login = await api.post('/api/v1/auth/login', { data: { username: 'admin', password } });
    if (!login.ok()) throw new Error(`Login admin de preparación: HTTP ${login.status()}`);
    const headers = { Authorization: `Bearer ${(await login.json()).token}` };
    const sufijo = `${Date.now()}-${randomInt(1000, 9999)}`;
    const crear = async (ruta: string, data: unknown) => {
      const r = await api.post(`/api/v1/${ruta}`, { headers, data });
      if (r.status() !== 201)
        throw new Error(`Preparación ${ruta}: ${r.status()} ${await r.text()}`);
      return r.json();
    };
    const categoria = await crear('categorias', {
      nombre: `E2E S14A ${sufijo}`,
      descripcion: 'Pruebas automatizadas',
      estado: true,
    });
    const dni = String(randomInt(10000000, 99999999));
    const cliente = await crear('clientes', {
      dni,
      nombres: 'Cliente E2E',
      apellidos: `Huaccha ${sufijo}`,
      email: `e2e-${sufijo}@example.test`,
      estado: true,
    });
    const producto = await crear('productos', {
      nombre: `AAA E2E S14A ${sufijo}`,
      descripcion: 'Producto aislado de pruebas',
      precio: 10,
      stock: 100,
      categoriaId: categoria.id,
      estado: true,
    });
    process.env['E2E_PRODUCTO'] = producto.nombre;
    process.env['E2E_CATEGORIA_ID'] = String(categoria.id);
    process.env['E2E_PRODUCTO_ID'] = String(producto.id);
    process.env['E2E_CLIENTE'] = dni;
    process.env['E2E_CLIENTE_ID'] = String(cliente.id);
  } finally {
    await api.dispose();
  }
}
