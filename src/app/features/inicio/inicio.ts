import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  template: `
    <div class="card">
      <h1>Bienvenido a PharmaSoft</h1>
      <p>Sistema de gestión y administración del catálogo de la botica.</p>
      <a routerLink="/categorias" class="btn">Gestionar Categorías</a>
    </div>
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
    `,
  ],
})
export class Inicio {}
