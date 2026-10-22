import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';
import { Sesion } from './auth.model';

const CLAVE = 'pharmasoft.sesion';
function sesion(): Sesion {
  return { token: 'jwt-prueba', expiraEn: Date.now() + 3600000, username: 'vendedor',
    nombreCompleto: 'Usuario de prueba', roles: ['VENDEDOR'], permisos: ['CATALOGO_LEER'] };
}
describe('AuthService', () => {
  let http: HttpTestingController; let router: Router;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController); router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });
  afterEach(() => { http.verify(); vi.useRealTimers(); sessionStorage.clear(); });
  it('guarda la sesion y su vencimiento sin guardar la contrasena', () => {
    const service = TestBed.inject(AuthService); const inicio = Date.now();
    service.login({ username: ' vendedor ', password: 'Clave2026' }).subscribe();
    const req = http.expectOne(environment.apiUrl + '/auth/login');
    expect(req.request.body).toEqual({ username: 'vendedor', password: 'Clave2026' });
    req.flush({ token: 'jwt-prueba', tipo: 'Bearer', expiraEnSegundos: 3600,
      username: 'vendedor', nombreCompleto: 'Usuario de prueba', roles: ['VENDEDOR'], permisos: ['CATALOGO_LEER'] });
    expect(service.token()).toBe('jwt-prueba');
    expect(service.sesion()!.expiraEn).toBeGreaterThanOrEqual(inicio + 3600000);
    expect(JSON.parse(sessionStorage.getItem(CLAVE)!)).toEqual(service.sesion());
    expect(sessionStorage.getItem(CLAVE)).not.toContain('Clave2026');
    expect(service.tienePermiso('CATALOGO_LEER')).toBe(true);
    expect(service.tienePermiso('REPORTES_VER')).toBe(false);
  });
  it('recupera una sesion vigente tras una recarga', () => {
    const s = sesion(); sessionStorage.setItem(CLAVE, JSON.stringify(s));
    const service = TestBed.inject(AuthService);
    expect(service.sesion()).toEqual(s); expect(service.autenticado()).toBe(true);
  });
  for (const caso of ['json roto', 'vencida', 'sin permisos', 'sin vencimiento', 'vencimiento texto']) {
    it('descarta sesion ' + caso, () => {
      const s: any = sesion();
      if (caso === 'vencida') s.expiraEn = Date.now() - 1;
      if (caso === 'sin permisos') delete s.permisos;
      if (caso === 'sin vencimiento') delete s.expiraEn;
      if (caso === 'vencimiento texto') s.expiraEn = 'no-es-fecha';
      sessionStorage.setItem(CLAVE, caso === 'json roto' ? '{roto' : JSON.stringify(s));
      expect(TestBed.inject(AuthService).token()).toBeNull(); expect(sessionStorage.getItem(CLAVE)).toBeNull();
    });
  }
  it('un login fallido no crea sesion', () => {
    const service = TestBed.inject(AuthService);
    service.login({ username: 'inactivo', password: 'Clave2026' }).subscribe({ error: () => {} });
    http.expectOne(environment.apiUrl + '/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(service.sesion()).toBeNull(); expect(sessionStorage.getItem(CLAVE)).toBeNull();
  });
  it('no guarda respuestas de login incompletas', () => {
    const service = TestBed.inject(AuthService);
    service.login({ username: 'vendedor', password: 'Clave2026' }).subscribe({ error: () => {} });
    http.expectOne(environment.apiUrl + '/auth/login').flush({ token: 'jwt-prueba', expiraEnSegundos: 3600 });
    expect(service.sesion()).toBeNull();
  });
  it('al vencer cierra sesion y recuerda la pagina con filtros', () => {
    vi.useFakeTimers();
    sessionStorage.setItem(CLAVE, JSON.stringify({ ...sesion(), expiraEn: Date.now() + 1000 }));
    vi.spyOn(router, 'url', 'get').mockReturnValue('/productos?categoriaId=3');
    const service = TestBed.inject(AuthService); vi.advanceTimersByTime(1001);
    expect(service.token()).toBeNull(); expect(sessionStorage.getItem(CLAVE)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expirada: '1', returnUrl: '/productos?categoriaId=3' } });
  });
  it('no usa tokens vencidos aunque el temporizador aun no se ejecute', () => {
    vi.useFakeTimers(); const s = sesion(); sessionStorage.setItem(CLAVE, JSON.stringify(s));
    const service = TestBed.inject(AuthService); vi.setSystemTime(s.expiraEn + 1);
    expect(service.token()).toBeNull(); expect(service.tienePermiso('CATALOGO_LEER')).toBe(false);
  });
  it('cerrar sesion borra el almacenamiento y cancela la expiracion anterior', () => {
    vi.useFakeTimers(); sessionStorage.setItem(CLAVE, JSON.stringify({ ...sesion(), expiraEn: Date.now() + 1000 }));
    const service = TestBed.inject(AuthService); service.cerrarSesion(); vi.advanceTimersByTime(2000);
    expect(service.sesion()).toBeNull(); expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: {} });
  });
});
