import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Paginador } from '../../../../shared/components/paginador/paginador';

@Component({
  selector: 'app-venta-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, SiPermiso, Paginador],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css',
})
export class VentaList {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly servicio = inject(VentaService);
  private readonly clienteServicio = inject(ClienteService);
  private readonly router = inject(Router);
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly tamanio = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly orden = input('fecha');
  readonly dir = input('desc');
  readonly clienteId = input<string>();
  readonly estado = input<EstadoVenta>();
  readonly desde = input<string>();
  readonly hasta = input<string>();
  protected readonly ahora = signal(new Date());
  private readonly errorFiltro = signal<string | null>(null);
  private readonly consulta = computed<FiltroVentas>(() => ({
    clienteId: this.clienteId() ? Number(this.clienteId()) : null,
    estado: this.estado() || null,
    desde: this.desde() || null,
    hasta: this.hasta() || null,
  }));
  protected readonly filtros = this.fb.group({
    clienteId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoVenta | null>(null),
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });
  private readonly recursoClientes = rxResource({
    stream: () => this.clienteServicio.listarTodos(),
  });
  protected readonly clientes = computed(() =>
    this.recursoClientes.hasValue() ? this.recursoClientes.value() : [],
  );
  protected readonly recurso = rxResource({
    params: () => ({
      filtro: this.consulta(),
      pagina: this.pagina(),
      tamanio: this.tamanio(),
      orden: this.orden() ?? 'fecha',
      dir: this.dir() ?? 'desc',
    }),
    stream: ({ params: c }) => this.servicio.buscar(c.filtro, c.pagina, c.tamanio, c.orden, c.dir),
  });
  protected readonly resultado = linkedSignal<
    PaginaResponse<Venta> | undefined,
    PaginaResponse<Venta> | undefined
  >({
    source: () => (this.recurso.hasValue() ? this.recurso.value() : undefined),
    computation: (nueva, anterior) => nueva ?? anterior?.value,
  });
  private readonly filtrosAplicados = linkedSignal({
    source: () => ({
      pagina: this.recurso.hasValue() ? this.recurso.value() : undefined,
      filtro: this.consulta(),
    }),
    computation: (nueva, anterior): FiltroVentas =>
      nueva.pagina
        ? nueva.filtro
        : (anterior?.value ?? { clienteId: null, estado: null, desde: null, hasta: null }),
  });
  protected readonly cargando = this.recurso.isLoading;
  protected readonly error = computed(() => {
    const err = this.recurso.error() ?? this.recursoClientes.error();
    return this.errorFiltro() ?? (err instanceof HttpErrorResponse ? mensajeError(err) : null);
  });
  protected readonly totalPagina = computed(() =>
    (this.resultado()?.contenido ?? [])
      .filter((v) => v.estado === 'REGISTRADA')
      .reduce((s, v) => s + v.total, 0),
  );

  constructor() {
    effect(() => {
      this.filtros.patchValue(this.consulta(), { emitEvent: false });
    });
    this.filtros.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.buscar());
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
    this.navegar({ ...f, pagina: 0 });
  }
  limpiar(): void {
    this.filtros.reset(undefined, { emitEvent: false });
    this.buscar();
  }
  irA(pagina: number): void {
    this.navegar({ pagina });
  }
  cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }
  ordenar(campo: string): void {
    this.navegar({
      orden: campo,
      dir: this.orden() === campo && this.dir() === 'asc' ? 'desc' : 'asc',
      pagina: 0,
    });
  }
  imprimirConsulta(): void {
    this.ahora.set(new Date());
    setTimeout(() => window.print());
  }

  protected resumenFiltros(): string {
    const f = this.filtrosAplicados();
    const cliente = this.clientes().find((c) => c.id === f.clienteId);
    return (
      [
        cliente ? `cliente ${cliente.apellidos}, ${cliente.nombres}` : '',
        f.estado ? `estado ${f.estado}` : '',
        f.desde ? `desde ${f.desde}` : '',
        f.hasta ? `hasta ${f.hasta}` : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'ninguno (todas las ventas)'
    );
  }
  private navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
