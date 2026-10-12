import { environment } from '../../../environments/environment';
import type { FeatureKey } from '../features/feature-capability.guard';

/**
 * Catálogo central de módulos de Casilda: **un solo nombre, ícono y ruta por
 * módulo**, consumido por el menú lateral, el panel de inicio y los títulos de
 * ruta.
 *
 * Antes cada superficie escribía su propio literal y seis módulos acababan con
 * nombres distintos según dónde se miraran («Nueva Solicitud» / «Solicitud de
 * Acompañamiento» / «Ir a Nueva Solicitud»), lo que los hacía parecer módulos
 * diferentes (DSH-04-03).
 *
 * **[PENDIENTE P-07]** Los nombres se tomaron del menú lateral, que es la
 * navegación primaria del sistema (DSH-P4) y por tanto la referencia más
 * autorizada hoy. Falta que el equipo confirme el nombre oficial de cada
 * módulo: cuando lo haga, **solo cambia este archivo**.
 */
export interface ModuloCasilda {
  readonly id: string;
  /** Nombre oficial. Único en toda la interfaz. */
  readonly nombre: string;
  /** Ícono único por módulo: dos módulos distintos nunca comparten ícono (DSH-04-04). */
  readonly icono: string;
  readonly ruta: string;
  /** Roles que pueden acceder. Debe coincidir con `data.roles` de `app.routes.ts`. */
  readonly roles: readonly string[];
  /** Prototipo tras feature flag, si aplica. */
  readonly feature?: FeatureKey;
  /** Agrupación en el menú lateral. */
  readonly seccion: string;
}

export const CATALOGO_MODULOS: readonly ModuloCasilda[] = [
  // --- Mis solicitudes (rol Usuario) ---
  {
    id: 'reportar-caso',
    nombre: 'Reportar caso',
    icono: 'post_add',
    ruta: '/reportar-caso',
    roles: ['USUARIO'],
    seccion: 'Mis solicitudes'
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento de trámite',
    icono: 'track_changes',
    ruta: '/seguimiento',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR', 'USUARIO'],
    feature: 'publicTrackingPrototype',
    seccion: 'Mis solicitudes'
  },
  {
    id: 'queja-uad',
    nombre: 'Queja disciplinaria (UAD)',
    icono: 'gavel',
    ruta: '/nueva-queja',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR', 'USUARIO'],
    feature: 'complaintIntakePrototype',
    seccion: 'Mis solicitudes'
  },

  // --- Administración ---
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    icono: 'manage_accounts',
    ruta: '/gestion-usuarios',
    roles: ['ADMIN'],
    seccion: 'Administración'
  },
  {
    id: 'maestros',
    nombre: 'Maestros del sistema',
    icono: 'tune',
    ruta: '/gestion-sistema',
    roles: ['ADMIN'],
    seccion: 'Administración'
  },

  // --- Equipo de atención ---
  {
    id: 'nueva-solicitud',
    nombre: 'Nueva solicitud',
    icono: 'add_circle_outline',
    ruta: '/solicitud-acompanamiento',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'],
    seccion: 'Equipo de atención'
  },
  {
    id: 'consulta',
    nombre: 'Consulta de solicitudes',
    icono: 'manage_search',
    ruta: '/consulta',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'],
    seccion: 'Equipo de atención'
  },
  {
    id: 'mis-asignaciones',
    nombre: 'Mis asignaciones',
    icono: 'assignment_ind',
    ruta: '/mis-asignaciones',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'],
    feature: 'assignmentsPrototype',
    seccion: 'Equipo de atención'
  },
  {
    id: 'citas',
    nombre: 'Citas y agendamiento',
    icono: 'calendar_month',
    ruta: '/cita',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'],
    seccion: 'Equipo de atención'
  },
  {
    id: 'registro-caso',
    nombre: 'Registro de caso',
    icono: 'folder_shared',
    ruta: '/registro-caso',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'],
    seccion: 'Equipo de atención'
  },
  {
    id: 'registro-atencion',
    nombre: 'Registro de atención',
    icono: 'handshake',
    ruta: '/registro-atencion',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'],
    seccion: 'Equipo de atención'
  },

  // --- Líneas especiales ---
  {
    id: 'linea-alma',
    nombre: 'Primer respondiente',
    icono: 'ring_volume',
    ruta: '/linea-alma/atencion-pr',
    roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'],
    seccion: 'Línea Alma'
  },

  // --- Reportes y métricas ---
  {
    id: 'indicadores',
    nombre: 'Panel de indicadores',
    icono: 'insights',
    ruta: '/dashboard-revisor',
    roles: ['ADMIN', 'COORDINADOR', 'REVISOR'],
    feature: 'reviewerDashboardPrototype',
    seccion: 'Reportes y métricas'
  }
];

/** Módulo por id. `undefined` si el id no existe en el catálogo. */
export function moduloPorId(id: string): ModuloCasilda | undefined {
  return CATALOGO_MODULOS.find((modulo) => modulo.id === id);
}

/**
 * Módulos visibles para un rol: cruza los permisos del catálogo con los feature
 * flags del entorno.
 *
 * Ocultar un módulo aquí **no es control de acceso** (DSH-P2): la autorización
 * la imponen `roleGuard` y `featureCapabilityGuard`, y deberá imponerla también
 * el backend cuando exista.
 */
export function modulosVisiblesPara(rol: string, esAdmin = false): readonly ModuloCasilda[] {
  return CATALOGO_MODULOS.filter((modulo) => {
    if (modulo.feature && !environment.features[modulo.feature]) return false;
    return esAdmin || modulo.roles.includes(rol);
  });
}
