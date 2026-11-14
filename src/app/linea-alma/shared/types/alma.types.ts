/**
 * Tipos de dominio, enums y validadores del módulo Línea Alma (J-0.1, dueño: Jonathan).
 *
 * **Todo el estado y los enums del módulo viven solo aquí**: aísla el cambio de la pendiente Q1
 * (dos modelos de estados incompatibles en el levantamiento) a un único archivo. APH y
 * Psicología consumen estas constantes; Hinara solicita cambios, no los edita (plan §10.2).
 *
 * Decisión de trabajo (Q1): los estados **del flujo** (§4 del levantamiento) son los de la
 * **atención/novedad** (`EstadoAtencion`); los estados **del ER** son los del **caso**
 * (`EstadoCaso`). `prioridad` del caso usa ALTA/MEDIA/BAJA y `triaje` ALTO/MEDIO/BAJO; ambas
 * se conservan por separado (RN-ALMA-04) y `PRIORIDAD_POR_TRIAJE` las relaciona.
 *
 * Fuente: `docs/levantamiento-requerimientos-linea-alma.md` §4, §7 y §8; plan §12.1 (Q1, Q2).
 */

// ───────────────────────── triaje y prioridad ─────────────────────────

/** Triaje que asigna APH a mano (el algoritmo es externo al sistema). */
export const TRIAJES = ['ALTO', 'MEDIO', 'BAJO'] as const;
export type Triaje = (typeof TRIAJES)[number];

