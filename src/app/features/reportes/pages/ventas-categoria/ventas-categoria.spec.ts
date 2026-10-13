import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VentasCategoria } from './ventas-categoria';

describe('Reporte por categoría', () => {
  let fixture: ComponentFixture<VentasCategoria>;
  let component: VentasCategoria;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [VentasCategoria], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VentasCategoria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  it('R-01 consulta histórico sin parámetros y muestra carga', () => {
    expect(fixture.nativeElement.textContent).toContain('Generando reporte');
    const request = http.expectOne(r => r.url.endsWith('/ventas-por-categoria'));
    expect(request.request.params.keys()).toEqual([]);
    request.flush([]);
  });
  it('R-02 envía solo fechas con valor', () => {
    http.expectOne(r => r.url.endsWith('/ventas-por-categoria')).flush([]);
    component['filtros'].patchValue({ desde: '2026-10-12' });
    component.generar();
    const request = http.expectOne(r => r.params.get('desde') === '2026-10-12');
    expect(request.request.params.has('hasta')).toBe(false);
    request.flush([]);
  });
  it('R-03 rechaza un rango inválido sin pedir a la API', () => {
    http.expectOne(r => r.url.endsWith('/ventas-por-categoria')).flush([]);
    component['filtros'].patchValue({ desde: '2026-10-13', hasta: '2026-10-12' });
    component.generar();
    expect(component['errorFechas']()).toContain('posterior');
    http.expectNone(r => r.url.endsWith('/ventas-por-categoria'));
  });
  it('R-04 muestra vacío y protege el cálculo con monto máximo cero', () => {
    http.expectOne(r => r.url.endsWith('/ventas-por-categoria')).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay ventas en el periodo seleccionado');
    expect(component['porcentaje'](0)).toBe(0);
  });
  it('R-05 presenta el mensaje del backend y permite reintentar', () => {
    http.expectOne(r => r.url.endsWith('/ventas-por-categoria')).flush({ message: 'Servicio temporalmente no disponible' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Servicio temporalmente no disponible');
    component.generar();
    http.expectOne(r => r.url.endsWith('/ventas-por-categoria')).flush([]);
    expect(component['error']()).toBeNull();
  });
  it('R-06 calcula totales y barras respecto al monto mayor', () => {
    http.expectOne(r => r.url.endsWith('/ventas-por-categoria')).flush([
      { categoriaId: 1, categoriaNombre: 'Salud', cantidadVendida: 4, montoTotal: 20 },
      { categoriaId: 2, categoriaNombre: 'Cuidado', cantidadVendida: 2, montoTotal: 10 },
    ]);
    fixture.detectChanges();
    expect(component['totalUnidades']()).toBe(6);
    expect(component['totalMonto']()).toBe(30);
    expect(component['porcentaje'](20)).toBe(100);
    expect(component['porcentaje'](10)).toBe(50);
    const bars = fixture.nativeElement.querySelectorAll('.barra') as NodeListOf<HTMLElement>;
    expect(Array.from(bars).map(b => b.style.width)).toEqual(['100%', '50%']);
  });
});
