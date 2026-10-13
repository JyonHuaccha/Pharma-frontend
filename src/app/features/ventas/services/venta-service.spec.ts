import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VentaService } from './venta-service';

describe('VentaService', () => {
  let service: VentaService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(VentaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
