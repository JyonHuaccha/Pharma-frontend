import { expect, test } from '@playwright/test';
import { capturar, iniciarSesion } from './apoyo';

test('una ruta protegida lleva al login con returnUrl', async ({ page }, info) => {
  await page.goto('/ventas');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fventas/);
  await capturar(page, info, '01-ruta-protegida');
});

test('credenciales incorrectas muestran el mensaje del backend', async ({ page }, info) => {
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill('admin');
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Usuario o contraseña incorrectos');
  await capturar(page, info, '02-login-fallido');
});

test('el login regresa a la página solicitada', async ({ page }, info) => {
  await iniciarSesion(page, 'vendedor', '/ventas');
  await expect(page).toHaveURL(/\/ventas$/);
  await expect(page.getByTestId('tabla-ventas')).toBeVisible();
  await capturar(page, info, '03-return-url');
});
