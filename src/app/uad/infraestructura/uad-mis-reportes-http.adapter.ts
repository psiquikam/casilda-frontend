import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MiReporteDetalle, MiReporteResumen, Pagina } from '../contratos/uad-api.types';
import { UadMisReportesPort } from '../contratos/uad-mis-reportes.port';
import { interpretarErrorUad } from './uad-error';

/**
 * Adaptador HTTP de «Mis reportes». Rutas de `docs/contratos/uad/openapi-uad.yaml` (Entrega 3 del backend,
 * `casilda-backend/docs/UAD_BACKEND_ENTREGA3.md`). El JWT lo agrega el `authInterceptor` global: aquí la
 * sesión **sí** viaja, porque el servidor filtra por dueño.
 */
@Injectable()
export class UadMisReportesHttpAdapter extends UadMisReportesPort {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiBaseUrl;

  listar(page: number, size: number): Observable<Pagina<MiReporteResumen>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Pagina<MiReporteResumen>>(`${this.api}/mis-reportes`, { params }).pipe(traducir());
  }

  obtener(codigo: string): Observable<MiReporteDetalle> {
    return this.http.get<MiReporteDetalle>(`${this.api}/mis-reportes/${encodeURIComponent(codigo)}`).pipe(traducir());
  }

  responder(codigo: string, solicitudId: string, respuesta: string): Observable<MiReporteDetalle> {
    // El contrato es multipart para admitir evidencias después; hoy solo va el texto (D-UAD-09).
    const cuerpo = new FormData();
    cuerpo.append('respuesta', respuesta);
    return this.http
      .post<MiReporteDetalle>(
        `${this.api}/reportes/${encodeURIComponent(codigo)}/solicitudes-informacion/${encodeURIComponent(solicitudId)}/respuesta`,
        cuerpo
      )
      .pipe(traducir());
  }
}

function traducir<T>() {
  return catchError<T, Observable<never>>((error: unknown) => throwError(() => interpretarErrorUad(error)));
}
