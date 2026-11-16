import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { AuditoriaEvento, FiltroAuditoria } from '../models/auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);

  buscar(
    filtros: FiltroAuditoria,
    pagina: number,
    tamanio: number,
  ): Observable<PaginaResponse<AuditoriaEvento>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    for (const [nombre, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(nombre, valor.trim());
    }
    return this.http.get<PaginaResponse<AuditoriaEvento>>(`${environment.apiUrl}/auditoria`, {
      params,
    });
  }
}
