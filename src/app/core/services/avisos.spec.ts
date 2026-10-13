import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Avisos } from './avisos';

describe('Avisos', () => {
  afterEach(() => vi.useRealTimers());

  it('mantiene éxito y error durante 3 segundos', () => {
    vi.useFakeTimers();
    const avisos = TestBed.inject(Avisos);
    for (const tipo of ['exito', 'error'] as const) {
      avisos.mostrar('Mensaje', tipo);
      vi.advanceTimersByTime(2999);
      expect(avisos.mensaje()?.tipo).toBe(tipo);
      vi.advanceTimersByTime(1);
      expect(avisos.mensaje()).toBeNull();
    }
  });

  it('un aviso nuevo recibe sus propios 3 segundos', () => {
    vi.useFakeTimers();
    const avisos = TestBed.inject(Avisos);
    avisos.mostrar('Primero'); vi.advanceTimersByTime(2000);
    avisos.mostrar('Segundo'); vi.advanceTimersByTime(1000);
    expect(avisos.mensaje()?.texto).toBe('Segundo');
    vi.advanceTimersByTime(2000); expect(avisos.mensaje()).toBeNull();
  });

  it('requiere una decisión y permite cancelar', async () => {
    const avisos = TestBed.inject(Avisos);
    const respuesta = avisos.confirmar('Guardar', '¿Continuar?');
    expect(avisos.pregunta()).not.toBeNull();
    avisos.responder(false); expect(await respuesta).toBe(false);
    expect(avisos.pregunta()).toBeNull();
  });
});
