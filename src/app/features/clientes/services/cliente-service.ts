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
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/clientes`;

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.url);
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
        const t = texto.toLowerCase().trim();
        const filtrada = t
          ? lista.filter(
              (c) =>
                c.dni.toLowerCase().includes(t) ||
                c.nombres.toLowerCase().includes(t) ||
                c.apellidos.toLowerCase().includes(t) ||
                `${c.nombres} ${c.apellidos}`.toLowerCase().includes(t),
            )
          : lista;

        const ordenada = [...filtrada].sort((a, b) => {
          const r = String(a[ordenarPor] ?? '').localeCompare(String(b[ordenarPor] ?? ''));
          return direccion === 'asc' ? r : -r;
        });

        const totalPaginas = Math.max(1, Math.ceil(ordenada.length / tamanio));
        const paginaSegura = Math.min(pagina, totalPaginas - 1);
        const inicio = paginaSegura * tamanio;

        return {
          contenido: ordenada.slice(inicio, inicio + tamanio),
          pagina: paginaSegura,
          tamanio,
          totalElementos: ordenada.length,
          totalPaginas,
          ultima: paginaSegura + 1 >= totalPaginas,
        };
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