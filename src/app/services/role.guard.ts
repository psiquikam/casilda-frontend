import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import { DialogoService } from '../core/a11y/dialogo.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const dialogo = inject(DialogoService);

  // 1. ¿Está logueado?
  if (!authService.isAuthenticated()) {
    dialogo.aviso({ titulo: 'Acceso requerido', mensaje: AUTH_REQUIRED_MESSAGE, icono: 'lock' }).subscribe();
    return router.createUrlTree(['/login']);
  }

  // 2. Regla de negocio: El administrador tiene acceso a todas las páginas
  if (authService.isAdmin()) {
    return true;
  }

  // 3. ¿Tiene alguno de los roles permitidos para esta ruta?
  const expectedRoles = (route.data['roles'] as string[]) || [];
  if (expectedRoles.length > 0 && authService.hasAnyRole(expectedRoles)) {
    return true;
  }

  // 4. Si no tiene permiso, redirigir a "Acceso Denegado"
  return router.createUrlTree(['/acceso-denegado']);
};
