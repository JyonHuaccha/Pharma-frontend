import { paginar } from '../../../core/utils/paginar';
import { coincide } from '../../../core/utils/textos';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { Cliente, ClienteRequest, Direccion, OrdenCliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
private readonly http = inject(HttpClient);
private readonly url = `${environment.apiUrl}/clientes`;
listarTodos(): Observable<Cliente[]> {
  return this.http.get<Cliente[]>(this.url);
}
listar(pagina = 0, tamanio = 20, ordenarPor = 'apellidos',
direccion: 'asc' | 'desc' = 'asc'): Observable<PaginaResponse<Cliente>> {
return this.listarPagina(pagina, tamanio, ordenarPor as OrdenCliente, direccion);
}
 obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.url}/${id}`);
  }

  listarPagina(
    pagina: number,
    tamanio: number,
    ordenarPor: OrdenCliente,
    direccion: Direccion,
    texto = '',
  ): Observable<PaginaResponse<Cliente>> {
    return this.http.get<Cliente[]>(this.url).pipe(
      map((lista): PaginaResponse<Cliente> => {
        const filtrada = lista.filter(c => coincide(texto, c.dni, c.nombres, c.apellidos));

        const ordenada = [...filtrada].sort((a, b) => {
          const r = String(a[ordenarPor] ?? '').localeCompare(String(b[ordenarPor] ?? ''), 'es', { sensitivity: 'base' });
          return (direccion === 'asc' ? r : -r) || a.id - b.id;
        });

        return paginar(ordenada, pagina, tamanio);
      }),
    );
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.url}/${id}`);
  }

  crear(cliente: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.url, cliente);
  }

  actualizar(id: number, cliente: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.url}/${id}`, cliente);
  }

  darDeBaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
