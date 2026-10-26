import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth-service';
import { environment } from '../../../environments/environment';

describe('Sesión con aviso de expiración', () => {
  let http: HttpTestingController;
  let router: Router;
  const guardar = (segundos: number) =>
    sessionStorage.setItem(
      'pharmasoft.sesion',
      JSON.stringify({
        token: 'jwt-firmado',
        expiraEn: Date.now() + segundos * 1000,
        username: 'vendedor',
        nombreCompleto: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER'],
      }),
    );
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
    sessionStorage.clear();
  });
  it('B-01 avisa al llegar a 120 segundos de una sesión de tres minutos', () => {
    guardar(180);
    const auth = TestBed.inject(AuthService);
    expect(auth.porVencer()).toBe(false);
    vi.advanceTimersByTime(59000);
    expect(auth.segundosRestantes()).toBe(121);
    expect(auth.porVencer()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(auth.segundosRestantes()).toBe(120);
    expect(auth.porVencer()).toBe(true);
  });
  it('B-02 actualiza cada segundo y B-03 conserva la decisión de ocultar el aviso', () => {
    guardar(120);
    const auth = TestBed.inject(AuthService);
    auth.ocultarAviso();
    vi.advanceTimersByTime(13000);
    expect(auth.segundosRestantes()).toBe(107);
    expect(auth.avisoOculto()).toBe(true);
  });
  it('B-04 expira aunque se haya ocultado el aviso y elimina ambos temporizadores', () => {
    guardar(180);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/ventas');
    const auth = TestBed.inject(AuthService);
    auth.ocultarAviso();
    vi.advanceTimersByTime(180000);
    expect(auth.token()).toBeNull();
    expect(auth.segundosRestantes()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { expirada: '1', returnUrl: '/ventas' },
    });
  });
  it('cerrar sesión detiene el intervalo y el timeout sin redirecciones posteriores', () => {
    guardar(180);
    const auth = TestBed.inject(AuthService);
    auth.cerrarSesion();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(180000);
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
  it('una nueva sesión restablece el aviso y no conserva el intervalo anterior', () => {
    guardar(110);
    const auth = TestBed.inject(AuthService);
    auth.ocultarAviso();
    auth.cerrarSesion();
    auth.login({ username: 'vendedor', password: 'Vendedor2026*' }).subscribe();
    http
      .expectOne(environment.apiUrl + '/auth/login')
      .flush({
        token: 'jwt-nuevo',
        expiraEnSegundos: 180,
        username: 'vendedor',
        nombreCompleto: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER'],
      });
    expect(auth.avisoOculto()).toBe(false);
    expect(auth.segundosRestantes()).toBe(180);
    expect(vi.getTimerCount()).toBe(2);
  });
  it('limpia los temporizadores al destruir el servicio', () => {
    guardar(180);
    TestBed.inject(AuthService);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('consulta el perfil y adapta empleadoNombre sin modificar la sesión guardada', () => {
    guardar(180);
    const auth = TestBed.inject(AuthService);
    const anterior = sessionStorage.getItem('pharmasoft.sesion');
    let nombre = '';
    auth.obtenerPerfil().subscribe((p) => (nombre = p.nombreCompleto));
    http
      .expectOne(environment.apiUrl + '/auth/me')
      .flush({
        username: 'vendedor',
        empleadoNombre: 'Lucia Ramos Cutipa',
        roles: ['VENDEDOR'],
        permisos: ['CATALOGO_LEER'],
      });
    expect(nombre).toBe('Lucia Ramos Cutipa');
    expect(sessionStorage.getItem('pharmasoft.sesion')).toBe(anterior);
  });
});
