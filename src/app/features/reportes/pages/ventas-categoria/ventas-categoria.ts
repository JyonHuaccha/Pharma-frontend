import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { VentaPorCategoria } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';

@Component({
  selector: 'app-ventas-categoria',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './ventas-categoria.html',
  styleUrl: './ventas-categoria.css',
})
export class VentasCategoria implements OnInit {
  private readonly service = inject(ReporteService);
  private readonly destroyRef = inject(DestroyRef);
  private solicitud?: Subscription;
  protected readonly filtros = new FormGroup({
    desde: new FormControl<string | null>(null),
    hasta: new FormControl<string | null>(null),
  });
  protected readonly filas = signal<VentaPorCategoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorFechas = signal<string | null>(null);
  protected readonly periodo = signal('Histórico completo');
  protected readonly totalUnidades = computed(() => this.filas().reduce((sum, r) => sum + r.cantidadVendida, 0));
  protected readonly totalMonto = computed(() => redondear(this.filas().reduce((sum, r) => sum + r.montoTotal, 0)));
  protected readonly mayorMonto = computed(() => Math.max(0, ...this.filas().map(r => r.montoTotal)));

  ngOnInit(): void { this.generar(); }

  protected porcentaje(monto: number): number {
    return this.mayorMonto() > 0 ? Math.min(100, Math.max(0, monto / this.mayorMonto() * 100)) : 0;
  }

  generar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    this.errorFechas.set(null);
    if (desde && hasta && desde > hasta) {
      this.errorFechas.set('La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }
    this.solicitud?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.solicitud = this.service.ventasPorCategoria(desde, hasta).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: filas => {
        this.filas.set([...filas].sort((a, b) => b.montoTotal - a.montoTotal || a.categoriaId - b.categoriaId));
        this.periodo.set(desde || hasta ? `Desde ${desde || 'el inicio'} hasta ${hasta || 'la fecha actual'}` : 'Histórico completo');
        this.cargando.set(false);
      },
      error: err => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  limpiar(): void { this.filtros.reset(); this.generar(); }
}
