import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Avisos {
  readonly mensaje = signal<{ texto: string; tipo: 'exito' | 'error' } | null>(null);
  readonly pregunta = signal<{ titulo: string; texto: string; accion: string } | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;
  private resolver?: (valor: boolean) => void;

  mostrar(texto: string, tipo: 'exito' | 'error' = 'exito'): void {
    this.cerrar();
    this.mensaje.set({ texto, tipo });
    this.temporizador = setTimeout(() => this.mensaje.set(null), 3000);
  }

  cerrar(): void {
    clearTimeout(this.temporizador);
    this.mensaje.set(null);
  }

  confirmar(titulo: string, texto: string, accion = 'Guardar'): Promise<boolean> {
    if (this.resolver) return Promise.resolve(false);
    this.pregunta.set({ titulo, texto, accion });
    return new Promise(resolve => this.resolver = resolve);
  }

  responder(valor: boolean): void {
    const resolver = this.resolver;
    this.resolver = undefined;
    this.pregunta.set(null);
    resolver?.(valor);
  }
}
