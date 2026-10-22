import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';
import { AuthService } from '../../../../core/auth/auth-service';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe, SiPermiso],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  readonly categoriaId = input<string>();

  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<OrdenProducto>('nombre');
  protected readonly direccion = signal<Direccion>('asc');
  protected readonly resultado = signal<PaginaResponse<Producto> | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaFiltro = signal<number | null>(null);
  protected readonly desdeCategoria = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly opcionesFiltro = computed(() => {
    const filtro = this.categoriaFiltro();
    return this.categorias().filter((c) => c.estado || c.id === filtro);
  });
  protected readonly nombreCategoriaFiltro = computed(
    () => this.categorias().find((c) => c.id === this.categoriaFiltro())?.nombre ?? null,
  );
  protected readonly productos = computed(() => this.resultado()?.contenido ?? []);

  ngOnInit(): void {
        const id = Number(this.categoriaId());
    if (this.categoriaId() && Number.isInteger(id) && id > 0) {
      this.categoriaFiltro.set(id);
      this.tamanio.set(100);
      this.desdeCategoria.set(true);
    }
    this.categoriaService.listar().subscribe({
      next: (datos) => this.categorias.set(datos),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productoService
      .listar(
        this.pagina(),
        this.tamanio(),
        this.ordenarPor(),
        this.direccion(),
        this.categoriaFiltro(),
      )
      .subscribe({
        next: (pagina) => {
          if (pagina.contenido.length === 0 && this.pagina() > 0) {
            this.pagina.set(Math.max(0, this.pagina() - 1));
            this.cargar();
            return;
          }
          this.resultado.set(pagina);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  irA(pagina: number): void {
    this.pagina.set(pagina);
    this.cargar();
  }

  cambiarTamanio(valor: string): void {
    this.tamanio.set(Number(valor));
    this.irA(0);
  }

  ordenar(campo: OrdenProducto): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.irA(0);
  }

  filtrarPorCategoria(valor: string): void {
    this.categoriaFiltro.set(valor ? Number(valor) : null);
    this.irA(0);
  }

  darDeBaja(producto: Producto): void {
    if (!confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) {
      return;
    }
    const paginaAntes = this.pagina();
    const quedariaVaciaLaPagina = (this.resultado()?.contenido.length ?? 0) <= 1 && paginaAntes > 0;

    this.productoService.darDeBaja(producto.id).subscribe({
      next: () => {
        if (quedariaVaciaLaPagina) {
          this.pagina.set(Math.max(0, paginaAntes - 1));
        }
        this.cargar();
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
