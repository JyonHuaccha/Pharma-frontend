import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { mensajeError } from '../../../../core/utils/http-error';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { ACCIONES_AUDITORIA } from '../../models/auditoria.model';
import { AuditoriaService } from '../../services/auditoria-service';

@Component({
  selector: 'app-auditoria-list',
  imports: [DatePipe, ReactiveFormsModule, Paginador],
  templateUrl: './auditoria-list.html',
  styleUrl: './auditoria-list.css',
})
export class AuditoriaList {
  private readonly servicio = inject(AuditoriaService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly tamanio = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly usuario = input<string>();
  readonly accion = input<string>();
  readonly desde = input<string>();
  readonly hasta = input<string>();
  protected readonly acciones = ACCIONES_AUDITORIA;
  protected readonly errorFiltro = signal<string | null>(null);
  protected readonly filtros = this.fb.group({ usuario: [''], accion: [''], desde: [''], hasta: [''] });
  protected readonly recurso = rxResource({
    params: () => ({
      filtros: {
        usuario: this.usuario() || null, accion: this.accion() || null,
        desde: this.desde() || null, hasta: this.hasta() || null,
      },
      pagina: this.pagina(), tamanio: this.tamanio(),
    }),
    stream: ({ params: p }) => this.servicio.buscar(p.filtros, p.pagina, p.tamanio),
  });
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return this.errorFiltro() ?? (e instanceof HttpErrorResponse ? mensajeError(e) : null);
  });

  constructor() {
    effect(() => this.filtros.patchValue({
      usuario: this.usuario() ?? '', accion: this.accion() ?? '',
      desde: this.desde() ?? '', hasta: this.hasta() ?? '',
    }, { emitEvent: false }));
    effect(() => {
      const r = this.recurso.hasValue() ? this.recurso.value() : undefined;
      if (r && r.pagina > 0 && !r.contenido.length) this.irA(Math.max(0, r.totalPaginas - 1));
    });
  }

  buscar(): void {
    const f = this.filtros.getRawValue();
    if (f.desde && f.hasta && f.desde > f.hasta) {
      this.errorFiltro.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.errorFiltro.set(null);
    this.navegar({ usuario: f.usuario?.trim() || null, accion: f.accion || null,
      desde: f.desde || null, hasta: f.hasta || null, pagina: 0 });
  }

  limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  irA(pagina: number): void { this.navegar({ pagina }); }
  cambiarTamanio(tamanio: number): void { this.navegar({ tamanio, pagina: 0 }); }

  private navegar(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}
