import { describe, expect, it } from 'vitest';
import { paginar } from './paginar';

describe('paginar', () => {
  it('limita la página al reducir resultados y permite listas vacías', () => {
    expect(paginar([], 3, 5)).toEqual({ contenido: [], pagina: 0, tamanio: 5, totalElementos: 0, totalPaginas: 1, ultima: true });
    expect(paginar([1, 2, 3, 4, 5, 6], 3, 5).contenido).toEqual([6]);
  });
  it('no repite ni omite registros entre páginas', () => {
    const lista = Array.from({ length: 23 }, (_, i) => i);
    expect([0, 1, 2].flatMap(p => paginar(lista, p, 10).contenido)).toEqual(lista);
  });
});
