import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { VentaForm } from './venta-form';
import { Producto } from '../../../productos/models/producto.model';

const productos: Producto[] = [12.50, 18.90, 5.25, .10, 7.80].map((precio, i) => ({ id: i + 1, nombre: ['Alfa', 'Beta', 'Gamma', 'Centavo', 'Ultimo'][i], precio, stock: i === 4 ? 2 : 100, estado: true, categoriaId: 1, categoriaNombre: 'Salud', fechaCreacion: '', fechaModificacion: null }));
describe('Matriz autónoma S9', () => {
  let component: VentaForm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<VentaForm>>;
  beforeEach(() => {
    TestBed.configureTestingModule({imports:[VentaForm],providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]});
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VentaForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/clientes')).flush([
      { id: 1, nombres:'Ana', apellidos:'Huamán', dni:'12345678', estado:true },
      { id: 2, nombres:'Luis', apellidos:'Huamán', dni:'87654321', estado:false },
    ]);
    http.expectOne(r => r.url.endsWith('/productos')).flush(productos);
  });
  afterEach(() => http.verify());
  function linea(index: number, cantidad: number) {
    component.agregarProducto(productos[index]);
    component.detalles.at(component.detalles.length-1).controls.cantidad.setValue(cantidad);
  }
  it('B-01 excluye cliente inactivo y encuentra apellido sin tilde', () => {
    component['buscarCliente'].setValue('87654321'); expect(component['clientesEncontrados']()).toEqual([]);
    component['buscarCliente'].setValue('huaman'); expect(component['clientesEncontrados']().map(c=>c.id)).toEqual([1]);
  });
  it('B-02 busca por nombre y categoría y Enter no confirma', () => {
    component['buscarProducto'].setValue('beta'); expect(component['productosEncontrados']().map(p=>p.id)).toEqual([2]);
    component['buscarProducto'].setValue('salud'); expect(component['productosEncontrados']()).toHaveLength(5);
    const event = new Event('keydown',{cancelable:true}); component.agregarPrimero(event);
    expect(event.defaultPrevented).toBe(true); expect(component.detalles.length).toBe(1); expect(component['confirmando']()).toBe(false);
  });
  it('C-01 12.50 por 3 produce 37.50',()=>{linea(0,3);expect(component['total']()).toBe(37.50);});
  it('C-02 18.90 por 3 produce 56.70 y se muestra con dos decimales',()=>{
    linea(1,3); fixture.detectChanges(); expect(component['total']()).toBe(56.70); expect(fixture.nativeElement.textContent).toContain('56.70');
  });
  it('C-03 recalcula tres líneas al quitar la del medio',()=>{
    linea(0,2); linea(1,3); linea(2,4); expect(component['total']()).toBe(102.70);
    component.quitarLinea(1); expect(component['total']()).toBe(46);
  });
  it('V-01 bloquea venta vacía y muestra ambos mensajes',()=>{
    component.revisar(); fixture.detectChanges();
    expect(component['confirmando']()).toBe(false); expect(fixture.nativeElement.textContent).toContain('Busque y seleccione'); expect(fixture.nativeElement.textContent).toContain('Agregue al menos');
  });
  it('V-02 muestra una validación por línea para cero y decimal',()=>{
    component['form'].controls.clienteId.setValue(1); linea(0,0);
    for (const cantidad of [0,2.5]) {
      component.detalles.at(0).controls.cantidad.setValue(cantidad); component.revisar(); fixture.detectChanges();
      expect(component['confirmando']()).toBe(false); expect(fixture.nativeElement.textContent).toContain('Ingrese una cantidad entera mayor que cero.');
    }
  });
  it('V-03 bloquea cantidad 3 con stock 2',()=>{
    component['form'].controls.clienteId.setValue(1); linea(4,3); component.revisar(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Supera el stock (2)'); expect(component['confirmando']()).toBe(false);
  });
  it('V-04 acumula el producto repetido en una sola línea',()=>{
    linea(0,1); component.agregarProducto(productos[0]); expect(component.detalles.length).toBe(1); expect(component.cantidadEnDetalle(1)).toBe(2);
  });
  it('F-01 Volver cierra el resumen sin POST',()=>{
    component['form'].controls.clienteId.setValue(1); linea(0,1); component.revisar(); component.volver();
    expect(component['confirmando']()).toBe(false); expect(component.detalles.length).toBe(1); http.expectNone(r=>r.method==='POST');
  });
  it('F-02 dos confirmaciones seguidas producen un único POST',()=>{
    vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);
    component['form'].controls.clienteId.setValue(1); linea(0,1); component.revisar(); component.confirmar(); component.confirmar();
    http.expectOne(r=>r.method==='POST').flush({id:1});
  });
  it('M-01 conserva el detalle y refresca el stock después de 409',()=>{
    component['form'].controls.clienteId.setValue(1); linea(4,2); component.revisar(); component.confirmar();
    http.expectOne(r=>r.method==='POST').flush({message:'Stock insuficiente'}, {status:409,statusText:'Conflict'});
    http.expectOne(r=>r.url.endsWith('/productos')).flush(productos.map(p=>p.id===5?{...p,stock:0}:p));
    expect(component['guardando']()).toBe(false); expect(component['confirmando']()).toBe(false); expect(component['form'].controls.clienteId.value).toBe(1); expect(component.detalles.length).toBe(1); expect(component['hayExcesoDeStock']()).toBe(true);
    component.quitarLinea(0); linea(0,1); component.revisar(); expect(component['confirmando']()).toBe(true);
  });
  it('B-03 encuentra por varias palabras sin distinguir mayúsculas',()=>{
    component['buscarCliente'].setValue('ANA huaman'); expect(component['clientesEncontrados']().map(c=>c.id)).toEqual([1]);
  });
  it('C-05 0.10 por 3 produce 0.30',()=>{linea(3,3);expect(component['total']()).toBe(.30);});
  it('V-06 rechaza cantidad negativa en la SPA',()=>{
    component['form'].controls.clienteId.setValue(1); linea(0,-1); component.revisar(); expect(component['confirmando']()).toBe(false);
  });
  it('F-03 confirmar sin revisar no envía POST',()=>{
    component['form'].controls.clienteId.setValue(1); linea(0,1); component.confirmar(); http.expectNone(r=>r.method==='POST');
  });
});
