import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { PERMISOS, Permiso } from './auth.model';
import { authInterceptorInterceptor } from '../interceptors/auth-interceptor-interceptor';
import { errorInterceptorInterceptor } from '../interceptors/error-interceptor-interceptor';

describe('Seguridad de rutas y acciones con los componentes reales', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptorInterceptor, errorInterceptorInterceptor])),
      provideHttpClientTesting(), provideRouter(routes, withComponentInputBinding()),
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); });
  function guardar(permisos: Permiso[], roles = ['VENDEDOR']) {
    sessionStorage.setItem('pharmasoft.sesion', JSON.stringify({ token: 'jwt-prueba',
      expiraEn: Date.now() + 3600000, username: 'prueba', nombreCompleto: 'Usuario de prueba', roles, permisos }));
  }
  function responderConsultas() {
    for (const req of http.match(() => true)) {
      if (!req.cancelled) req.flush(req.request.url.endsWith('/productos') ? [{ id: 1, nombre: 'Producto de prueba',
        precio: 4, stock: 10, estado: true, categoriaId: 1, categoriaNombre: 'Categoria de prueba' }] : []);
    }
  }
  it('sin sesion la URL de ventas muestra el login fuera del layout y recuerda la ruta', async () => {
    const h = await RouterTestingHarness.create('/ventas');
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fventas');
    expect(h.routeNativeElement!.querySelector('app-header')).toBeNull();
    expect(h.routeNativeElement!.textContent).toContain('Iniciar sesión');
  });
  it('vendedor consulta productos sin boton nuevo, edicion ni columna acciones', async () => {
    guardar(['CATALOGO_LEER', 'CLIENTES_LEER', 'VENTAS_LEER', 'VENTAS_REGISTRAR']);
    const h = await RouterTestingHarness.create('/productos'); responderConsultas(); h.detectChanges();
    const html = h.routeNativeElement!;
    expect(html.textContent).toContain('Producto de prueba');
    expect(html.querySelector('a[routerLink="nuevo"]')).toBeNull();
    expect([...html.querySelectorAll('th')].some(th => th.textContent?.includes('Acciones'))).toBe(false);
    expect(html.textContent).not.toContain('Dar de baja');
    expect(html.querySelector('a[href="/ventas"]')).not.toBeNull();
    expect(html.querySelector('a[href="/reportes/ventas-por-categoria"]')).toBeNull();
  });
  for (const url of ['/productos/nuevo', '/productos/1/editar', '/categorias/nuevo', '/reportes/ventas-por-categoria']) {
    it('vendedor no abre la URL protegida ' + url, async () => {
      guardar(['CATALOGO_LEER', 'VENTAS_LEER']);
      const h = await RouterTestingHarness.create(url);
      expect(TestBed.inject(Router).url).toBe('/acceso-denegado');
      expect(h.routeNativeElement!.textContent).toContain('Acceso denegado');
      http.expectNone(r => r.url.endsWith('/productos') || r.url.endsWith('/reportes/ventas-por-categoria'));
    });
  }
  it('almacenero ve edicion del catalogo pero no ventas ni clientes', async () => {
    guardar(['CATALOGO_LEER', 'CATALOGO_ESCRIBIR'], ['ALMACENERO']);
    const h = await RouterTestingHarness.create('/productos'); responderConsultas(); h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('Nuevo producto');
    expect(h.routeNativeElement!.textContent).toContain('Dar de baja');
    expect(h.routeNativeElement!.querySelector('a[href="/ventas"]')).toBeNull();
    expect(h.routeNativeElement!.querySelector('a[href="/clientes"]')).toBeNull();
    await h.navigateByUrl('/ventas');
    expect(TestBed.inject(Router).url).toBe('/acceso-denegado');
  });
  it('supervisor tiene ventas y edicion del catalogo por la union de permisos', async () => {
    guardar(['CATALOGO_LEER', 'CATALOGO_ESCRIBIR', 'VENTAS_LEER', 'VENTAS_REGISTRAR'], ['VENDEDOR', 'ALMACENERO']);
    const h = await RouterTestingHarness.create('/productos'); responderConsultas(); h.detectChanges();
    expect(h.routeNativeElement!.querySelector('a[href="/ventas"]')).not.toBeNull();
    expect(h.routeNativeElement!.textContent).toContain('Nuevo producto');
    expect(h.routeNativeElement!.textContent).toContain('ALMACENERO');
  });
  it('admin conserva el acceso a clientes y reportes', async () => {
    guardar([...PERMISOS], ['ADMIN']);
    const h = await RouterTestingHarness.create('/inicio');
    expect(h.routeNativeElement!.querySelector('a[href="/reportes/ventas-por-categoria"]')).not.toBeNull();
    expect(h.routeNativeElement!.querySelector('a[href="/clientes"]')).not.toBeNull();
  });
});
