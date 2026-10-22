import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../auth/auth-service';
import { permisoGuardGuard } from './permiso-guard-guard';

describe('permisoGuard', () => {
  const auth = { tienePermiso: vi.fn() };
  beforeEach(() => {
    auth.tienePermiso.mockReturnValue(false);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });
  function ejecutar(data: Record<string, string>) {
    return TestBed.runInInjectionContext(() => permisoGuardGuard({ data } as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }
  it('sin permiso declarado deja pasar', () => { expect(ejecutar({})).toBe(true); });
  it('el permiso requerido habilita la pagina', () => {
    auth.tienePermiso.mockReturnValue(true); expect(ejecutar({ permiso: 'CATALOGO_ESCRIBIR' })).toBe(true);
    expect(auth.tienePermiso).toHaveBeenCalledWith('CATALOGO_ESCRIBIR');
  });
  it('sin permiso lleva a acceso denegado, no al login', () => {
    expect(TestBed.inject(Router).serializeUrl(ejecutar({ permiso: 'REPORTES_VER' }) as UrlTree)).toBe('/acceso-denegado');
  });
});
