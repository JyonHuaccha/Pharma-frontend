import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth-service';
import { Permiso } from '../../core/auth/auth.model';
import { SiPermiso } from './si-permiso';

@Component({ imports: [SiPermiso], template: '<button *appSiPermiso="\'CATALOGO_ESCRIBIR\'">Editar</button>' })
class Ejemplo {}
describe('SiPermiso', () => {
  const permisos = signal<Permiso[]>([]);
  beforeEach(() => {
    permisos.set([]);
    TestBed.configureTestingModule({ imports: [Ejemplo], providers: [
      { provide: AuthService, useValue: { tienePermiso: (p: Permiso) => permisos().includes(p) } },
    ] });
  });
  it('oculta, muestra y retira la accion cuando cambian los permisos', async () => {
    const f = TestBed.createComponent(Ejemplo); await f.whenStable();
    expect(f.nativeElement.querySelector('button')).toBeNull();
    permisos.set(['CATALOGO_ESCRIBIR']); await f.whenStable();
    expect(f.nativeElement.querySelector('button')?.textContent).toBe('Editar');
    permisos.set([]); await f.whenStable();
    expect(f.nativeElement.querySelector('button')).toBeNull();
  });
  it('no duplica el elemento cuando conserva el permiso', async () => {
    permisos.set(['CATALOGO_ESCRIBIR']); const f = TestBed.createComponent(Ejemplo); await f.whenStable();
    permisos.set(['CATALOGO_LEER', 'CATALOGO_ESCRIBIR']); await f.whenStable();
    expect(f.nativeElement.querySelectorAll('button')).toHaveLength(1);
  });
});
