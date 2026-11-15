import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SIN_CREDENCIALES } from '../../services/auth.interceptor';
import { UadRadicacionPort } from '../contratos/uad-radicacion.port';
import { RadicacionNdaRequest, RadicacionNdaResponse } from '../contratos/uad-api.types';
import { interpretarErrorUad } from './uad-error';

/**
 * Adaptador HTTP de la radicación pública UAD. **`POST /uad/noticias-anonimas` no existe todavía en el
 * backend** (auditoría 2026-11-14). La petición sale con `SIN_CREDENCIALES`: sin `Authorization`, aunque
 * la persona tenga sesión abierta (UAD-NOT-04).
 */
@Injectable()
export class UadRadicacionHttpAdapter extends UadRadicacionPort {
  private readonly http = inject(HttpClient);

  radicarNoticiaAnonima(cuerpo: RadicacionNdaRequest): Observable<RadicacionNdaResponse> {
    return this.http
      .post<RadicacionNdaResponse>(`${environment.apiBaseUrl}/uad/noticias-anonimas`, cuerpo, {
        context: new HttpContext().set(SIN_CREDENCIALES, true)
      })
      .pipe(catchError((error: unknown) => throwError(() => interpretarErrorUad(error))));
  }
}
