import { Avisos } from '../../../../core/services/avisos';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Cliente, Direccion, OrdenCliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteListComponent implements OnInit {
  private readonly avisos = inject(Avisos);
  private readonly destroyRef = inject(DestroyRef);
  private carga?: Subscription;
  protected readonly eliminando = signal(false);
  private readonly clienteService = inject(ClienteService);

  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<OrdenCliente>('apellidos');
  protected readonly direccion = signal<Direccion>('asc');
  protected readonly texto = signal('');
  protected readonly resultado = signal<PaginaResponse<Cliente> | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

   cargar(): void {
    this.carga?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.carga = this.clienteService
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

  ordenar(campo: OrdenCliente): void {
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

  async darDeBaja(cliente: Cliente): Promise<void> {
    if (this.eliminando() || !cliente.estado) return;
    if (!await this.avisos.confirmar('Dar de baja al cliente',
      `¿Deseas dar de baja a ${cliente.nombres} ${cliente.apellidos}? El registro se conservará como inactivo.`, 'Dar de baja')) return;
    this.eliminando.set(true);
    this.clienteService.darDeBaja(cliente.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.avisos.mostrar('Cliente dado de baja correctamente.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.avisos.mostrar(mensajeError(err), 'error');
      },
    });
  }
}
