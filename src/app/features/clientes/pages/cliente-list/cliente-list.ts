import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente-service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cliente-list.html',
  styleUrls: ['./cliente-list.css'],
})
export class ClienteListComponent implements OnInit {
  private clienteService = inject(ClienteService);

  clientes = signal<Cliente[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  paginaActual = signal<number>(0); // base 0
  tamanioPagina = signal<number>(10);
  ordenarPor = signal<string>('apellidos');
  direccion = signal<'asc' | 'desc'>('asc');

  filtroBusqueda = signal<string>('');

  clientesFiltrados = computed(() => {
    const texto = this.filtroBusqueda().toLowerCase().trim();
    let lista = this.clientes();
    if (texto) {
      lista = lista.filter(
        (c) =>
          c.dni.toLowerCase().includes(texto) ||
          c.nombres.toLowerCase().includes(texto) ||
          c.apellidos.toLowerCase().includes(texto) ||
          `${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto),
      );
    }
    const campo = this.ordenarPor() as keyof Cliente;
    const factor = this.direccion() === 'asc' ? 1 : -1;
    return [...lista].sort(
      (a, b) => String(a[campo] ?? '').localeCompare(String(b[campo] ?? '')) * factor,
    );
  });

  totalElementos = computed(() => this.clientesFiltrados().length);
  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalElementos() / this.tamanioPagina())),
  );

  paginaSegura = computed(() => Math.min(this.paginaActual(), this.totalPaginas() - 1));

  esUltima = computed(() => this.paginaSegura() + 1 >= this.totalPaginas());

  clientesPagina = computed(() => {
    const inicio = this.paginaSegura() * this.tamanioPagina();
    return this.clientesFiltrados().slice(inicio, inicio + this.tamanioPagina());
  });

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService.listar().subscribe({
      next: (resp) => {
        this.clientes.set(resp);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el listado de clientes.');
        this.cargando.set(false);
      },
    });
  }

  cambiarPagina(incremento: number): void {
    const nuevaPagina = this.paginaSegura() + incremento;
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPaginas()) {
      this.paginaActual.set(nuevaPagina);
    }
  }

  cambiarTamano(valor: string): void {
    this.tamanioPagina.set(Number(valor));
    this.paginaActual.set(0);
  }

  filtrar(texto: string): void {
    this.filtroBusqueda.set(texto);
    this.paginaActual.set(0);
  }

  ordenar(campo: string): void {
    if (this.ordenarPor() === campo) {
      this.direccion.set(this.direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
  }

  darDeBaja(id: number): void {
    if (confirm('¿Estás seguro de dar de baja a este cliente?')) {
      this.clienteService.darDeBaja(id).subscribe({
        next: () => {
          this.cargarClientes();
        },
        error: (err) => {
          alert(err.error?.message || 'Error al dar de baja al cliente.');
        },
      });
    }
  }
}
