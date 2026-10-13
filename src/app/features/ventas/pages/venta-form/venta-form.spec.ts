import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { VentaForm } from './venta-form';
import { Producto } from '../../../productos/models/producto.model';

const producto: Producto = { id: 1, nombre: 'Paracetamol', precio: 2.5, stock: 5, estado: true, categoriaId: 1, categoriaNombre: 'Analgésicos', fechaCreacion: '', fechaModificacion: null };

describe('VentaForm: paso 10', () => {
  let component: VentaForm;
  let fixture: ComponentFixture<VentaForm>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VentaForm], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VentaForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/clientes')).flush([
      { id: 1, nombres: 'Ana', apellidos: 'Huamán', dni: '12345678', estado: true },
      { id: 2, nombres: 'Luis', apellidos: 'Huamán', dni: '87654321', estado: false },
    ]);
    http.expectOne(r => r.url.endsWith('/productos')).flush([producto]);
  });
  afterEach(() => http.verify());

  it('no confirma un formulario vacío', () => {
    component.revisar();
    expect(component['confirmando']()).toBe(false);
    expect(component['form'].touched).toBe(true);
  });
  it('busca sin tildes y excluye clientes inactivos', () => {
    component['buscarCliente'].setValue('huaman');
    expect(component['clientesEncontrados']().map(c => c.id)).toEqual([1]);
    component['buscarCliente'].setValue('inexistente');
    expect(component['clientesEncontrados']()).toEqual([]);
  });
  it('calcula, acumula repetidos y recalcula al quitar', () => {
    component.agregarProducto(producto);
    component.detalles.at(0).controls.cantidad.setValue(3);
    expect(component['total']()).toBe(7.5);
    component.agregarProducto(producto);
    expect(component.detalles.length).toBe(1);
    expect(component['total']()).toBe(10);
    component.quitarLinea(0);
    expect(component['total']()).toBe(0);
  });
  it('Enter agrega sin enviar el formulario', () => {
    component['buscarProducto'].setValue('paracetamol');
    const evento = new Event('keydown', { cancelable: true });
    component.agregarPrimero(evento);
    expect(evento.defaultPrevented).toBe(true);
    expect(component.detalles.length).toBe(1);
    expect(component['confirmando']()).toBe(false);
  });
  it('bloquea cantidades mayores al stock', () => {
    component['form'].controls.clienteId.setValue(1);
    component.agregarProducto(producto);
    component.detalles.at(0).controls.cantidad.setValue(6);
    component.revisar();
    expect(component['hayExcesoDeStock']()).toBe(true);
    expect(component['confirmando']()).toBe(false);
  });
  it('envía solo identificadores y cantidades y evita doble envío', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component['form'].controls.clienteId.setValue(1);
    component.agregarProducto(producto);
    component.revisar(); component.confirmar(); component.confirmar();
    const request = http.expectOne(r => r.method === 'POST');
    expect(request.request.body).toEqual({ clienteId: 1, detalles: [{ productoId: 1, cantidad: 1 }] });
    request.flush({ id: 9 }, { status: 201, statusText: 'Created' });
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/ventas', 9], { queryParams: { nueva: 1, imprimir: 1 } });
  });
  it('un 409 desbloquea el formulario y muestra el mensaje', () => {
    component['form'].controls.clienteId.setValue(1);
    component.agregarProducto(producto);
    component.revisar(); component.confirmar();
    http.expectOne(r => r.method === 'POST').flush({ message: 'Stock insuficiente' }, { status: 409, statusText: 'Conflict' });
    http.expectOne(r => r.url.endsWith('/productos')).flush([{ ...producto, stock: 0 }]);
    expect(component['guardando']()).toBe(false);
    expect(component['confirmando']()).toBe(false);
    expect(component['error']()).toBe('Stock insuficiente');
  });
});
