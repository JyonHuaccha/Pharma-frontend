import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { MasVendidos } from './mas-vendidos';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, MasVendidos],
  template: `
    <div class="card">
      <h1>Bienvenido a PharmaSoft</h1>
      <p>Sistema de gestión y administración del catálogo de la botica.</p>
      <a routerLink="/categorias" class="btn">Gestionar Categorías</a>
    </div>
    @if (auth.tienePermiso('REPORTES_VER')) {
      @defer (on viewport) {
        <app-mas-vendidos />
      } @placeholder {
        <p class="card reporte-pendiente">Productos más vendidos</p>
      } @loading (minimum 300ms) {
        <p class="card" role="status">Cargando reporte…</p>
      } @error {
        <p class="card" role="alert">No se pudo cargar el reporte. Recargue la página.</p>
      }
    }
  `,
  styles: [
    `
      .card {
        background: white;
        padding: 32px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      h1 {
        color: #0f2e5c;
        margin-bottom: 12px;
      }
      p {
        color: #475569;
        margin-bottom: 20px;
      }
      .btn {
        background: #1e3a8a;
        color: white;
        padding: 10px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
      }
      .btn:hover {
        background: #1d4ed8;
      }
      .reporte-pendiente {
        margin-top: 40vh;
      }
    `,
  ],
})
export class Inicio {
  protected readonly auth = inject(AuthService);
}
