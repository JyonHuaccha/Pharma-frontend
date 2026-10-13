import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { Direccion, OrdenProducto, Producto, ProductoRequest } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/productos`;

  listarTodos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.url);
  }

  listar(
    pagina: number,
    tamanio: number,
    ordenarPor: OrdenProducto,
    direccion: Direccion,
    categoriaId?: number | null,
  ): Observable<PaginaResponse<Producto>> {
    return this.http.get<Producto[]>(this.url).pipe(
      map((lista): PaginaResponse<Producto> => {
        const filtrada =
          categoriaId == null ? lista : lista.filter((producto) => producto.categoriaId === categoriaId);

        const ordenada = [...filtrada].sort((a: Producto, b: Producto) => {
          const x = a[ordenarPor];
          const y = b[ordenarPor];
          const r =
            typeof x === 'string' && typeof y === 'string'
              ? x.localeCompare(y)
              : Number(x) - Number(y);
          return direccion === 'asc' ? r : -r;
        });

        const inicio = pagina * tamanio;
        const totalElementos = ordenada.length;
        const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamanio));
        const contenido = ordenada.slice(inicio, inicio + tamanio);

        return {
          contenido,
          pagina,
          tamanio,
          totalElementos,
          totalPaginas,
          ultima: pagina >= totalPaginas - 1,
        } as PaginaResponse<Producto>;
      }),
    );
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.url}/${id}`);
  }

  crear(dto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.url, dto);
  }

  actualizar(id: number, dto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.url}/${id}`, dto);
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
