import {
  AccionNoticia,
  ActorCaso,
  EquipoUad,
  EstadoNoticia,
  FaseProcesoRemision,
  FaseUad,
  NotificacionEstado,
  TipoDecision,
  TipoEventoHistorial,
  TipoNoticia,
  TipoOrigen,
  VinculacionInvestigado
} from '../contratos/uad-api.types';

/**
 * **Único lugar** con las etiquetas visibles de los enums del contrato UAD (equivale a `alma.types.ts`).
 * Los catálogos con valores de negocio editables (causales, entidades, tipos de solicitud) NO viven
 * aquí: llegan del servidor por `UadApiPort.catalogo()`.
 */

export const ETIQUETA_TIPO_NOTICIA: Record<TipoNoticia, string> = {
  NDI: 'NDI – Identificadas',
  NDA: 'NDA – Anónimas'
};

export const ESTADOS_NOTICIA: readonly EstadoNoticia[] = [
  'RECIBIDA',
  'PENDIENTE_CLASIFICACION',
  'EN_EVALUACION_PRELIMINAR',
  'PENDIENTE_SUBSANACION',
  'SUBSANACION_RECIBIDA',
  'EN_REEVALUACION',
  'INHIBITORIA',
  'REMITIDA_POR_COMPETENCIA',
  'PROCEDE_TRAMITE'
];

export const ETIQUETA_ESTADO_NOTICIA: Record<EstadoNoticia, string> = {
  RECIBIDA: 'Recibida',
  PENDIENTE_CLASIFICACION: 'Pendiente de clasificación',
  EN_EVALUACION_PRELIMINAR: 'En evaluación preliminar',
  PENDIENTE_SUBSANACION: 'Pendiente de subsanación',
  SUBSANACION_RECIBIDA: 'Subsanación recibida',
  EN_REEVALUACION: 'En reevaluación',
  INHIBITORIA: 'Inhibitoria',
  REMITIDA_POR_COMPETENCIA: 'Remitida por competencia',
  PROCEDE_TRAMITE: 'Procede trámite'
};

/** Ícono de acompañamiento: el color nunca es el único portador de significado (CLAUDE.md §6.5). */
export const ICONO_ESTADO_NOTICIA: Record<EstadoNoticia, string> = {
  RECIBIDA: 'inbox',
  PENDIENTE_CLASIFICACION: 'help_outline',
  EN_EVALUACION_PRELIMINAR: 'manage_search',
  PENDIENTE_SUBSANACION: 'hourglass_empty',
  SUBSANACION_RECIBIDA: 'mark_email_read',
  EN_REEVALUACION: 'autorenew',
  INHIBITORIA: 'block',
  REMITIDA_POR_COMPETENCIA: 'forward_to_inbox',
  PROCEDE_TRAMITE: 'task_alt'
};

export const VINCULACIONES: readonly VinculacionInvestigado[] = [
  'ESTUDIANTE_PREGRADO',
  'ESTUDIANTE_POSGRADO',
  'DOCENTE_VINCULADO',
  'DOCENTE_OCASIONAL',
  'DOCENTE_CATEDRA',
  'ADMINISTRATIVO',
  'TRABAJADOR_OFICIAL',
  'DIRECTIVO',
  'NO_TIENE_VINCULO',
  'NO_SE'
];

export const ETIQUETA_VINCULACION: Record<VinculacionInvestigado, string> = {
  ESTUDIANTE_PREGRADO: 'Estudiante de pregrado',
  ESTUDIANTE_POSGRADO: 'Estudiante de posgrado',
  DOCENTE_VINCULADO: 'Profesor vinculado',
  DOCENTE_OCASIONAL: 'Profesor ocasional',
  DOCENTE_CATEDRA: 'Profesor de cátedra',
  ADMINISTRATIVO: 'Administrativo',
  TRABAJADOR_OFICIAL: 'Trabajador oficial',
  DIRECTIVO: 'Directivo',
  NO_TIENE_VINCULO: 'No tiene vínculo',
  NO_SE: 'No sé'
};

