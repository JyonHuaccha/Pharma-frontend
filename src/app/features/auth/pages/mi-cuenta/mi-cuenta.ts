import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { Perfil } from '../../../../core/auth/auth.model';
import { mensajeError } from '../../../../core/utils/http-error';

export const MODULOS_PERFIL = [
  {
    nombre: 'Catálogo',
    permisos: [
      { codigo: 'CATALOGO_LEER', nombre: 'Consultar catálogo' },
      { codigo: 'CATALOGO_ESCRIBIR', nombre: 'Administrar catálogo' },
    ],
  },
  {
    nombre: 'Clientes',
    permisos: [
      { codigo: 'CLIENTES_LEER', nombre: 'Consultar clientes' },
      { codigo: 'CLIENTES_ESCRIBIR', nombre: 'Administrar clientes' },
    ],
  },
  {
    nombre: 'Ventas',
    permisos: [
      { codigo: 'VENTAS_LEER', nombre: 'Consultar ventas' },
      { codigo: 'VENTAS_REGISTRAR', nombre: 'Registrar ventas' },
    ],
  },
  { nombre: 'Reportes', permisos: [{ codigo: 'REPORTES_VER', nombre: 'Consultar reportes' }] },
  {
    nombre: 'Usuarios',
    permisos: [{ codigo: 'USUARIOS_ADMINISTRAR', nombre: 'Administrar usuarios' }],
  },
];

export function mismosPermisos(a: readonly string[], b: readonly string[]): boolean {
  const primero = new Set(a);
  const segundo = new Set(b);
  return primero.size === segundo.size && [...primero].every((p) => segundo.has(p));
}

@Component({
  selector: 'app-mi-cuenta',
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css',
})
export class MiCuenta {
  protected readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly perfil = signal<Perfil | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly modulos = MODULOS_PERFIL;
  protected readonly permisosCambiaron = computed(() => {
    const perfil = this.perfil();
    const sesion = this.auth.sesion();
    return !!perfil && !!sesion && !mismosPermisos(perfil.permisos, sesion.permisos);
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set(null);
    this.perfil.set(null);
    this.auth
      .obtenerPerfil()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (perfil) => this.perfil.set(perfil),
        error: (error: HttpErrorResponse) => this.error.set(mensajeError(error)),
      });
  }
}
