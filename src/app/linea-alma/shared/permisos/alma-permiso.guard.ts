import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_REQUIRED_MESSAGE, AuthService } from '../../../services/auth.service';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { AlmaPermisosService } from './alma-permisos.service';
import { PermisoAlma } from './alma-permisos';

/**
 * Guard de ruta de Línea Alma. Se declara en la ruta con `data: { permisos: ['alma.aph.crear'] }`
 * (basta con uno de la lista). Sin sesión → login; sin permiso → «Acceso denegado».
 *
 * Es la segunda capa (la primera oculta la acción en la UI); el Backend sigue siendo la autoridad.
 */
export const almaPermisoGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permisos = inject(AlmaPermisosService);

  if (!auth.isAuthenticated()) {
    inject(DialogoService)
      .aviso({ titulo: 'Acceso requerido', mensaje: AUTH_REQUIRED_MESSAGE, icono: 'lock' })
      .subscribe();
    return router.createUrlTree(['/login']);
  }

  const requeridos = (route.data['permisos'] as PermisoAlma[] | undefined) ?? [];
  if (requeridos.length === 0 || permisos.tieneAlguno(requeridos)) {
    return true;
  }
  return router.createUrlTree(['/acceso-denegado']);
};
