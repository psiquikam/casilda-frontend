import { RolAlma } from '../shared/permisos/alma-permisos';

/**
 * Habilitación **temporal** del submódulo Psicología en el front.
 *
 * La matriz de permisos (`shared/permisos/alma-permisos.ts`, plan §11) ya da acceso a Psicología
 * a ADMIN, COORDINADOR, PROFESIONAL y REVISOR. Mientras el equipo define a quién más se le
 * habilita la visualización del módulo Línea Alma con sus submódulos, **solo ADMIN** ve y entra a
 * las pantallas de Psicología. Para abrirlo a otro rol basta con añadirlo aquí: menú, catálogo de
 * navegación y guard leen esta lista. El Backend sigue siendo la autoridad (403).
 */
export const ROLES_HABILITADOS_PSICOLOGIA: readonly RolAlma[] = ['ADMIN'];

export function psicologiaHabilitadaPara(roles: readonly string[]): boolean {
  return roles.some((rol) => (ROLES_HABILITADOS_PSICOLOGIA as readonly string[]).includes(rol));
}
