/**
 * Matriz de permisos de Línea Alma aplicada a la interfaz (plan §11, `RNF-ALMA-002`).
 *
 * Es lógica **pura**: dado el conjunto de roles de la sesión devuelve los permisos. Ocultar una
 * acción aquí **no es control de acceso**: el Backend es la autoridad y debe rechazar con 403
 * lo que la UI oculta. Lo que sí garantiza la UI es no exponer por descuido (R4) datos clínicos
 * al Técnico APH.
 *
 * Decisiones de trabajo sobre la matriz del levantamiento:
 *  - «Eliminar» (ADMIN) no se construye: ningún requerimiento lo describe (Q13).
 *  - «Crear, consultar, exportar PDF» del Profesional se traduce en `alma.pdf.exportar`.
 *  - El Profesional «consulta notas APH» (`alma.aph.consultar`): el DTO que recibe solo trae esas notas.
 *  - `alma.aph.bandeja` (clave añadida al plan) gobierna la bandeja de remisiones recibidas: el contrato
 *    la limita a TAPH, COORD, ADMIN y REV, y el Profesional no debe verla aunque consulte atenciones APH.
 */
export const PERMISOS_ALMA = [
  'alma.aph.crear',
  'alma.aph.consultar',
  'alma.aph.editar',
  'alma.aph.cerrar',
  'alma.aph.bandeja',
  'alma.psicologia.crear',
  'alma.psicologia.consultar',
  'alma.psicologia.editar',
  'alma.psicologia.cerrar',
  'alma.notasClinicas.consultar',
  'alma.pdf.consultar',
  'alma.pdf.exportar',
  'alma.alertaSeguimiento.consultar'
] as const;

export type PermisoAlma = (typeof PERMISOS_ALMA)[number];

export type RolAlma = 'ADMIN' | 'COORDINADOR' | 'PROFESIONAL' | 'TECNICO_APH' | 'REVISOR' | 'USUARIO' | 'GESTOR_CONTENIDO';

const PERMISOS_POR_ROL: Record<RolAlma, readonly PermisoAlma[]> = {
  ADMIN: PERMISOS_ALMA,
  COORDINADOR: [
    'alma.aph.crear',
    'alma.aph.consultar',
    'alma.aph.editar',
    'alma.aph.bandeja',
    'alma.psicologia.crear',
    'alma.psicologia.consultar',
    'alma.psicologia.editar',
    'alma.notasClinicas.consultar',
    'alma.pdf.consultar',
    'alma.pdf.exportar',
    'alma.alertaSeguimiento.consultar'
  ],
  PROFESIONAL: [
    'alma.aph.consultar',
    'alma.psicologia.crear',
    'alma.psicologia.consultar',
    'alma.psicologia.editar',
    'alma.psicologia.cerrar',
    'alma.notasClinicas.consultar',
    'alma.pdf.consultar',
    'alma.pdf.exportar',
    'alma.alertaSeguimiento.consultar'
  ],
  // El Técnico APH nunca recibe `notasClinicas` ni `pdf`: solo la alerta informativa de seguimiento.
  TECNICO_APH: [
    'alma.aph.crear',
    'alma.aph.consultar',
    'alma.aph.editar',
    'alma.aph.cerrar',
    'alma.aph.bandeja',
    'alma.alertaSeguimiento.consultar'
  ],
  REVISOR: [
    'alma.aph.consultar',
    'alma.aph.bandeja',
    'alma.psicologia.consultar',
    'alma.notasClinicas.consultar',
    'alma.pdf.consultar',
    'alma.alertaSeguimiento.consultar'
  ],
  USUARIO: [],
  GESTOR_CONTENIDO: []
};

/** Permisos efectivos para uno o varios roles (unión). Un rol desconocido no aporta nada. */
export function permisosDeRoles(roles: readonly string[]): ReadonlySet<PermisoAlma> {
  const resultado = new Set<PermisoAlma>();
  for (const rol of roles) {
    for (const permiso of PERMISOS_POR_ROL[rol as RolAlma] ?? []) {
      resultado.add(permiso);
    }
  }
  return resultado;
}

export function rolesConPermiso(permiso: PermisoAlma): readonly RolAlma[] {
  return (Object.keys(PERMISOS_POR_ROL) as RolAlma[]).filter((rol) => PERMISOS_POR_ROL[rol].includes(permiso));
}
