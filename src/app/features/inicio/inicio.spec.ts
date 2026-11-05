import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
import { Inicio } from './inicio';
import { environment } from '../../../environments/environment';

describe('Reporte diferido del inicio', () => {
  for (const permitido of [false, true]) {
    it(permitido ? 'admin solicita el reporte solo al activar el bloque' : 'vendedor no crea el bloque ni consulta el reporte', async () => {
      TestBed.configureTestingModule({
        imports: [Inicio],
        deferBlockBehavior: DeferBlockBehavior.Manual,
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
          { provide: AuthService, useValue: { tienePermiso: () => permitido } }],
      });
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(Inicio);
      fixture.detectChanges();
      http.expectNone(environment.apiUrl + '/reportes/productos-mas-vendidos');
      const bloques = await fixture.getDeferBlocks();
      expect(bloques.length).toBe(permitido ? 1 : 0);
      if (permitido) {
        await bloques[0].render(DeferBlockState.Complete);
        http.expectOne(environment.apiUrl + '/reportes/productos-mas-vendidos').flush([
          { productoId: 1, productoNombre: 'Paracetamol', categoriaNombre: 'Analgésicos', cantidadVendida: 2, montoTotal: 10 },
        ]);
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Paracetamol');
      }
      http.verify();
    });
  }
});
