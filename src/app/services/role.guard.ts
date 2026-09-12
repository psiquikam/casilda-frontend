import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import { DialogoService } from '../core/a11y/dialogo.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const dialogo = inject(DialogoService);

  // Obtenemos los roles permitidos para esta ruta desde la configuración de la ruta
  const expectedRoles = route.data['roles'] as string[];
  const userRole = authService.currentUser?.rol;

  // 1. ¿Está logueado?
  if (!authService.isAuthenticated()) {
    dialogo.aviso({ titulo: 'Acceso requerido', mensaje: AUTH_REQUIRED_MESSAGE, icono: 'lock' }).subscribe();
    return router.createUrlTree(['/login']);
  }

  // 2. ¿Tiene el rol necesario?
  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  // 3. Si no tiene permiso, lo mandamos a una página de "Acceso Denegado"
  return router.createUrlTree(['/acceso-denegado']);
};
