import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../auth/auth-service';
import { authGuardGuard, invitadoGuard } from './auth-guard-guard';

describe('guards de sesion', () => {
  const auth = { token: vi.fn() }; const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/ventas?desde=2026-10-22' } as RouterStateSnapshot;
  beforeEach(() => {
    auth.token.mockReturnValue(null);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });
  it('sin token recuerda ruta y filtros', () => {
    const r = TestBed.runInInjectionContext(() => authGuardGuard(route, state)) as UrlTree;
    expect(r.queryParams['returnUrl']).toBe(state.url); expect(TestBed.inject(Router).serializeUrl(r)).toContain('/login?');
  });
  it('con token deja pasar', () => {
    auth.token.mockReturnValue('jwt-prueba');
    expect(TestBed.runInInjectionContext(() => authGuardGuard(route, state))).toBe(true);
  });
  it('un invitado puede entrar al login', () => {
    expect(TestBed.runInInjectionContext(() => invitadoGuard(route, state))).toBe(true);
  });
  it('con sesion redirige desde login a inicio', () => {
    auth.token.mockReturnValue('jwt-prueba');
    const r = TestBed.runInInjectionContext(() => invitadoGuard(route, state)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(r)).toBe('/inicio');
  });
});
