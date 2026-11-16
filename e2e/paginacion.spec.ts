import { expect, test } from '@playwright/test';
import { capturar, iniciarSesion } from './apoyo';

test('productos pagina en el servidor y F5 conserva la URL', async ({ page }, info) => {
  await iniciarSesion(page, 'admin', '/productos');
  await expect(page.getByTestId('tabla-productos').locator('tbody tr')).toHaveCount(20);
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 1 de');
  const respuesta = page.waitForResponse(
    (r) =>
      r.url().includes('/api/v1/productos?') && new URL(r.url()).searchParams.get('pagina') === '1',
  );
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  const datos = await respuesta;
  expect(datos.status()).toBe(200);
  expect((await datos.json()).contenido).toHaveLength(20);
  await expect(page).toHaveURL(/pagina=1/);
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 2 de');
  await page.reload();
  await expect(page.getByTestId('pagina-actual')).toContainText('Página 2 de');
  await capturar(page, info, '06-paginacion');
});
