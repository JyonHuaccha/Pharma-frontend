import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';
import { errorInterceptorInterceptor } from './error-interceptor-interceptor';

describe('errorInterceptor', () => {
  let http: HttpTestingController; let client: HttpClient;
  const auth = { cerrarSesion: vi.fn() }; const router = { url: '/productos?categoriaId=3' };
  beforeEach(() => {
    auth.cerrarSesion.mockClear(); router.url = '/productos?categoriaId=3';
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([errorInterceptorInterceptor])),
      provideHttpClientTesting(), { provide: AuthService, useValue: auth }, { provide: Router, useValue: router }] });
    http = TestBed.inject(HttpTestingController); client = TestBed.inject(HttpClient);
  });
  afterEach(() => http.verify());
  it('el 401 cierra sesion y vuelve a lanzar el error', () => {
    const error = vi.fn(); const url = environment.apiUrl + '/productos';
    client.get(url).subscribe({ error }); http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.cerrarSesion).toHaveBeenCalledWith('expirada', '/productos?categoriaId=3'); expect(error).toHaveBeenCalled();
  });
  it('el 403 conserva la sesion y el mensaje del backend', () => {
    const error = vi.fn(); const url = environment.apiUrl + '/reportes/productos-mas-vendidos';
    client.get(url).subscribe({ error }); http.expectOne(url).flush({ message: 'Sin permiso' }, { status: 403, statusText: 'Forbidden' });
    expect(auth.cerrarSesion).not.toHaveBeenCalled(); expect(error.mock.calls[0][0].error.message).toBe('Sin permiso');
  });
  for (const url of [environment.apiUrl + '/auth/login', 'https://otro.example/consulta']) {
    it('no cierra sesion por 401 en ' + url, () => {
      client.get(url).subscribe({ error: () => {} }); http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(auth.cerrarSesion).not.toHaveBeenCalled();
    });
  }
  it('no pierde el returnUrl si ya esta en login', () => {
    router.url = '/login?returnUrl=%2Fventas'; const url = environment.apiUrl + '/productos';
    client.get(url).subscribe({ error: () => {} }); http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.cerrarSesion).not.toHaveBeenCalled();
  });
});
