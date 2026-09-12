import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import { DialogoService } from '../core/a11y/dialogo.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const dialogo = inject(DialogoService);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    dialogo.aviso({ titulo: 'Acceso requerido', mensaje: AUTH_REQUIRED_MESSAGE, icono: 'lock' }).subscribe();
    return router.createUrlTree(['/login']);
  }
};
