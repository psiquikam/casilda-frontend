/**
 * Tipos de dominio, enums y validadores del módulo Línea Alma.
 *
 * **PROVISIONAL — dueño: Jonathan (tarea J-0.1).** El plan (§4.3) asigna este archivo a
 * Psicología; se crea aquí con lo mínimo que APH necesita para no bloquear la rama. Cuando
 * J-0.1 llegue, su versión prevalece: **todo el estado y los enums del módulo viven solo
 * aquí** (aísla el cambio de la pendiente Q1), así que la fusión es de un archivo.
 *
 * Fuente: `docs/levantamiento-requerimientos-linea-alma.md` §4 y §8 y el plan §12.1 (Q1).
 */

/** Triaje que asigna APH a mano (el algoritmo es externo al sistema). La `prioridad` del caso usa ALTA/MEDIA/BAJA (Q1). */
export const TRIAJES = ['ALTO', 'MEDIO', 'BAJO'] as const;
export type Triaje = (typeof TRIAJES)[number];

export const ETIQUETA_TRIAJE: Record<Triaje, string> = { ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' };

/** RN-ALMA-01: tiempo máximo de primer contacto por Psicología según el triaje. Solo informativo en APH. */
export const HORAS_LIMITE_PRIMER_CONTACTO: Record<Triaje, number> = { ALTO: 12, MEDIO: 24, BAJO: 48 };

/**
 * Estados de la **atención/novedad** (los del flujo, §4 del levantamiento). `BORRADOR` es una
 * adición de este módulo para «Guardar progreso» (RF-ALMA-005, Q4). Los estados del **caso**
 * (`ABIERTO`, `ACTIVO`, `EN_CIERRE`, `CERRADO`) son otro conjunto y no se mezclan (Q1).
 */
export const ESTADOS_ATENCION = [
  'BORRADOR',
  'PENDIENTE_APH',
  'EN_GESTION_APH',
  'PENDIENTE_PSICOLOGIA',
  'ABIERTO_ACTIVO',
  'EN_SEGUIMIENTO',
  'CERRADO'
] as const;
export type EstadoAtencion = (typeof ESTADOS_ATENCION)[number];

export const ETIQUETA_ESTADO_ATENCION: Record<EstadoAtencion, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_APH: 'Pendiente de tomar',
  EN_GESTION_APH: 'En gestión',
  PENDIENTE_PSICOLOGIA: 'Esperando a Psicología',
  ABIERTO_ACTIVO: 'Con caso abierto',
  EN_SEGUIMIENTO: 'En seguimiento',
  CERRADO: 'Cerrada'
};

/** Estados desde los que APH todavía puede editar la atención. */
export const ESTADOS_EDITABLES_APH: readonly EstadoAtencion[] = ['BORRADOR', 'EN_GESTION_APH'];

export const CANALES_INGRESO = ['LLAMADA', 'WHATSAPP', 'REMISION_EA', 'REMISION_SPYB', 'REMISION_UAD'] as const;
export type CanalIngreso = (typeof CANALES_INGRESO)[number];

export const ETIQUETA_CANAL_INGRESO: Record<CanalIngreso, string> = {
  LLAMADA: 'Llamada telefónica',
  WHATSAPP: 'WhatsApp (opción 2)',
  REMISION_EA: 'Remisión del Equipo de Atención',
  REMISION_SPYB: 'Remisión de Seguridad a Personas y Bienes',
  REMISION_UAD: 'Remisión de la Unidad de Asuntos Disciplinarios'
};

export type OrigenRemision = 'EA' | 'SPYB' | 'UAD';
export const ORIGENES_REMISION: readonly OrigenRemision[] = ['EA', 'SPYB', 'UAD'];
export const ETIQUETA_ORIGEN_REMISION: Record<OrigenRemision, string> = {
  EA: 'Equipo de Atención',
  SPYB: 'Seguridad a Personas y Bienes',
  UAD: 'Asuntos Disciplinarios'
};

export const MEDIOS_CONSENTIMIENTO = ['DIGITAL', 'VERBAL'] as const;
export type MedioConsentimiento = (typeof MEDIOS_CONSENTIMIENTO)[number];

/** Contexto al que se asocian derivaciones, rutas y contenciones (Q2: la novedad se identifica por `idAtencion` hasta que exista `numeroCaso`). */
export type TipoContexto = 'ATENCION_APH' | 'CASO';
export interface ContextoAlma {
  readonly tipo: TipoContexto;
  readonly id: string;
}

/**
 * Códigos de catálogo hacia los que APH puede activar la ruta **sin consentimiento previo** por
 * peligro inminente (excepción de RN-ALMA-02): SPyB (interna) y Línea 123 (externa).
 */
export const DESTINOS_PELIGRO_INMINENTE: readonly string[] = ['SPYB', 'LINEA_123'];

export const ID_ATENCION_REGEX = /^ALMA-\d{4}-\d{6}$/;
export const NUMERO_CASO_REGEX = /^CAS-\d{4}-\d{6}$/;

export function esIdAtencionValido(valor: string | null | undefined): boolean {
  return !!valor && ID_ATENCION_REGEX.test(valor);
}

export function esNumeroCasoValido(valor: string | null | undefined): boolean {
  return !!valor && NUMERO_CASO_REGEX.test(valor);
}

/** Ítem del catálogo `GET /catalogos/{nombre}` (A.1). */
export interface ItemCatalogo {
  readonly codigo: string;
  readonly etiqueta: string;
  readonly activo: boolean;
}

/** Catálogos que consume APH. El resto los consume Psicología. */
export type NombreCatalogo =
  | 'tipos-identificacion'
  | 'estratos'
  | 'destinos-internos'
  | 'rutas-externas'
  | 'motivos-cierre-aph'
  | 'resultados-ruta-externa'
  | 'parentescos-solicitante'
  | 'textos-consentimiento';
