import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Avisos } from '../../core/services/avisos';

@Component({
  selector: 'app-avisos',
  template: `
    <div aria-live="polite" aria-atomic="true">
      @if (avisos.mensaje(); as mensaje) {
        <aside class="aviso" [class.error]="mensaje.tipo === 'error'">
          <span class="icono" aria-hidden="true">{{ mensaje.tipo === 'exito' ? '✓' : '!' }}</span>
          <div><strong>{{ mensaje.tipo === 'exito' ? 'Operación completada' : 'No se pudo completar' }}</strong><p>{{ mensaje.texto }}</p></div>
          <button type="button" class="cerrar" aria-label="Cerrar mensaje" (click)="avisos.cerrar()">×</button>
        </aside>
      }
    </div>
    <dialog #dialogo aria-labelledby="confirmacion-titulo" aria-describedby="confirmacion-texto" (cancel)="cancelar($event)">
      @if (avisos.pregunta(); as pregunta) {
        <span class="etiqueta">CONFIRMACIÓN</span>
        <h2 id="confirmacion-titulo">{{ pregunta.titulo }}</h2>
        <p id="confirmacion-texto">{{ pregunta.texto }}</p>
        <footer><button type="button" autofocus (click)="avisos.responder(false)">Cancelar</button><button type="button" class="principal" (click)="avisos.responder(true)">{{ pregunta.accion }}</button></footer>
      }
    </dialog>
  `,
  styleUrl: './avisos.css',
})
export class AvisosComponent {
  protected readonly avisos = inject(Avisos);
  private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const pregunta = this.avisos.pregunta();
      const dialogo = this.dialogo()?.nativeElement;
      if (!dialogo) return;
      if (pregunta && !dialogo.open) dialogo.showModal();
      if (!pregunta && dialogo.open) dialogo.close();
    });
  }

  protected cancelar(event: Event): void {
    event.preventDefault();
    this.avisos.responder(false);
  }
}
