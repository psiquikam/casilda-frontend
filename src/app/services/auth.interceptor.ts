import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import Swal from 'sweetalert2';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login');

      if ((error.status === 401 || error.status === 403) && !isAuthEndpoint) {
        authService.logout();
        void Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: AUTH_REQUIRED_MESSAGE,
          confirmButtonText: 'Iniciar sesión',
          allowOutsideClick: false
        });
      }
      return throwError(() => error);
    })
  );
};
