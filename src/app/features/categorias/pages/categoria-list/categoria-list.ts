import { Avisos } from '../../../../core/services/avisos';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Categoria } from '../../models/categoria.model';
type OrdenCategoria = 'id' | 'nombre' | 'descripcion' | 'estado';
type Direccion = 'asc' | 'desc';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../../../core/auth/auth-service';
import { SiPermiso } from '../../../../shared/directives/si-permiso';

@Component({
  selector: 'app-categoria-list',
  imports: [RouterLink, SiPermiso],
  templateUrl: './categoria-list.html',
  styleUrl: './categoria-list.css',
})
export class CategoriaList implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly avisos = inject(Avisos);
  private readonly destroyRef = inject(DestroyRef);
  private carga?: Subscription;
  protected readonly eliminando = signal(false);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<OrdenCategoria>('nombre');
  protected readonly direccion = signal<Direccion>('asc');
  protected readonly texto = signal('');
  protected readonly resultado = signal<PaginaResponse<Categoria> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

   cargar(): void {
    this.carga?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.carga = this.categoriaService
      .listarPagina(
        this.pagina(),
        this.tamanio(),
        this.ordenarPor(),
        this.direccion(),
        this.texto(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          this.pagina.set(pagina.pagina);
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

  ordenar(campo: OrdenCategoria): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.irA(0);
  }

  buscar(valor: string): void {
    this.texto.set(valor);
    this.irA(0);
  }

  async darDeBaja(categoria: Categoria): Promise<void> {
    if (this.eliminando() || !categoria.estado) return;
    if (!await this.avisos.confirmar('Dar de baja la categoría',
      `¿Deseas dar de baja a ${categoria.nombre}? El registro se conservará como inactivo.`, 'Dar de baja')) return;
    this.eliminando.set(true);
    this.categoriaService.eliminar(categoria.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.avisos.mostrar('Categoría dada de baja correctamente.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.avisos.mostrar(mensajeError(err), 'error');
      },
    });
  }
}
