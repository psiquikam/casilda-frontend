import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_REQUIRED_MESSAGE, AuthService } from './auth.service';
import Swal from 'sweetalert2';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenemos los roles permitidos para esta ruta desde la configuración de la ruta
  const expectedRoles = route.data['roles'] as Array<string>;
  const userRole = authService.currentUser?.rol;

  // 1. ¿Está logueado?
  if (!authService.isAuthenticated()) {
    void Swal.fire({
      icon: 'warning',
      title: 'Acceso requerido',
      text: AUTH_REQUIRED_MESSAGE
    });
    return router.createUrlTree(['/login']);
  }

  // 2. ¿Tiene el rol necesario?
  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  // 3. Si no tiene permiso, lo mandamos a una página de "Acceso Denegado"
  return router.createUrlTree(['/acceso-denegado']);
};