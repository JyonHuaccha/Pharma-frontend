import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaRequest } from '../../models/categoria.model';
import { mensajeError, erroresDeValidacion } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-categoria-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './categoria-form.html',
  styleUrl: './categoria-form.css',
})
export class CategoriaForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);

  // Recibe el id de la ruta automáticamente si estamos editando
  readonly id = input<string | undefined>();

  protected readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    estado: [true, [Validators.required]],
  });

  protected readonly guardando = signal<boolean>(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresValidacion = signal<Record<string, string>>({});

  ngOnInit(): void {
    const categoriaId = this.id();
    if (categoriaId) {
      this.cargarCategoria(Number(categoriaId));
    }
  }

  cargarCategoria(id: number): void {
    this.categoriaService.obtener(id).subscribe({
      next: (cat) => {
        this.form.patchValue({
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          estado: cat.estado,
        });
      },
      error: (err) => {
        this.errorGeneral.set(mensajeError(err));
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);
    this.erroresValidacion.set({});

    const dto: CategoriaRequest = this.form.value;
    const categoriaId = this.id();

    const operacion = categoriaId
      ? this.categoriaService.actualizar(Number(categoriaId), dto)
      : this.categoriaService.crear(dto);

    operacion.subscribe({
      next: () => {
        this.router.navigate(['/categorias']);
      },
      error: (err) => {
        this.errorGeneral.set(mensajeError(err));
        this.erroresValidacion.set(erroresDeValidacion(err));
        this.guardando.set(false);
      },
    });
  }
}
