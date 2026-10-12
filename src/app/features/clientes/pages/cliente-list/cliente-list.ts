import { Component, inject, OnInit, signal } from '@angular/core';
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
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService
      .listarPagina(
        this.pagina(),
        this.tamanio(),
        this.ordenarPor(),
        this.direccion(),
        this.texto(),
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

  darDeBaja(cliente: Cliente): void {
    if (!confirm(`¿Dar de baja al cliente "${cliente.nombres} ${cliente.apellidos}"?`)) {
      return;
    }
    this.clienteService.darDeBaja(cliente.id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}