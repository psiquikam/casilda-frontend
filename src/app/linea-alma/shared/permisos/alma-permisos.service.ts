import { Injectable, inject } from '@angular/core';
import { AuthService, ROLES_CASILDA } from '../../../services/auth.service';
import { psicologiaHabilitadaPara } from '../../psicologia/psicologia-habilitacion';
import { PermisoAlma, permisosDeRoles } from './alma-permisos';

/**
 * Acceso a los permisos de Línea Alma desde componentes y guards.
 * Se evalúa en cada llamada: `AuthService.currentUser` no es una señal.
 */
@Injectable({ providedIn: 'root' })
export class AlmaPermisosService {
  private readonly auth = inject(AuthService);

  private rolesActivos(): string[] {
    return ROLES_CASILDA.filter((rol) => this.auth.hasRole(rol));
  }

  tiene(permiso: PermisoAlma): boolean {
    return permisosDeRoles(this.rolesActivos()).has(permiso);
  }

  tieneAlguno(permisos: readonly PermisoAlma[]): boolean {
    const efectivos = permisosDeRoles(this.rolesActivos());
    return permisos.some((permiso) => efectivos.has(permiso));
  }

  /**
   * El submódulo Psicología está en despliegue controlado (`ROLES_HABILITADOS_PSICOLOGIA`): menú y
   * guard lo muestran solo a los roles habilitados **y** con permiso de consulta.
   */
  psicologiaHabilitada(): boolean {
    return psicologiaHabilitadaPara(this.rolesActivos()) && this.tiene('alma.psicologia.consultar');
  }
}
