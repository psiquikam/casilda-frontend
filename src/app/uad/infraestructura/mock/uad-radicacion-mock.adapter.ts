import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { UadRadicacionPort } from '../../contratos/uad-radicacion.port';
import { RadicacionNdaRequest, RadicacionNdaResponse } from '../../contratos/uad-api.types';
import { validarRadicacionNda } from '../../dominio/radicacion-nda';
import { interpretarErrorUad } from '../uad-error';
import { UAD_MOCK_LATENCIA_MS } from './uad-mock.adapter';
import { UadMockStore } from './uad-mock-store';

/**
 * Radicación pública simulada (Entrega 3). Valida como el servidor propuesto y deja la NDA en el mismo
 * store que leen las bandejas, así que aparece en la pestaña NDA de ambos equipos. No usa la sesión: ni
 * siquiera inyecta `AuthService`, para que el mock no pueda asociar identidad por accidente.
 */
@Injectable()
export class UadRadicacionMockAdapter extends UadRadicacionPort {
  private readonly store = inject(UadMockStore);
  private readonly latencia = inject(UAD_MOCK_LATENCIA_MS);

  radicarNoticiaAnonima(cuerpo: RadicacionNdaRequest): Observable<RadicacionNdaResponse> {
    const errores = validarRadicacionNda(cuerpo);
    let salida: Observable<RadicacionNdaResponse>;
    if (Object.keys(errores).length > 0) {
      const error = new HttpErrorResponse({
        status: 400,
        error: { status: 400, error: 'Bad Request', message: 'Revise los datos marcados.', codigo: 'VALIDACION', validationErrors: errores }
      });
      salida = throwError(() => interpretarErrorUad(error));
    } else {
      const noticia = this.store.radicarNda(cuerpo);
      salida = of({ consecutivo: noticia.consecutivo, fechaRecepcion: noticia.fechaRecepcion });
    }
    return this.latencia > 0 ? salida.pipe(delay(this.latencia)) : salida;
  }
}
