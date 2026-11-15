import { HttpContextToken, HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import { DialogoService } from '../core/a11y/dialogo.service';

/**
 * Marca una petición para que salga **sin credenciales**: sin `Authorization` y sin cerrar la sesión ante
 * un 401. Para canales que no deben asociarse a la persona autenticada, como la queja anónima ante la
 * UAD (UAD-NOT-04, UAD-SEG-06). Uso: `http.post(url, cuerpo, { context: new HttpContext().set(SIN_CREDENCIALES, true) })`.
 *
 * Es una protección del cliente; el servidor debe además ignorar cualquier token en esas rutas.
 */
export const SIN_CREDENCIALES = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SIN_CREDENCIALES)) {
    return next(req.headers.has('Authorization') ? req.clone({ headers: req.headers.delete('Authorization') }) : req);
  }

  const authService = inject(AuthService);
  const dialogo = inject(DialogoService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login');

      if (error.status === 401 && !isAuthEndpoint) {
        authService.logout();
        // Bloqueante: la sesión ya no existe y la única salida es volver a autenticarse.
        dialogo
          .aviso(
            { titulo: 'Sesión expirada', mensaje: AUTH_REQUIRED_MESSAGE, textoBoton: 'Iniciar sesión', icono: 'lock_clock' },
            { bloqueante: true }
          )
          .subscribe();
      }
      // Un 403 no invalida el token ni el acceso a la ruta actual. Se propaga
      // al servicio/componente para que esa operación concreta muestre su
      // error o fallback; los permisos de navegación los resuelve roleGuard.
      return throwError(() => error);
    })
  );
};
