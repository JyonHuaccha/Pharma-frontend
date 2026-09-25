import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  template: `
    <div class="error-container">
      <h2>404</h2>
      <p>Página no encontrada</p>
      <a routerLink="/inicio">Volver al inicio</a>
    </div>
  `,
  styles: [
    `
      .error-container {
        text-align: center;
        margin-top: 80px;
      }
      h2 {
        font-size: 72px;
        color: #0f2e5c;
        margin-bottom: 0;
      }
      p {
        color: #64748b;
        font-size: 18px;
        margin: 10px 0 20px;
      }
      a {
        color: #2563eb;
        text-decoration: underline;
      }
    `,
  ],
})
export class NoEncontrado {}
