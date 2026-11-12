import { expect, Page, TestInfo } from '@playwright/test';

export type RolPrueba = 'admin' | 'vendedor' | 'almacen';

export async function iniciarSesion(page: Page, rol: RolPrueba, ruta = '/inicio') {
  const clave = process.env[`E2E_${rol.toUpperCase()}_PASSWORD`];
  if (!clave) throw new Error(`Define E2E_${rol.toUpperCase()}_PASSWORD en el entorno local`);
  await page.goto(ruta);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Usuario', { exact: true }).fill(rol);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

export async function capturar(page: Page, info: TestInfo, nombre: string) {
  await info.attach(nombre, {
    body: await page.screenshot({
      mask: [page.getByText(/DNI\s*:?\s*\d{8}/i)],
      maskColor: '#DCE3EC',
    }),
    contentType: 'image/png',
  });
}