export const ETIQUETA_ORIGEN: Record<TipoOrigen, string> = {
  FORMULARIO_WEB_CASILDA: 'Formulario web Casilda',
  FORMULARIO_ANONIMO: 'Formulario de queja anónima',
  REMISION_ACTOR: 'Remisión de otro actor'
};

export const ETIQUETA_ACTOR: Record<ActorCaso, string> = {
  EQUIPO_ATENCION: 'Equipo de Atención',
  LINEA_ALMA: 'Línea Alma',
  SEGURIDAD: 'Seguridad a Personas y Bienes',
  UAD: 'UAD Equipos 3 y 4'
};

export const ETIQUETA_EQUIPO: Record<EquipoUad, string> = {
  EQUIPO_3: 'Equipo 3',
  EQUIPO_4: 'Equipo 4'
};

export const ETIQUETA_FASE: Record<FaseUad, string> = {
  INSTRUCCION: 'Instrucción',
  DECISION: 'Decisión'
};

export const ETIQUETA_FASE_REMISION: Record<FaseProcesoRemision, string> = {
  EVALUACION_PRELIMINAR: 'Evaluación preliminar',
  INSTRUCCION: 'Instrucción',
  DECISION: 'Decisión'
};

export const ETIQUETA_DECISION: Record<TipoDecision, string> = {
  CONTINUAR_TRAMITE: 'Continuar trámite',
  SOLICITAR_INFORMACION: 'Solicitar información adicional',
  INHIBITORIO: 'Registrar decisión inhibitoria',
  REMISION_COMPETENCIA: 'Remitir por competencia'
};

export const DESCRIPCION_DECISION: Record<TipoDecision, string> = {
  CONTINUAR_TRAMITE: 'Ingresa la noticia a la bandeja de casos UAD. No reemplaza el acto jurídico que inicia cada etapa.',
  SOLICITAR_INFORMACION: 'Pide al reportante identificado que complemente la información desde «Mis reportes».',
  INHIBITORIO: 'Registra que no procede iniciar trámite por una causal establecida.',
  REMISION_COMPETENCIA: 'Registra que el asunto corresponde a otra autoridad. Casilda no envía nada a esa entidad.'
};

/** Acción del contrato → decisión del formulario. */
export const ACCION_DE_DECISION: Record<TipoDecision, AccionNoticia> = {
  CONTINUAR_TRAMITE: 'CONTINUAR_TRAMITE',
  SOLICITAR_INFORMACION: 'SOLICITAR_INFORMACION',
  INHIBITORIO: 'INHIBITORIO',
  REMISION_COMPETENCIA: 'REMISION_COMPETENCIA'
};

export const ETIQUETA_EVENTO: Record<TipoEventoHistorial, string> = {
  NOTICIA_RECIBIDA: 'Noticia recibida',
  ASIGNADA_EQUIPO: 'Asignada para evaluación',
  CLASIFICACION_VINCULACION: 'Vinculación clasificada',
  CASOS_ASOCIADOS_CONSULTADOS: 'Consulta de casos asociados',
  SOLICITUD_INFORMACION: 'Solicitud de información adicional',
  SUBSANACION_RECIBIDA: 'Subsanación recibida',
  DECISION_REGISTRADA: 'Decisión registrada',
  CASO_VINCULADO: 'Vinculada a caso existente',
  CASO_CREADO: 'Caso CASILDA creado',
  NOTIFICACION: 'Notificación',
  ACTUACION: 'Actuación',
  TRASLADO_FASE: 'Traslado de fase',
  RECTIFICACION: 'Rectificación'
};

export const ETIQUETA_ESTADO_NOTIFICACION: Record<NotificacionEstado['estado'], string> = {
  PENDIENTE: 'pendiente de envío',
  ENVIADA: 'enviada',
  FALLIDA: 'fallida',
  NO_APLICA: 'no aplica'
};

export const ETIQUETA_DESTINATARIO: Record<NotificacionEstado['destinatario'], string> = {
  REPORTANTE: 'Reportante',
  VICTIMA: 'Víctima',
  ACTOR_DESTINO: 'Actor destinatario'
};
