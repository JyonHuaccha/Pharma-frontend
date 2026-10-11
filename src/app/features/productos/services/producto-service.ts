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

  listar(
    pagina: number,
    tamanio: number,
    ordenarPor: OrdenProducto,
    direccion: Direccion,
  ): Observable<PaginaResponse<Producto>> {
    return this.http.get<Producto[]>(this.url).pipe(
      map((lista): PaginaResponse<Producto> => {
        const ordenada = [...lista].sort((a: any, b: any) => {
          const x = a[ordenarPor];
          const y = b[ordenarPor];
          const r = typeof x === 'string' ? x.localeCompare(y) : x - y;
          return direccion === 'asc' ? r : -r;
        });

        const inicio = pagina * tamanio;

        return {
          contenido: ordenada.slice(inicio, inicio + tamanio),
          pagina,
          tamanio,
          totalElementos: ordenada.length,
          totalPaginas: Math.max(1, Math.ceil(ordenada.length / tamanio)),
          ultima: (pagina + 1) * tamanio >= ordenada.length,
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
