import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { randomInt } from 'node:crypto';
import { capturar, iniciarSesion, RolPrueba } from './apoyo';

const apiUrl = process.env['E2E_API_URL'] ?? 'http://localhost:8080';

async function cabeceras(api: APIRequestContext, rol: RolPrueba = 'admin') {
  const password = process.env[`E2E_${rol.toUpperCase()}_PASSWORD`];
  const r = await api.post(`${apiUrl}/api/v1/auth/login`, { data: { username: rol, password } });
  expect(r.status()).toBe(200);
  return { Authorization: `Bearer ${(await r.json()).token}` };
}

async function elegirClienteProducto(page: Page) {
  await page.getByTestId('buscar-cliente').fill(process.env['E2E_CLIENTE']!);
  await page.getByTestId('opcion-cliente').first().click();
  await page.getByTestId('buscar-producto').fill(process.env['E2E_PRODUCTO']!);
  await page
    .getByTestId('opcion-producto')
    .filter({ hasText: process.env['E2E_PRODUCTO']! })
    .first()
    .click();
}

test('E2E-08 stock cambia tras la consulta: 409 visible y ninguna venta parcial', async ({
  page,
  request,
}, info) => {
  const headers = await cabeceras(request);
  const url = `${apiUrl}/api/v1/productos/${process.env['E2E_PRODUCTO_ID']}`;
  const original = await (await request.get(url, { headers })).json();
  const buscar = `${apiUrl}/api/v1/ventas/buscar?pagina=0&tamanio=20&clienteId=${process.env['E2E_CLIENTE_ID']}`;
  const antes = await (await request.get(buscar, { headers })).json();
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await elegirClienteProducto(page);
  await page.getByTestId('cantidad').fill('2');
  try {
    const update = await request.put(url, { headers, data: { ...original, stock: 0 } });
    expect(update.status()).toBe(200);
    await page.getByRole('button', { name: 'Revisar venta', exact: true }).click();
    const dialogo = page.getByRole('dialog', { name: 'Confirmar venta' });
    await dialogo.getByRole('checkbox').uncheck();
    const respuesta = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/api/v1/ventas'),
    );
    await dialogo.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
    expect((await respuesta).status()).toBe(409);
    await expect(page.locator('.alerta')).toContainText('Stock insuficiente');
    const despues = await (await request.get(buscar, { headers })).json();
    expect(despues.totalElementos).toBe(antes.totalElementos);
    expect((await (await request.get(url, { headers })).json()).stock).toBe(0);
    // Esperar la recarga real que dispara el 409 antes de restaurar el stock.
    // Con miles de filas, restaurarlo antes puede dejar una lectura anterior en caché.
    await expect(page.getByRole('status')).toContainText('Stock y precios actualizados');
    await capturar(page, info, '08-stock-insuficiente');
  } finally {
    expect((await request.put(url, { headers, data: original })).status()).toBe(200);
  }
});

test('E2E-09 una venta sin productos no permite continuar y la API devuelve 400', async ({
  page,
  request,
}, info) => {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await expect(page.getByRole('button', { name: 'Revisar venta', exact: true })).toBeDisabled();
  const headers = await cabeceras(request, 'vendedor');
  const r = await request.post(`${apiUrl}/api/v1/ventas`, {
    headers,
    data: { clienteId: Number(process.env['E2E_CLIENTE_ID']), detalles: [] },
  });
  expect(r.status()).toBe(400);
  await capturar(page, info, '09-venta-sin-productos');
});

