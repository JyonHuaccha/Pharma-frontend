import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, PERMISOS, Permiso, Sesion } from './auth.model';
import { rutaInterna } from './ruta-interna';

const CLAVE_SESION = 'pharmasoft.sesion';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador?: ReturnType<typeof setTimeout>;

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);

  constructor() {
    const sesion = this.sesionActual();
    if (sesion) this.programarExpiracion(sesion);
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  login(credenciales: LoginRequest): Observable<Sesion> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
      username: credenciales.username.trim(), password: credenciales.password,
    }).pipe(
      map(respuesta => {
        const sesion: Sesion = {
          token: respuesta.token,
          expiraEn: Date.now() + respuesta.expiraEnSegundos * 1000,
          username: respuesta.username,
          nombreCompleto: respuesta.nombreCompleto,
          roles: respuesta.roles,
          permisos: respuesta.permisos,
        };
        if (!this.sesionValida(sesion)) throw new Error('La respuesta de inicio de sesión no es válida.');
        return sesion;
      }),
      tap(sesion => {
        try { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion)); } catch { /* Sesión en memoria. */ }
        this.sesionActual.set(sesion);
        this.programarExpiracion(sesion);
      }),
    );
  }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    clearTimeout(this.temporizador);
    this.borrarSesionGuardada();
    this.sesionActual.set(null);
    const queryParams: Record<string, string> = {};
    if (motivo) queryParams['expirada'] = '1';
    const destino = rutaInterna(volverA);
    if (destino) queryParams['returnUrl'] = destino;
    void this.router.navigate(['/login'], { queryParams });
  }

  token(): string | null {
    const sesion = this.sesionActual();
    return sesion && Date.now() < sesion.expiraEn ? sesion.token : null;
  }

  tienePermiso(permiso: Permiso): boolean {
    return this.token() !== null && (this.sesionActual()?.permisos.includes(permiso) ?? false);
  }

  private programarExpiracion(sesion: Sesion): void {
    clearTimeout(this.temporizador);
    const restante = Math.max(0, sesion.expiraEn - Date.now());
    this.temporizador = setTimeout(() => {
      if (this.sesionActual() !== sesion) return;
      if (Date.now() < sesion.expiraEn) this.programarExpiracion(sesion);
      else this.cerrarSesion('expirada', this.router.url);
    }, Math.min(restante, 2_147_483_647));
  }

  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const sesion: unknown = JSON.parse(texto);
      if (this.sesionValida(sesion)) return sesion;
    } catch { /* Se descarta el almacenamiento ilegible o no disponible. */ }
    this.borrarSesionGuardada();
    return null;
  }

  private sesionValida(valor: unknown): valor is Sesion {
    if (!valor || typeof valor !== 'object') return false;
    const s = valor as Partial<Sesion>;
    return typeof s.token === 'string' && s.token.trim().length > 0
      && typeof s.expiraEn === 'number' && Number.isFinite(s.expiraEn) && s.expiraEn > Date.now()
      && typeof s.username === 'string' && s.username.trim().length > 0
      && typeof s.nombreCompleto === 'string'
      && Array.isArray(s.roles) && s.roles.every(rol => typeof rol === 'string')
      && Array.isArray(s.permisos) && s.permisos.every(permiso => PERMISOS.includes(permiso));
  }

  private borrarSesionGuardada(): void {
    try { sessionStorage.removeItem(CLAVE_SESION); } catch { /* Almacenamiento no disponible. */ }
  }
}
