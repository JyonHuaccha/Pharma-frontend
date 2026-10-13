import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { FiltroVentas, Venta, VentaRequest } from '../models/venta.model';

@Service()
export class VentaService {
private readonly http = inject(HttpClient);
private readonly url = `${environment.apiUrl}/ventas`;
registrar(dto: VentaRequest): Observable<Venta> {
return this.http.post<Venta>(this.url, dto);
}
obtener(id: number): Observable<Venta> {
return this.http.get<Venta>(`${this.url}/${id}`);
}
/** Solo se envían los filtros que tienen valor. */
buscar(filtro: FiltroVentas, pagina: number, tamanio: number):
Observable<PaginaResponse<Venta>> {
let params = new HttpParams()
.set('pagina', pagina)
.set('tamanio', tamanio)
.set('ordenarPor', 'fecha')
.set('direccion', 'desc');
if (filtro.clienteId) params = params.set('clienteId', filtro.clienteId);
if (filtro.estado) params = params.set('estado', filtro.estado);
if (filtro.desde) params = params.set('desde', filtro.desde);
if (filtro.hasta) params = params.set('hasta', filtro.hasta);
	return this.http.get<Venta[]>(`${this.url}/buscar`, { params }).pipe(
		map((ventas) => {
			const totalElementos = ventas.length;
			const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamanio));
			const paginaSegura = Math.min(pagina, totalPaginas - 1);
			const inicio = paginaSegura * tamanio;

			return {
				contenido: ventas.slice(inicio, inicio + tamanio),
				pagina: paginaSegura,
				tamanio,
				totalElementos,
				totalPaginas,
				ultima: paginaSegura >= totalPaginas - 1,
			};
		}),
	);
}
}