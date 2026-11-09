import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductoMasVendido, ProductoMasVendidoServidor, VentaPorCategoria } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  productosMasVendidos(): Observable<ProductoMasVendido[]> {
    return this.http.get<ProductoMasVendidoServidor[]>(`${this.url}/productos-mas-vendidos`).pipe(
      map(filas => filas.map(fila => ({
        productoId: fila.id,
        productoNombre: fila.name,
        categoriaNombre: fila.categoria,
        cantidadVendida: fila.cantidad,
        montoTotal: fila.total,
      }))),
    );
  }

  ventasPorCategoria(desde: string | null, hasta: string | null): Observable<VentaPorCategoria[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<VentaPorCategoria[]>(`${this.url}/ventas-por-categoria`, { params });
  }
}