export const ETIQUETA_TRIAJE: Record<Triaje, string> = { ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' };

/** RN-ALMA-01: tiempo máximo de primer contacto por Psicología según el triaje. */
export const HORAS_LIMITE_PRIMER_CONTACTO: Record<Triaje, number> = { ALTO: 12, MEDIO: 24, BAJO: 48 };

/** Prioridad del **caso** (ER). Se deriva del triaje al crear el caso, pero son dos variables distintas (Q1, RN-ALMA-04). */
export const PRIORIDADES_CASO = ['ALTA', 'MEDIA', 'BAJA'] as const;
export type PrioridadCaso = (typeof PRIORIDADES_CASO)[number];

export const ETIQUETA_PRIORIDAD_CASO: Record<PrioridadCaso, string> = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' };

export const PRIORIDAD_POR_TRIAJE: Record<Triaje, PrioridadCaso> = { ALTO: 'ALTA', MEDIO: 'MEDIA', BAJO: 'BAJA' };

/**
 * Valoración clínica de riesgo que hace Psicología en el primer contacto. Es un campo **propio**:
 * nunca modifica ni sobreescribe el triaje de APH (RN-ALMA-04); por eso es otro tipo aunque
 * comparta los nombres de nivel.
 */
export const RIESGOS_CLINICOS = ['ALTO', 'MEDIO', 'BAJO'] as const;
export type RiesgoClinico = (typeof RIESGOS_CLINICOS)[number];

export const ETIQUETA_RIESGO_CLINICO: Record<RiesgoClinico, string> = { ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' };

// ───────────────────────── estados ─────────────────────────

/**
 * Estados de la **atención/novedad** (los del flujo, §4 del levantamiento). `BORRADOR` es una
 * adición de este módulo para «Guardar progreso» (RF-ALMA-005, Q4).
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

/** Estados de la novedad que se listan en la bandeja de Psicología (pendientes y cerradas por «No contacto»). */
export const ESTADOS_BANDEJA_PSICOLOGIA: readonly EstadoAtencion[] = ['PENDIENTE_PSICOLOGIA', 'CERRADO'];

/** Estados del **caso** (ER, Q1). Es otro conjunto y no se mezcla con `EstadoAtencion`. */
export const ESTADOS_CASO = ['ABIERTO', 'ACTIVO', 'EN_CIERRE', 'CERRADO'] as const;
export type EstadoCaso = (typeof ESTADOS_CASO)[number];

export const ETIQUETA_ESTADO_CASO: Record<EstadoCaso, string> = {
  ABIERTO: 'Abierto',
  ACTIVO: 'Activo',
  EN_CIERRE: 'En cierre',
  CERRADO: 'Cerrado'
};

/** Estados del caso en los que Psicología puede seguir registrando seguimientos. */
export const ESTADOS_CASO_ACTIVOS: readonly EstadoCaso[] = ['ABIERTO', 'ACTIVO', 'EN_CIERRE'];

// ───────────────────────── canales y remisiones ─────────────────────────

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

// ───────────────────────── consentimiento y contexto ─────────────────────────

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

// ───────────────────────── protocolo de contacto (RN-ALMA-03) ─────────────────────────

/** Máximo de intentos de contacto antes del cierre automático por «No contacto». */
export const MAX_INTENTOS_CONTACTO = 9;
/** Intentos del protocolo base; del siguiente en adelante se exige justificación (Q11). */
export const INTENTOS_SIN_JUSTIFICACION = 3;

export const PROTOCOLOS_INTENTO = ['PROTOCOLO_1', 'PROTOCOLO_2', 'PROTOCOLO_3', 'ADICIONAL'] as const;
export type ProtocoloIntento = (typeof PROTOCOLOS_INTENTO)[number];

export const ETIQUETA_PROTOCOLO_INTENTO: Record<ProtocoloIntento, string> = {
  PROTOCOLO_1: 'Protocolo 1 · primer intento',
  PROTOCOLO_2: 'Protocolo 2 · distinto día u horario',
  PROTOCOLO_3: 'Protocolo 3 · nuevo día u horario',
  ADICIONAL: 'Intento adicional con justificación'
};

/** Protocolo que corresponde al intento `numero` (1…9). */
export function protocoloDeIntento(numero: number): ProtocoloIntento {
  if (numero <= 1) return 'PROTOCOLO_1';
  if (numero === 2) return 'PROTOCOLO_2';
  if (numero === 3) return 'PROTOCOLO_3';
  return 'ADICIONAL';
}

/** Motivo con el que el servidor cierra una novedad al agotar los intentos. */
export const MOTIVO_CIERRE_NO_CONTACTO = 'NO_CONTACTO';

// ───────────────────────── seguimientos (RN-ALMA-05) ─────────────────────────

/** Controles reglamentarios: 1 atención inicial + 2 seguimientos. El contador es informativo y **no bloquea**. */
export const SEGUIMIENTOS_REGLAMENTARIOS = 3;

export const TIPOS_SEGUIMIENTO = ['REGULAR', 'POST_CIERRE'] as const;
export type TipoSeguimiento = (typeof TIPOS_SEGUIMIENTO)[number];

export const ETIQUETA_TIPO_SEGUIMIENTO: Record<TipoSeguimiento, string> = {
  REGULAR: 'Seguimiento',
  POST_CIERRE: 'Contención después del cierre'
};

/** Estado del recordatorio por correo que envía el Backend (RNF-ALMA-004). La UI solo lo muestra. */
export const ESTADOS_RECORDATORIO = ['PENDIENTE', 'ENVIADO', 'FALLIDO', 'SIN_CORREO'] as const;
export type EstadoRecordatorio = (typeof ESTADOS_RECORDATORIO)[number];

export const ETIQUETA_ESTADO_RECORDATORIO: Record<EstadoRecordatorio, string> = {
  PENDIENTE: 'Recordatorio pendiente de envío',
  ENVIADO: 'Recordatorio enviado por correo',
  FALLIDO: 'No fue posible enviar el recordatorio',
  SIN_CORREO: 'Sin correo registrado: no se envía recordatorio'
};

// ───────────────────────── recontacto (RN-ALMA-06) ─────────────────────────

export const DECISIONES_RECONTACTO = ['VINCULAR_A_CASO', 'CASO_NUEVO', 'CONTENCION_PUNTUAL'] as const;
export type DecisionRecontacto = (typeof DECISIONES_RECONTACTO)[number];

export const ETIQUETA_DECISION_RECONTACTO: Record<DecisionRecontacto, string> = {
  VINCULAR_A_CASO: 'Vincular al caso existente',
  CASO_NUEVO: 'Abrir un caso nuevo (hechos distintos)',
  CONTENCION_PUNTUAL: 'Contención puntual (no suma seguimientos)'
};

// ───────────────────────── identificadores (RF-ALMA-001) ─────────────────────────

export const ID_ATENCION_REGEX = /^ALMA-\d{4}-\d{6}$/;
export const NUMERO_CASO_REGEX = /^CAS-\d{4}-\d{6}$/;

export function esIdAtencionValido(valor: string | null | undefined): boolean {
  return !!valor && ID_ATENCION_REGEX.test(valor);
}

export function esNumeroCasoValido(valor: string | null | undefined): boolean {
  return !!valor && NUMERO_CASO_REGEX.test(valor);
}

export type PrefijoIdentificador = 'ALMA' | 'CAS';

export interface IdentificadorAlma {
  readonly prefijo: PrefijoIdentificador;
  readonly anio: number;
  readonly consecutivo: number;
}

function formatear(prefijo: PrefijoIdentificador, anio: number, consecutivo: number): string {
  if (!Number.isInteger(anio) || anio < 1000 || anio > 9999) throw new RangeError(`Año inválido: ${anio}`);
  if (!Number.isInteger(consecutivo) || consecutivo < 1 || consecutivo > 999_999) {
    throw new RangeError(`Consecutivo inválido: ${consecutivo}`);
  }
  return `${prefijo}-${anio}-${String(consecutivo).padStart(6, '0')}`;
}

/** `ALMA-YYYY-NNNNNN`. Lo genera el servidor; el front lo usa solo en mocks y pruebas. */
export function formatearIdAtencion(anio: number, consecutivo: number): string {
  return formatear('ALMA', anio, consecutivo);
}

/** `CAS-YYYY-NNNNNN`. Lo genera el servidor en el primer contacto efectivo (RF-ALMA-001). */
export function formatearNumeroCaso(anio: number, consecutivo: number): string {
  return formatear('CAS', anio, consecutivo);
}

/** Quita espacios y pasa a mayúsculas lo que la persona escribe (`alma-2026-000001` → `ALMA-2026-000001`). */
export function normalizarIdentificador(valor: string | null | undefined): string {
  return (valor ?? '').trim().toUpperCase();
}

/** Descompone un identificador válido; `null` si no lo es. */
export function parsearIdentificador(valor: string | null | undefined): IdentificadorAlma | null {
  const normalizado = normalizarIdentificador(valor);
  const coincidencia = /^(ALMA|CAS)-(\d{4})-(\d{6})$/.exec(normalizado);
  if (!coincidencia) return null;
  return { prefijo: coincidencia[1] as PrefijoIdentificador, anio: Number(coincidencia[2]), consecutivo: Number(coincidencia[3]) };
}

// ───────────────────────── catálogos (Q6) ─────────────────────────

/** Ítem del catálogo `GET /catalogos/{nombre}` (A.1). */
export interface ItemCatalogo {
  readonly codigo: string;
  readonly etiqueta: string;
  readonly activo: boolean;
}

/** Catálogos del módulo. Los oficiales no se han entregado (Q6): el mock sirve placeholders. */
export type NombreCatalogo =
  // APH
  | 'tipos-identificacion'
  | 'estratos'
  | 'destinos-internos'
  | 'rutas-externas'
  | 'motivos-cierre-aph'
  | 'resultados-ruta-externa'
  | 'parentescos-solicitante'
  | 'textos-consentimiento'
  // Psicología
  | 'dimensiones-salud-mental'
  | 'resultados-intento'
  | 'motivos-cierre-psicologia'
  | 'vinculos-agresor';

/** Catálogos conocidos, para validar el nombre que llega por URL o por configuración. */
export const NOMBRES_CATALOGO: readonly NombreCatalogo[] = [
  'tipos-identificacion',
  'estratos',
  'destinos-internos',
  'rutas-externas',
  'motivos-cierre-aph',
  'resultados-ruta-externa',
  'parentescos-solicitante',
  'textos-consentimiento',
  'dimensiones-salud-mental',
  'resultados-intento',
  'motivos-cierre-psicologia',
  'vinculos-agresor'
];
