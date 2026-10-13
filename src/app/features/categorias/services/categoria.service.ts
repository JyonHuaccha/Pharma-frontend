import { PaginaResponse } from '../../../core/models/pagina-response';
import { paginar } from '../../../core/utils/paginar';
import { coincide } from '../../../core/utils/textos';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Categoria, CategoriaRequest } from '../models/categoria.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url);
  }

  listarPagina(pagina: number, tamanio: number, campo: 'id' | 'nombre' | 'descripcion' | 'estado', direccion: 'asc' | 'desc', texto = ''): Observable<PaginaResponse<Categoria>> {
    return this.listar().pipe(map(lista => {
      const filtrada = lista.filter(c => coincide(texto, c.nombre, c.descripcion ?? ''));
      filtrada.sort((a, b) => {
        const orden = campo === 'id' ? a.id - b.id
          : String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'es', { sensitivity: 'base' });
        return (direccion === 'asc' ? orden : -orden) || a.id - b.id;
      });
      return paginar(filtrada, pagina, tamanio);
    }));
  }

  obtener(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.url}/${id}`);
  }

  crear(dto: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.url, dto);
  }

  actualizar(id: number, dto: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
