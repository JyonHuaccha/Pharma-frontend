import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Paginador } from '../../../../shared/components/paginador/paginador';

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe, SiPermiso, Paginador],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList {
  private readonly servicio = inject(ProductoService);
  private readonly categoriasServicio = inject(CategoriaService);
  private readonly router = inject(Router);
  readonly pagina = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  readonly tamanio = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly orden = input<OrdenProducto>('nombre');
  readonly dir = input<Direccion>('asc');
  readonly categoriaId = input<string>();
  protected readonly errorOperacion = signal<string | null>(null);
  protected readonly categoriaFiltro = computed(() =>
    this.categoriaId() ? Number(this.categoriaId()) : null,
  );
  private readonly catalogoCategorias = rxResource({
    stream: () => this.categoriasServicio.listar(),
  });
  protected readonly categorias = computed(() =>
    this.catalogoCategorias.hasValue() ? this.catalogoCategorias.value() : [],
  );
  protected readonly opcionesFiltro = computed(() =>
    this.categorias().filter((c) => c.estado || c.id === this.categoriaFiltro()),
  );
  protected readonly nombreCategoriaFiltro = computed(
    () => this.categorias().find((c) => c.id === this.categoriaFiltro())?.nombre,
  );
  protected readonly recurso = rxResource({
    params: () => ({
      pagina: this.pagina(),
      tamanio: this.tamanio(),
      orden: this.orden() ?? 'nombre',
      dir: this.dir() ?? 'asc',
      categoria: this.categoriaFiltro(),
    }),
    stream: ({ params: c }) =>
      this.servicio.listar(c.pagina, c.tamanio, c.orden, c.dir, c.categoria),
  });
  protected readonly resultado = linkedSignal<
    PaginaResponse<Producto> | undefined,
    PaginaResponse<Producto> | undefined
  >({
    source: () => (this.recurso.hasValue() ? this.recurso.value() : undefined),
    computation: (nueva, anterior) => nueva ?? anterior?.value,
  });
  protected readonly productos = computed(() => this.resultado()?.contenido ?? []);
  protected readonly cargando = this.recurso.isLoading;
  protected readonly error = computed(() => {
    const err = this.recurso.error() ?? this.catalogoCategorias.error();
    return this.errorOperacion() ?? (err instanceof HttpErrorResponse ? mensajeError(err) : null);
  });

  constructor() {
    effect(() => {
      const r = this.recurso.hasValue() ? this.recurso.value() : undefined;
      if (r && r.pagina > 0 && r.contenido.length === 0) this.irA(Math.max(0, r.totalPaginas - 1));
    });
  }

  irA(pagina: number): void {
    this.navegar({ pagina });
  }
  cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }
  ordenar(campo: OrdenProducto): void {
    this.navegar({
      orden: campo,
      dir: this.orden() === campo && this.dir() === 'asc' ? 'desc' : 'asc',
      pagina: 0,
    });
  }
  filtrarPorCategoria(valor: string): void {
    this.navegar({ categoriaId: valor || null, pagina: 0 });
  }

  darDeBaja(producto: Producto): void {
    if (!confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) return;
    this.servicio.darDeBaja(producto.id).subscribe({
      next: () => {
        this.errorOperacion.set(null);
        this.recurso.reload();
      },
      error: (err: HttpErrorResponse) => this.errorOperacion.set(mensajeError(err)),
    });
  }

  private navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
