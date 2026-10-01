import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { Categoria } from '../../models/categoria.model';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-categoria-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './categoria-list.html',
  styleUrl: './categoria-list.css',
})
export class CategoriaList implements OnInit, OnDestroy {
  private readonly categoriaService = inject(CategoriaService);
  private errorTimeout?: ReturnType<typeof setTimeout>;
  protected readonly errorEliminar = signal<string | null>(null); // NUEVO

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filtroBusqueda = signal<string>('');

  protected readonly categoriasFiltradas = computed(() => {
    const texto = this.filtroBusqueda().toLowerCase().trim();
    const lista = this.categorias();
    if (!texto) return lista;
    return lista.filter(
      (cat) =>
        cat.nombre.toLowerCase().includes(texto) ||
        (cat.descripcion && cat.descripcion.toLowerCase().includes(texto)),
    );
  });

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.categoriaService.listar().subscribe({
      next: (datos) => {
        this.categorias.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }
    this.errorEliminar.set(null);
    this.categoriaService.eliminar(id).subscribe({
      next: () => {
        this.cargarCategorias();
      },
      error: (err) => {
        this.mostrarErrorEliminar(mensajeError(err)); // antes: alert(...)
      },
    });
  }

  private mostrarErrorEliminar(mensaje: string, duracionMs = 3000): void {
    clearTimeout(this.errorTimeout);
    this.errorEliminar.set(mensaje);
    this.errorTimeout = setTimeout(() => this.errorEliminar.set(null), duracionMs);
  }

  ngOnDestroy(): void {
    clearTimeout(this.errorTimeout);
  }
}
