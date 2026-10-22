import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { Login } from './login';

describe('Login', () => {
  let f: ReturnType<typeof TestBed.createComponent<Login>>; let http: HttpTestingController; let router: Router;
  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [Login], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController); router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    f = TestBed.createComponent(Login); await f.whenStable();
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); });
  function llenar() { f.componentInstance['form'].setValue({ username: 'vendedor', password: 'Clave2026' }); }
  function responder() {
    http.expectOne(environment.apiUrl + '/auth/login').flush({
      token: 'jwt-prueba', tipo: 'Bearer', expiraEnSegundos: 3600, username: 'vendedor',
      nombreCompleto: 'Usuario de prueba', roles: ['VENDEDOR'], permisos: ['CATALOGO_LEER'],
    });
  }
  it('el formulario vacio muestra ambos errores sin enviar peticiones', async () => {
    f.nativeElement.querySelector('button[type=submit]').click(); await f.whenStable();
    expect(f.nativeElement.querySelectorAll('.error')).toHaveLength(2);
    http.expectNone(environment.apiUrl + '/auth/login');
  });
  it('un username solo con espacios no se envia', () => {
    f.componentInstance['form'].setValue({ username: '   ', password: 'Clave2026' }); f.componentInstance.ingresar();
    http.expectNone(environment.apiUrl + '/auth/login');
  });
  it('un 401 conserva el usuario, limpia la clave y permite reintentar', async () => {
    llenar(); f.componentInstance.ingresar();
    http.expectOne(environment.apiUrl + '/auth/login').flush({ message: 'Usuario o contraseña incorrectos' }, { status: 401, statusText: 'Unauthorized' });
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role=alert]')?.textContent).toContain('Usuario o contraseña incorrectos');
    expect(f.componentInstance['form'].getRawValue()).toEqual({ username: 'vendedor', password: '' });
    expect(f.componentInstance['enviando']()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
  it('ignora el segundo envio mientras espera respuesta', () => {
    llenar(); f.componentInstance.ingresar(); f.componentInstance.ingresar();
    expect(http.match(environment.apiUrl + '/auth/login')).toHaveLength(1);
  });
  it('vuelve a la ruta interna solicitada', () => {
    f.componentRef.setInput('returnUrl', '/ventas?estado=REGISTRADA');
    llenar(); f.componentInstance.ingresar(); responder();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/ventas?estado=REGISTRADA');
  });
  for (const url of ['https://otro.example', '//otro.example', '/\\otro.example', '/login?returnUrl=/ventas']) {
    it('descarta el destino inseguro o circular ' + url, () => {
      f.componentRef.setInput('returnUrl', url); llenar(); f.componentInstance.ingresar(); responder();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/inicio');
    });
  }
  it('muestra el aviso recibido por expiracion', async () => {
    f.componentRef.setInput('expirada', '1'); await f.whenStable();
    expect(f.nativeElement.querySelector('[role=status]')?.textContent).toContain('Su sesión expiró');
  });
  it('el control de mostrar contrasena cambia el tipo del campo', async () => {
    expect(f.nativeElement.querySelector('#password').type).toBe('password');
    f.nativeElement.querySelector('input[type=checkbox]').click(); await f.whenStable();
    expect(f.nativeElement.querySelector('#password').type).toBe('text');
  });
});
