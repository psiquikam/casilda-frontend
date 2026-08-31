import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    void Swal.fire({
      icon: 'warning',
      title: 'Acceso requerido',
      text: AUTH_REQUIRED_MESSAGE
    });
    return router.createUrlTree(['/login']);
  }
};
