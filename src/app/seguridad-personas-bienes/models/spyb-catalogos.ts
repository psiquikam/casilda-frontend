/**
 * Catálogos y tipos maestros para el Módulo Seguridad a Personas y Bienes (SPyB).
 * Fuente: docs/Catalogo Roles CASILDA.pdf y Requisitos funcionales_SEG_PyB-ago2026.
 */

export interface ItemCatalogoSpyb {
  id: number;
  codigo: string;
  nombre: string;
  activo?: boolean;
}

export type TipoRegistroSeguridad =
  | 'PQRS'
  | 'ALERTA_TEMPRANA'
  | 'NOVEDAD'
  | 'INFORME_ACOMPANAMIENTO';

export type CanalRecepcionSeguridad =
  | 'TELEFONO_219_64_19'
  | 'CORREO_ELECTRONICO'
  | 'PRESENCIAL'
  | 'REVISION_INTERNA'
  | 'OTRO';

export type RolPersonaReportada =
  | 'VICTIMA'
  | 'PRESUNTO_AGRESOR'
  | 'OTRO_INTERVINIENTE';

export type EstadoRegistroSeguridad =
  | 'NUEVO'
  | 'EN_REVISION'
  | 'SUBSANACION_REQUERIDA'
  | 'PENDIENTE_VINCULACION'
  | 'VINCULADO_CASO'
  | 'ACTUACION_INDEPENDIENTE'
  | 'CERRADO';

export type TipoIncidenteAcompanamiento =
  | 'ACERCAMIENTO'
  | 'CONTACTO_VERBAL_FISICO'
  | 'INTIMIDACION'
  | 'AMENAZA'
  | 'OTRO';

export type EstadoGestionCamara =
  | 'SOLICITADA'
  | 'EXTRAIDA_CUSTODIADA'
  | 'NO_DISPONIBLE'
  | 'ENTREGADA_AUTORIDAD'
  | 'CERRADA';

export type DestinoRemisionSeguridad =
  | 'EQUIPO_ATENCION'
  | 'LINEA_ALMA'
  | 'UAD'
  | 'FISCALIA'
  | 'POLICIA'
  | 'OTRO_EXTERNO';

export type TipoRequerimientoUad =
  | 'CITACION_TESTIGO'
  | 'AMPLIACION_INFORME'
  | 'SOLICITUD_EVIDENCIA';

export type EstadoOrdenAcompanamiento =
  | 'CREADA'
  | 'ASIGNADA'
  | 'EN_EJECUCION'
  | 'FINALIZADA'
  | 'CANCELADA';

export type PrioridadAcompanamiento = 'ALTA' | 'MEDIA' | 'BAJA';

export const CATALOGO_TIPOS_REGISTRO: ItemCatalogoSpyb[] = [
  { id: 1, codigo: 'PQRS', nombre: 'PQRS Comunidad universitaria', activo: true },
  { id: 2, codigo: 'ALERTA_TEMPRANA', nombre: 'Alerta temprana', activo: true },
  { id: 3, codigo: 'NOVEDAD', nombre: 'Novedad de seguridad', activo: true },
  { id: 4, codigo: 'INFORME_ACOMPANAMIENTO', nombre: 'Informe de acompañamiento', activo: true }
];

export const CATALOGO_CANALES_RECEPCION: ItemCatalogoSpyb[] = [
  { id: 1, codigo: 'TELEFONO_219_64_19', nombre: 'Línea de seguridad 219-64-19', activo: true },
  { id: 2, codigo: 'CORREO_ELECTRONICO', nombre: 'Correo institucional', activo: true },
  { id: 3, codigo: 'PRESENCIAL', nombre: 'Atención presencial en puesto de control', activo: true },
  { id: 4, codigo: 'REVISION_INTERNA', nombre: 'Ronda operativa / detección en campo', activo: true },
  { id: 5, codigo: 'OTRO', nombre: 'Otro canal autorizado', activo: true }
];

export const CATALOGO_ROLES_PERSONA: ItemCatalogoSpyb[] = [
  { id: 1, codigo: 'VICTIMA', nombre: 'Víctima / persona afectada', activo: true },
  { id: 2, codigo: 'PRESUNTO_AGRESOR', nombre: 'Presunto agresor / persona señalada', activo: true },
  { id: 3, codigo: 'OTRO_INTERVINIENTE', nombre: 'Otro interviniente / testigo', activo: true }
];

export const CATALOGO_INCIDENTES_ACOMPANAMIENTO: ItemCatalogoSpyb[] = [
  { id: 1, codigo: 'ACERCAMIENTO', nombre: 'Acercamiento indebido', activo: true },
  { id: 2, codigo: 'CONTACTO_VERBAL_FISICO', nombre: 'Contacto verbal o físico no consentido', activo: true },
  { id: 3, codigo: 'INTIMIDACION', nombre: 'Intimidación visual o gestual', activo: true },
  { id: 4, codigo: 'AMENAZA', nombre: 'Amenaza verbal o expresa', activo: true },
  { id: 5, codigo: 'OTRO', nombre: 'Otra situación de riesgo', activo: true }
];

export const CATALOGO_DESTINOS_REMISION: ItemCatalogoSpyb[] = [
  { id: 1, codigo: 'EQUIPO_ATENCION', nombre: 'Equipo de atención integral (Ruta Violeta)', activo: true },
  { id: 2, codigo: 'LINEA_ALMA', nombre: 'Línea ALMA (Apoyo psicológico / contención)', activo: true },
  { id: 3, codigo: 'UAD', nombre: 'Unidad de asuntos disciplinarios (UAD)', activo: true },
  { id: 4, codigo: 'FISCALIA', nombre: 'Fiscalía General de la Nación', activo: true },
  { id: 5, codigo: 'POLICIA', nombre: 'Policía Nacional', activo: true },
  { id: 6, codigo: 'OTRO_EXTERNO', nombre: 'Otra entidad externa', activo: true }
];
