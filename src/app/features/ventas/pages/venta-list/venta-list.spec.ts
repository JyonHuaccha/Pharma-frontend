import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentaList } from './venta-list';

describe('VentaList', () => {
  let component: VentaList;
  let fixture: ComponentFixture<VentaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [VentaList],
    }).compileComponents();

    fixture = TestBed.createComponent(VentaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el resumen impreso conserva los filtros que produjeron los resultados', () => {
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/clientes')).flush([]);
    http.expectOne(r => r.url.endsWith('/ventas/buscar')).flush([]);
    component['filtros'].patchValue({ desde: '2026-10-12' });
    expect(component['resumenFiltros']()).toBe('ninguno (todas las ventas)');
    component.buscar();
    http.expectOne(r => r.url.endsWith('/ventas/buscar')).flush([]);
    expect(component['resumenFiltros']()).toContain('desde 2026-10-12');
    component['filtros'].patchValue({ desde: '2026-10-13', hasta: '2026-10-12' });
    component.buscar();
    expect(component['resumenFiltros']()).toContain('desde 2026-10-12');
    http.expectNone(r => r.url.endsWith('/ventas/buscar'));
    http.verify();
  });
});
