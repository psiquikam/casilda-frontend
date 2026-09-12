import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import { DialogoService } from '../core/a11y/dialogo.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
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
      } else if (error.status === 403 && !isAuthEndpoint) {
        void router.navigate(['/acceso-denegado']);
      }
      return throwError(() => error);
    })
  );
};
