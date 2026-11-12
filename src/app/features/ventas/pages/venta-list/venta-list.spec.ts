import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { VentaList } from './venta-list';

describe('VentaList: página del servidor y filtros impresos', () => {
  let fixture: ComponentFixture<VentaList>;
  let http: HttpTestingController;
  const pagina = {
    contenido: [],
    pagina: 0,
    tamanio: 20,
    totalElementos: 0,
    totalPaginas: 0,
    ultima: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [VentaList],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VentaList);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/clientes')).flush([]);
    http.expectOne((r) => r.url.endsWith('/ventas/buscar')).flush(pagina);
  });
  afterEach(() => http.verify());

  it('solicita otra página sin recortar una lista completa en Angular', async () => {
    await fixture.whenStable();
    fixture.componentRef.setInput('pagina', 4);
    fixture.detectChanges();
    const request = http.expectOne((r) => r.url.endsWith('/ventas/buscar'));
    expect(request.request.params.get('pagina')).toBe('4');
    expect(request.request.params.get('tamanio')).toBe('20');
    request.flush({
      ...pagina,
      pagina: 4,
      contenido: [
        {
          id: 80,
          fecha: '2026-11-12',
          clienteId: 1,
          clienteNombres: 'Cliente',
          clienteApellidos: 'Prueba',
          total: 25,
          estado: 'REGISTRADA',
          detalles: [],
        },
      ],
      totalElementos: 100,
      totalPaginas: 5,
    });
    await fixture.whenStable();
    expect(fixture.componentInstance['resultado']()?.contenido).toHaveLength(1);
    expect(fixture.componentInstance['resultado']()?.pagina).toBe(4);
  });

  it('cambiar filtros vuelve a página cero y conserva el resumen hasta recibir la respuesta', async () => {
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component['filtros'].patchValue({ desde: '2026-11-01' }, { emitEvent: false });
    component.buscar();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ desde: '2026-11-01', pagina: 0 }),
        queryParamsHandling: 'merge',
      }),
    );
    expect(component['resumenFiltros']()).toBe('ninguno (todas las ventas)');
    fixture.componentRef.setInput('desde', '2026-11-01');
    fixture.detectChanges();
    const request = http.expectOne((r) => r.url.endsWith('/ventas/buscar'));
    expect(component['resumenFiltros']()).toBe('ninguno (todas las ventas)');
    request.flush(pagina);
    await fixture.whenStable();
    expect(component['resumenFiltros']()).toContain('desde 2026-11-01');
    component['filtros'].patchValue(
      { desde: '2026-11-13', hasta: '2026-11-12' },
      { emitEvent: false },
    );
    navigate.mockClear();
    component.buscar();
    expect(navigate).not.toHaveBeenCalled();
    expect(component['resumenFiltros']()).toContain('desde 2026-11-01');
  });
});
