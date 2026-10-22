import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';
import { authInterceptorInterceptor } from './auth-interceptor-interceptor';

describe('authInterceptor', () => {
  let http: HttpTestingController; let client: HttpClient;
  const auth = { token: vi.fn() };
  beforeEach(() => {
    auth.token.mockReturnValue('jwt-prueba');
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptorInterceptor])), provideHttpClientTesting(),
      { provide: AuthService, useValue: auth },
    ] });
    http = TestBed.inject(HttpTestingController); client = TestBed.inject(HttpClient);
  });
  afterEach(() => http.verify());
  it('agrega Bearer a la API', () => {
    const url = environment.apiUrl + '/productos'; client.get(url).subscribe();
    const r = http.expectOne(url);
    expect(r.request.headers.get('Authorization')).toBe('Bearer jwt-prueba'); r.flush([]);
  });
  it('sin sesion no inventa un encabezado', () => {
    auth.token.mockReturnValue(null); const url = environment.apiUrl + '/productos';
    client.get(url).subscribe(); const r = http.expectOne(url);
    expect(r.request.headers.has('Authorization')).toBe(false); r.flush([]);
  });
  for (const url of ['https://otro.example/api/v1/productos', environment.apiUrl + '-otro/productos', environment.apiUrl + '/auth/login', environment.apiUrl + '/auth/login?prueba=1']) {
    it('no envia el token a ' + url, () => {
      client.get(url).subscribe(); const r = http.expectOne(url);
      expect(r.request.headers.has('Authorization')).toBe(false); r.flush({});
    });
  }
});
