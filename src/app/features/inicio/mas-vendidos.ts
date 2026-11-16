import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ProductoMasVendido } from '../reportes/models/reporte.model';
import { ReporteService } from '../reportes/services/reporte-service';

@Component({
  selector: 'app-mas-vendidos',
  imports: [CurrencyPipe],
  templateUrl: './mas-vendidos.html',
  styleUrl: './mas-vendidos.css',
})
export class MasVendidos {
  private readonly reportes = inject(ReporteService);
  protected readonly error = signal(false);
  protected readonly filas = toSignal(
    this.reportes.productosMasVendidos().pipe(
      catchError(() => {
        this.error.set(true);
        return of([] as ProductoMasVendido[]);
      }),
    ),
    { initialValue: null },
  );
}
