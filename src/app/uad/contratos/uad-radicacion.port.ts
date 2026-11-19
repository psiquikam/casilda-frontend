import { Observable } from 'rxjs';
import { RadicacionNdaRequest, RadicacionNdaResponse } from './uad-api.types';

/**
 * Puerto **público** de radicación ante la UAD (Entrega 3). Va separado de `UadApiPort` porque lo usa
 * una ruta sin sesión (`/uad/queja-anonima`), fuera de las rutas protegidas por rol.
 *
 * ```text
 * QuejaAnonimaPage → UadRadicacionPort
 *                      ├─ UadRadicacionHttpAdapter  (sin credenciales: SIN_CREDENCIALES)
 *                      └─ UadRadicacionMockAdapter  (deja la NDA en el mismo store de las bandejas)
 * ```
 */
export abstract class UadRadicacionPort {
  /** `POST /uad/noticias-anonimas` — radicarNoticiaAnonima. Responde 201 con el consecutivo NDA. */
  abstract radicarNoticiaAnonima(cuerpo: RadicacionNdaRequest): Observable<RadicacionNdaResponse>;
}
