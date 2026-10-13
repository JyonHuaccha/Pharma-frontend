import { PaginaResponse } from '../models/pagina-response';

/** La API actual devuelve arreglos; se ordena y filtra antes de paginar. */
export function paginar<T>(lista: T[], pagina: number, tamanio: number): PaginaResponse<T> {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / tamanio));
  const actual = Math.max(0, Math.min(pagina, totalPaginas - 1));
  return {
    contenido: lista.slice(actual * tamanio, (actual + 1) * tamanio),
    pagina: actual, tamanio, totalElementos: lista.length, totalPaginas,
    ultima: actual + 1 >= totalPaginas,
  };
}
