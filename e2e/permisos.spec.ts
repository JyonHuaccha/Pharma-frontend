import { expect, test } from '@playwright/test';
import { capturar, iniciarSesion } from './apoyo';

test('el almacenero no ve Ventas y su URL está denegada', async ({ page }, info) => {
  await iniciarSesion(page, 'almacen');
  await expect(page.locator('a[href="/ventas"]')).toHaveCount(0);
  await page.goto('/ventas');
  await expect(page.getByRole('heading', { name: /Acceso denegado/ })).toBeVisible();
  await capturar(page, info, '04-permiso-almacen');
});

test('el vendedor consulta productos sin acciones de edición', async ({ page }, info) => {
  await iniciarSesion(page, 'vendedor', '/productos');
  await expect(page.getByTestId('tabla-productos')).toBeVisible();
  await expect(page.getByRole('link', { name: /Nuevo producto/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Editar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dar de baja', exact: true })).toHaveCount(0);
  await capturar(page, info, '05-permiso-vendedor');
});
