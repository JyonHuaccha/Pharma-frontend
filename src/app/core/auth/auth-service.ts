import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Perfil, PerfilServidor, PERMISOS, Permiso, Sesion } from './auth.model';
import { rutaInterna } from './ruta-interna';

const CLAVE_SESION = 'pharmasoft.sesion';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador?: ReturnType<typeof setTimeout>;
  private intervalo?: ReturnType<typeof setInterval>;

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);
  readonly segundosRestantes = signal(0);
  readonly avisoOculto = signal(false);
  readonly porVencer = computed(() => this.autenticado() && this.segundosRestantes() > 0 && this.segundosRestantes() <= 120);

  constructor() {
    const sesion = this.sesionActual();
    if (sesion) this.iniciarTemporizadores(sesion);
    inject(DestroyRef).onDestroy(() => this.limpiarTemporizadores());
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
        this.avisoOculto.set(false);
        this.iniciarTemporizadores(sesion);
      }),
    );
  }

  obtenerPerfil(): Observable<Perfil> {
    return this.http.get<PerfilServidor>(`${environment.apiUrl}/auth/me`).pipe(map(p => ({
      username: p.username, nombreCompleto: p.empleadoNombre, roles: p.roles, permisos: p.permisos,
    })));
  }

  ocultarAviso(): void { this.avisoOculto.set(true); }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    this.limpiarTemporizadores();
    this.borrarSesionGuardada();
    this.sesionActual.set(null);
    this.segundosRestantes.set(0);
    this.avisoOculto.set(false);
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

  private iniciarTemporizadores(sesion: Sesion): void {
    this.limpiarTemporizadores();
    this.actualizarRestante(sesion);
    this.intervalo = setInterval(() => {
      this.actualizarRestante(sesion);
      if (this.sesionActual() === sesion && Date.now() >= sesion.expiraEn) {
        this.cerrarSesion('expirada', this.router.url);
      }
    }, 1000);
    this.programarExpiracion(sesion);
  }

  private actualizarRestante(sesion: Sesion): void {
    this.segundosRestantes.set(Math.max(0, Math.floor((sesion.expiraEn - Date.now()) / 1000)));
  }

  private limpiarTemporizadores(): void {
    clearTimeout(this.temporizador);
    clearInterval(this.intervalo);
    this.temporizador = undefined;
    this.intervalo = undefined;
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
