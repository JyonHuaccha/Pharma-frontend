import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MiCuenta, mismosPermisos } from './mi-cuenta';
import { environment } from '../../../../../environments/environment';

describe('Mi cuenta', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.setItem(
      'pharmasoft.sesion',
      JSON.stringify({
        token: 'jwt-firmado',
        expiraEn: Date.now() + 3600000,
        username: 'vendedor',
        nombreCompleto: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER'],
      }),
    );
    TestBed.configureTestingModule({
      imports: [MiCuenta],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    sessionStorage.clear();
  });
  it('muestra carga, nombre del servidor, roles y permisos concedidos o denegados', () => {
    const f = TestBed.createComponent(MiCuenta);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Cargando los datos');
    http
      .expectOne(environment.apiUrl + '/auth/me')
      .flush({
        username: 'vendedor',
        empleadoNombre: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER'],
      });
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Lucia Ramos Cutipa');
    expect(f.nativeElement.querySelectorAll('.modulo').length).toBe(5);
    expect(f.nativeElement.querySelectorAll('.concedido').length).toBe(1);
    expect(f.nativeElement.querySelectorAll('.denegado').length).toBe(7);
    expect(f.nativeElement.textContent).not.toContain('Sus permisos cambiaron');
  });
  it('avisa de permisos cambiados sin reemplazar los permisos de la sesión', () => {
    const f = TestBed.createComponent(MiCuenta);
    f.detectChanges();
    http
      .expectOne(environment.apiUrl + '/auth/me')
      .flush({
        username: 'vendedor',
        empleadoNombre: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER', 'REPORTES_VER'],
      });
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Sus permisos cambiaron');
    expect(JSON.parse(sessionStorage.getItem('pharmasoft.sesion')!).permisos).toEqual([
      'CATALOGO_LEER',
    ]);
  });
  it('muestra error de conexión y permite reintentar', () => {
    const f = TestBed.createComponent(MiCuenta);
    f.detectChanges();
    http.expectOne(environment.apiUrl + '/auth/me').error(new ProgressEvent('error'));
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No se pudo conectar');
    f.nativeElement.querySelector('.error button').click();
    f.detectChanges();
    http
      .expectOne(environment.apiUrl + '/auth/me')
      .flush({
        username: 'vendedor',
        empleadoNombre: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER'],
      });
    f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('No se pudo conectar');
  });
  it('compara conjuntos de permisos sin depender del orden ni de duplicados', () => {
    expect(mismosPermisos(['A', 'B'], ['B', 'A', 'A'])).toBe(true);
    expect(mismosPermisos(['A'], ['A', 'B'])).toBe(false);
  });
});
