import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AlmaPermisosService } from '../shared/permisos/alma-permisos.service';

/**
 * Segunda capa del acceso a `/linea-alma/psicologia/*`: además del permiso fino de cada pantalla
 * (`almaPermisoGuard`), el rol debe estar en `ROLES_HABILITADOS_PSICOLOGIA` mientras el
 * submódulo está en despliegue controlado. Sin sesión lo resuelve `roleGuard`/`almaPermisoGuard`.
 */
export const psicologiaHabilitadaGuard: CanActivateFn = () => {
  const permisos = inject(AlmaPermisosService);
  return permisos.psicologiaHabilitada() ? true : inject(Router).createUrlTree(['/acceso-denegado']);
};
