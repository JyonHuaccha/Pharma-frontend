import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { AuthService } from './auth-service';
import { authInterceptorInterceptor } from '../interceptors/auth-interceptor-interceptor';
import { errorInterceptorInterceptor } from '../interceptors/error-interceptor-interceptor';
import { environment } from '../../../environments/environment';
import { ProductoList } from '../../features/productos/pages/producto-list/producto-list';
import { AvisoSesion } from '../../shared/components/aviso-sesion/aviso-sesion';

describe('Flujos integrados S11', () => {
  let http: HttpTestingController;
  function guardar(segundos = 3600) {
    sessionStorage.setItem(
      'pharmasoft.sesion',
      JSON.stringify({
        token: 'jwt-firmado',
        expiraEn: Date.now() + segundos * 1000,
        username: 'vendedor',
        nombreCompleto: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER', 'VENTAS_LEER'],
      }),
    );
  }
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([authInterceptorInterceptor, errorInterceptorInterceptor]),
        ),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });
  for (const url of ['/productos/1/editar', '/ventas/nueva', '/inicio', '/mi-cuenta']) {
    it('G-01 sin sesión conserva returnUrl de ' + url, async () => {
      const h = await RouterTestingHarness.create(url);
      expect(TestBed.inject(Router).url).toBe('/login?returnUrl=' + encodeURIComponent(url));
      expect(h.routeNativeElement!.textContent).toContain('Iniciar sesión');
    });
  }
  it('I-04 no envía Bearer a un origen externo', () => {
    guardar();
    const client = TestBed.inject(HttpClient);
    let status = 0;
    client.get('https://example.com/logo.png').subscribe({ error: (e) => (status = e.status) });
    const r = http.expectOne('https://example.com/logo.png');
    expect(r.request.headers.has('Authorization')).toBe(false);
    r.flush('Not found', { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });
  it('I-02 y P-I01 un error de conexión muestra el mensaje y conserva la sesión', async () => {
    guardar();
    const h = await RouterTestingHarness.create('/productos');
    for (const r of http.match(() => true)) {
      if (r.request.url.includes('/productos')) r.error(new ProgressEvent('error'));
      else r.flush([]);
    }
    h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('No se pudo conectar con el servidor');
    expect(TestBed.inject(AuthService).token()).toBe('jwt-firmado');
    expect(TestBed.inject(Router).url).toBe('/productos');
  });
  it('I-03 un 401 de Ventas regresa a login con aviso y returnUrl', async () => {
    guardar();
    const h = await RouterTestingHarness.create('/ventas');
    const solicitudes = http.match(() => true);
    expect(solicitudes.some((r) => r.request.url.includes('/ventas'))).toBe(true);
    for (const r of solicitudes) {
      if (!r.cancelled)
        r.flush({ message: 'El token no es válido' }, { status: 401, statusText: 'Unauthorized' });
    }
    await h.fixture.whenStable();
    h.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/login?expirada=1&returnUrl=%2Fventas');
    expect(h.routeNativeElement!.textContent).toContain('Su sesión expiró');
    expect(TestBed.inject(AuthService).token()).toBeNull();
  });
  it('E-01 forzar la baja devuelve 403 y conserva el token y el mensaje', async () => {
    guardar();
    const h = await RouterTestingHarness.create('/productos');
    for (const r of http.match(() => true)) {
      r.flush(
        r.request.url.includes('/productos')
          ? { contenido: [], totalPaginas: 0, totalElementos: 0, pagina: 0, tamanio: 10 }
          : [],
      );
    }
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const tabla = h.routeNativeElement!.querySelector('app-producto-list');
    expect(tabla).not.toBeNull();
    const componente = TestBed.createComponent(ProductoList);
    componente.detectChanges();
    for (const r of http.match(() => true)) {
      r.flush(
        r.request.url.includes('/productos')
          ? { contenido: [], totalPaginas: 0, totalElementos: 0, pagina: 0, tamanio: 10 }
          : [],
      );
    }
    componente.componentInstance.darDeBaja({
      id: 999999999,
      nombre: 'Paracetamol',
      precio: 5,
      stock: 2,
      estado: true,
      categoriaId: 1,
      categoriaNombre: 'Analgésicos',
      fechaCreacion: '2026-10-25T19:00:00',
      fechaModificacion: '2026-10-25T19:00:00',
    });
    const r = http.expectOne(environment.apiUrl + '/productos/999999999');
    expect(r.request.method).toBe('DELETE');
    r.flush(
      { message: 'No tiene permisos para realizar esta operación' },
      { status: 403, statusText: 'Forbidden' },
    );
    componente.detectChanges();
    expect(componente.nativeElement.textContent).toContain('No tiene permisos');
    expect(TestBed.inject(AuthService).token()).toBe('jwt-firmado');
  });
  it('B-02 formatea 107 segundos como 01:47 y B-03 oculta el aviso', () => {
    vi.useFakeTimers();
    guardar(107);
    const f = TestBed.createComponent(AvisoSesion);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('01:47');
    expect(f.nativeElement.querySelector('[role=status]')).not.toBeNull();
    f.nativeElement.querySelector('.ocultar').click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role=status]')).toBeNull();
    expect(TestBed.inject(AuthService).token()).not.toBeNull();
  });
  it('B-05 el botón Cerrar sesión ahora termina la sesión y limpia el contador', () => {
    vi.useFakeTimers();
    guardar(107);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(AvisoSesion);
    f.detectChanges();
    f.nativeElement.querySelector('.acciones button').click();
    f.detectChanges();
    expect(TestBed.inject(AuthService).sesion()).toBeNull();
    expect(TestBed.inject(AuthService).segundosRestantes()).toBe(0);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: {} });
  });
});