test('E2E-10 cliente creado en la SPA queda disponible para vender inmediatamente', async ({
  page,
}, info) => {
  await iniciarSesion(page, 'vendedor', '/clientes/nuevo');
  const dni = String(randomInt(10000000, 99999999));
  await page.locator('[formControlName="dni"]').fill(dni);
  await page.locator('[formControlName="nombres"]').fill('Nuevo E2E');
  await page.locator('[formControlName="apellidos"]').fill('Huaccha');
  await page.locator('[formControlName="email"]').fill(`nuevo-${Date.now()}-${dni}@example.test`);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Guardar cliente' })
    .getByRole('button', { name: 'Guardar', exact: true })
    .click();
  await expect(page).toHaveURL(/\/clientes$/);
  await page.locator('a[href="/ventas"]').first().click();
  await page.getByRole('link', { name: /Nueva venta/ }).click();
  await page.getByTestId('buscar-cliente').fill(dni);
  await expect(page.getByTestId('opcion-cliente')).toHaveCount(1);
  await page.getByTestId('opcion-cliente').click();
  await page.getByTestId('buscar-producto').fill(process.env['E2E_PRODUCTO']!);
  await page.getByTestId('opcion-producto').first().click();
  await page.getByRole('button', { name: 'Revisar venta', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Confirmar venta' });
  await dialogo.getByRole('checkbox').uncheck();
  await dialogo.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByText('Venta registrada correctamente.')).toBeVisible();
  await expect(page.getByText('Nuevo E2E Huaccha', { exact: false }).first()).toBeVisible();
  await capturar(page, info, '10-cliente-nuevo-venta');
});

test('E2E-11 filtrar fechas desde la tercera página vuelve a la primera', async ({
  page,
}, info) => {
  await iniciarSesion(page, 'vendedor', '/ventas?pagina=2&tamanio=20');
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 3 de');
  const hoy = new Date().toISOString().slice(0, 10);
  await page.locator('[formControlName="desde"]').fill(hoy);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/pagina=0/);
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 1 de');
  await page.reload();
  await expect(page.locator('[formControlName="desde"]')).toHaveValue(hoy);
  await capturar(page, info, '11-filtros-reinician-pagina');
});

test('E2E-12 admin encuentra la venta recién creada y su requestId en auditoría', async ({
  page,
  request,
}, info) => {
  const headers = await cabeceras(request, 'vendedor');
  const r = await request.post(`${apiUrl}/api/v1/ventas`, {
    headers,
    data: {
      clienteId: Number(process.env['E2E_CLIENTE_ID']),
      detalles: [{ productoId: Number(process.env['E2E_PRODUCTO_ID']), cantidad: 1 }],
    },
  });
  expect(r.status()).toBe(201);
  const venta = await r.json();
  const idPeticion = r.headers()['x-request-id'];
  await iniciarSesion(page, 'admin', '/auditoria');
  await expect(page.locator('a[href="/auditoria"]')).toBeVisible();
  await page.getByLabel('Usuario', { exact: true }).fill('vendedor');
  await page.getByLabel('Acción', { exact: true }).selectOption('VENTA_REGISTRADA');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/accion=VENTA_REGISTRADA/);
  const fila = page
    .getByTestId('tabla-auditoria')
    .locator('tbody tr')
    .filter({ hasText: idPeticion });
  await expect(fila.locator('td').nth(4)).toHaveText(String(venta.id));
  await page.reload();
  await expect(fila).toBeVisible();
  await capturar(page, info, '12-auditoria-admin');
});

test('E2E-13 vendedor sin menú de auditoría y acceso directo denegado', async ({ page }, info) => {
  await iniciarSesion(page, 'vendedor');
  await expect(page.locator('a[href="/auditoria"]')).toHaveCount(0);
  await page.goto('/auditoria');
  await expect(page.getByRole('heading', { name: /Acceso denegado/ })).toBeVisible();
  await capturar(page, info, '13-auditoria-denegada');
});

test('E2E-14 token alterado en sessionStorage fuerza login con aviso', async ({ page }, info) => {
  await iniciarSesion(page, 'vendedor', '/productos');
  await expect(page.getByTestId('tabla-productos')).toBeVisible();
  await page.evaluate(() => {
    const sesion = JSON.parse(sessionStorage.getItem('pharmasoft.sesion')!);
    const partes = sesion.token.split('.');
    partes[2] = (partes[2][0] === 'a' ? 'b' : 'a') + partes[2].slice(1);
    sesion.token = partes.join('.');
    sessionStorage.setItem('pharmasoft.sesion', JSON.stringify(sesion));
  });
  const rechazo = page.waitForResponse(
    (r) => r.url().includes('/api/v1/productos') && r.status() === 401,
  );
  await page.reload();
  await rechazo;
  await expect(page).toHaveURL(/\/login\?.*expirada=1/);
  await expect(page.getByText(/Su sesión expiró/)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('pharmasoft.sesion')))
    .toBeNull();
  await capturar(page, info, '14-token-alterado');
});
