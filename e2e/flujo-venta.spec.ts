import { expect, test } from '@playwright/test';
import { capturar, iniciarSesion } from './apoyo';

test('el vendedor registra una venta y Productos refleja el stock', async ({ page }, info) => {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(response.url());
  });
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(process.env['E2E_CLIENTE'] ?? 'Mamani');
  await page.getByTestId('opcion-cliente').first().click();
  const nombre = process.env['E2E_PRODUCTO'] ?? 'Paracetamol S14';
  await page.getByTestId('buscar-producto').fill(nombre);
  const opcion = page.getByTestId('opcion-producto').filter({ hasText: nombre }).first();
  const stockAntes = Number(await opcion.getAttribute('data-stock'));
  expect(stockAntes).toBeGreaterThanOrEqual(2);
  await opcion.click();
  await page.getByTestId('cantidad').fill('2');
  await expect(page.getByTestId('total-venta')).not.toContainText('0.00');
  await page.getByRole('button', { name: 'Revisar venta', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirmar venta' });
  await dialog.getByRole('checkbox').uncheck();
  const registro = page.waitForResponse(
    (r) => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
  );
  await dialog.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  expect((await registro).status()).toBe(201);
  await expect(page.getByText('Venta registrada correctamente.')).toBeVisible();
  // Navegación Angular, sin recargar la página ni solicitar F5.
  await page.locator('a[href="/productos"]').first().click();
  const fila = page
    .getByTestId('tabla-productos')
    .locator('tbody tr')
    .filter({ hasText: nombre })
    .first();
  await expect(fila.locator('td').nth(3)).toHaveText(String(stockAntes - 2));
  expect(consoleErrors).toEqual([]);
  expect(serverErrors).toEqual([]);
  await capturar(page, info, '07-flujo-venta-stock');
});
