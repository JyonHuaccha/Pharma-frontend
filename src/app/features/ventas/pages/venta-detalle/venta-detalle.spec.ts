import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentaDetalle } from './venta-detalle';

describe('VentaDetalle', () => {
  let component: VentaDetalle;
  let fixture: ComponentFixture<VentaDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [VentaDetalle],
    }).compileComponents();

    fixture = TestBed.createComponent(VentaDetalle);
    fixture.componentRef.setInput('id', '1');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
