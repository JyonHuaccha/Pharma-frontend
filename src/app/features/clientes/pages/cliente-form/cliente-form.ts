import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente-service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.html',
  styleUrls: ['./cliente-form.css'],
})
export class ClienteFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorTimeout?: ReturnType<typeof setTimeout>;

  form!: FormGroup;
  isEditMode = signal<boolean>(false);
  clienteId: number | null = null;
  errorMessage = signal<string | null>(null);
  cargando = signal<boolean>(false);

  ngOnInit(): void {
    this.form = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telefono: ['', [Validators.pattern(/^\d{9}$/)]],
      direccion: ['', [Validators.maxLength(250)]],
      estado: [true, [Validators.required]],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.clienteId = Number(idParam);
      this.cargarCliente(this.clienteId);
    }
  }
  cargarCliente(id: number): void {
    this.cargando.set(true);
    this.clienteService.obtenerPorId(id).subscribe({
      next: (cliente) => {
        this.form.patchValue({
          dni: cliente.dni,
          nombres: cliente.nombres,
          apellidos: cliente.apellidos,
          email: cliente.email,
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          estado: cliente.estado,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarError('No se pudo cargar la información del cliente.');
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const clienteRequest = {
      dni: val.dni.trim(),
      nombres: val.nombres.trim(),
      apellidos: val.apellidos.trim(),
      email: val.email.trim(),
      telefono: val.telefono?.trim() ? val.telefono.trim() : null,
      direccion: val.direccion?.trim() ? val.direccion.trim() : null,
      estado: val.estado,
    };

    this.cargando.set(true);
    this.errorMessage.set(null);

    const peticion =
      this.isEditMode() && this.clienteId
        ? this.clienteService.actualizar(this.clienteId, clienteRequest)
        : this.clienteService.crear(clienteRequest);

    peticion.subscribe({
      next: () => {
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        this.mostrarError(err.error?.message || 'Ocurrió un error al guardar el cliente.');
        this.cargando.set(false);
      },
    });
  }
  private mostrarError(mensaje: string, duracionMs = 3000): void {
    clearTimeout(this.errorTimeout);
    this.errorMessage.set(mensaje);
    this.errorTimeout = setTimeout(() => this.errorMessage.set(null), duracionMs);
  }

  ngOnDestroy(): void {
    clearTimeout(this.errorTimeout);
  }
}
