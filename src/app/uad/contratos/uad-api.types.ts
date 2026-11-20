/**
 * Tipos del contrato UAD (Equipos 3 y 4). **Espejo de `docs/contratos/uad/openapi-uad.yaml`.**
 *
 * Estado: PROPUESTO — NO IMPLEMENTADO en el backend (auditoría del 2026-11-14, `AUDITORIA_UAD.md`).
 * Si el OpenAPI cambia, este archivo cambia con él y en el mismo commit. Cuando Backend publique la
 * especificación real se puede generar con `openapi-typescript` (ver `docs/contratos/uad/README.md` §4)
 * y este archivo pasa a reexportar los tipos generados sin tocar componentes.
 *
 * Identificadores (UAD-ID-01): `noticiaId` (técnico), `consecutivo` (NDI/NDA, oficial), `casoId`
 * (caso institucional CASILDA), `expedienteUad` (interno UAD) y `casoUadId` (técnico de la gestión UAD)
 * son **distintos** y nunca se usan uno por otro. El frontend no genera ninguno.
 */

export type TipoNoticia = 'NDI' | 'NDA';

export type EstadoNoticia =
  | 'RECIBIDA'
  | 'PENDIENTE_CLASIFICACION'
  | 'EN_EVALUACION_PRELIMINAR'
  | 'PENDIENTE_SUBSANACION'
  | 'SUBSANACION_RECIBIDA'
  | 'EN_REEVALUACION'
  | 'INHIBITORIA'
  | 'REMITIDA_POR_COMPETENCIA'
  | 'PROCEDE_TRAMITE';

export type TipoOrigen = 'FORMULARIO_WEB_CASILDA' | 'FORMULARIO_ANONIMO' | 'REMISION_ACTOR';
export type ActorRuta = 'EQUIPO_ATENCION' | 'LINEA_ALMA' | 'SEGURIDAD';

export interface OrigenNoticia {
  readonly tipo: TipoOrigen;
  readonly actorRemitente: ActorRuta | null;
}

/** Lista de UAD-FOR-10. No coincide con `VinculoUdeAEnum` del backend (D-UAD-05). */
export type VinculacionInvestigado =
  | 'ESTUDIANTE_PREGRADO'
  | 'ESTUDIANTE_POSGRADO'
  | 'DOCENTE_VINCULADO'
  | 'DOCENTE_OCASIONAL'
  | 'DOCENTE_CATEDRA'
  | 'ADMINISTRATIVO'
  | 'TRABAJADOR_OFICIAL'
  | 'DIRECTIVO'
  | 'NO_TIENE_VINCULO'
  | 'NO_SE';

export type EquipoUad = 'EQUIPO_3' | 'EQUIPO_4';
export type FaseUad = 'INSTRUCCION' | 'DECISION';

export type AccionNoticia =
  | 'CLASIFICAR_VINCULACION'
  | 'CONSULTAR_CASOS_ASOCIADOS'
  | 'CONTINUAR_TRAMITE'
  | 'SOLICITAR_INFORMACION'
  | 'INHIBITORIO'
  | 'REMISION_COMPETENCIA'
  | 'DESCARGAR_EVIDENCIAS';

export type CapacidadUad = 'VER_NDI' | 'VER_NDA' | 'EVALUAR_NOTICIA' | 'VER_CASOS' | 'GESTIONAR_CASO';

export interface ContextoUsuarioUad {
  readonly equipos: readonly EquipoUad[];
  readonly coordinacion: boolean;
  readonly capacidades: readonly CapacidadUad[];
}

export interface DetalleExpandible {
  readonly telefono: string | null;
  readonly correo: string | null;
  readonly descripcionHechos: string | null;
}

export interface RevisionConcurrente {
  readonly desde: string;
  readonly equipo: EquipoUad;
}

export interface NoticiaResumen {
  readonly noticiaId: string;
  readonly consecutivo: string;
  readonly tipo: TipoNoticia;
  readonly casoId: string | null;
  readonly origen: OrigenNoticia;
  readonly fechaRecepcion: string;
  readonly estado: EstadoNoticia;
  readonly vinculacionDeclarada: VinculacionInvestigado | null;
  readonly clasificada: boolean;
  readonly version: number;
  readonly revisionConcurrente: RevisionConcurrente | null;
  readonly detalleExpandible: DetalleExpandible;
}

/** Subconjunto de `org.springframework.data.domain.Page` (convención real del backend). */
export interface Pagina<T> {
  readonly content: readonly T[];
  readonly totalElements: number;
  readonly totalPages: number;
  readonly number: number;
  readonly size: number;
  readonly first?: boolean;
  readonly last?: boolean;
}

export interface FiltroNoticias {
  readonly tipo: TipoNoticia;
  readonly estado?: EstadoNoticia | null;
  readonly fechaRecepcionDesde?: string | null;
  readonly fechaRecepcionHasta?: string | null;
  readonly consecutivo?: string | null;
  readonly page: number;
  readonly size: number;
}

export interface Reportante {
  readonly tipoSolicitud: 'DIRECTA' | 'INDIRECTA';
  readonly primerNombre: string | null;
  readonly segundoNombre: string | null;
  readonly primerApellido: string | null;
  readonly segundoApellido: string | null;
  readonly tipoDocumento: string | null;
  readonly numeroDocumento: string | null;
  readonly celular: string | null;
  readonly correoInstitucional: string | null;
  readonly correoPersonal: string | null;
}

export interface PersonaAfectada {
  readonly nombreCompleto: string | null;
  readonly vinculoUniversidad: string | null;
}

export interface Hechos {
  readonly descripcion: string;
  readonly lugarOcurrencia: string | null;
  readonly presuntoResponsable: string | null;
}

export interface EvidenciaMetadato {
  readonly evidenciaId: string;
  readonly nombreArchivo: string;
  readonly tipoMime: string;
  readonly tamanoBytes: number | null;
  readonly fechaCarga: string;
}

export interface SolicitudInformacionVigente {
  readonly solicitudId: string;
  readonly tipoSolicitudCodigo: string;
  readonly informacionRequerida: string;
  readonly fechaSolicitud: string;
  readonly fechaLimite: string;
  readonly vencida: boolean;
  readonly respondida: boolean;
  /** Texto con el que respondió el reportante desde «Mis reportes». Ausente o `null` mientras no responda. */
  readonly respuesta?: string | null;
  readonly fechaRespuesta?: string | null;
}

export interface NoticiaDetalle {
  readonly noticiaId: string;
  readonly consecutivo: string;
  readonly tipo: TipoNoticia;
  readonly casoId: string | null;
  readonly expedienteUad: string | null;
  readonly casoUadId: string | null;
  readonly origen: OrigenNoticia;
  readonly fechaRecepcion: string;
  readonly estado: EstadoNoticia;
  readonly version: number;
  readonly vinculacionDeclarada: VinculacionInvestigado | null;
  readonly vinculacionClasificada: VinculacionInvestigado | null;
  readonly equiposCompetentes: readonly EquipoUad[];
  readonly reportante: Reportante | null;
  readonly personaAfectada: PersonaAfectada | null;
  readonly hechos: Hechos;
  readonly evidencias: readonly EvidenciaMetadato[];
  readonly solicitudInformacion: SolicitudInformacionVigente | null;
  readonly revisionConcurrente: RevisionConcurrente | null;
  readonly accionesDisponibles: readonly AccionNoticia[];
  readonly motivosNoDisponible: Readonly<Partial<Record<AccionNoticia, string>>>;
}

export interface ClasificacionRequest {
  readonly vinculacionInvestigado: VinculacionInvestigado;
  readonly version: number;
}

export interface ClasificacionResponse {
  readonly visibleParaUsuario: boolean;
  readonly noticia: NoticiaDetalle | null;
}

export type ActorCaso = ActorRuta | 'UAD';

export interface CasoAsociado {
  readonly casoId: string;
  readonly actor: ActorCaso;
  readonly fechaApertura: string | null;
  readonly estadoGestionActor: 'ACTIVO' | 'CERRADO';
}

export type TipoDecision = 'CONTINUAR_TRAMITE' | 'SOLICITAR_INFORMACION' | 'INHIBITORIO' | 'REMISION_COMPETENCIA';
export type ModoCaso = 'CONSERVAR_ASIGNADO' | 'VINCULAR_EXISTENTE' | 'CREAR_NUEVO';
export type FaseProcesoRemision = 'EVALUACION_PRELIMINAR' | 'INSTRUCCION' | 'DECISION';

export interface ContinuarTramiteDatos {
  readonly modoCaso: ModoCaso;
  readonly casoIdVincular: string | null;
  readonly confirmaMismosHechos: boolean;
  readonly expedienteUad: string | null;
}

export interface SolicitudInformacionDatos {
  readonly tipoSolicitudCodigo: string;
  readonly informacionRequerida: string;
  readonly fechaLimite: string;
}

export interface InhibitorioDatos {
  readonly causalCodigo: string;
  readonly justificacion: string | null;
}

export interface RemisionCompetenciaDatos {
  readonly faseProceso: FaseProcesoRemision;
  readonly entidadDestinatariaCodigo: string;
  readonly fechaRemision: string;
  readonly justificacion: string | null;
}

/** Exactamente un bloque presente: el que corresponde a `tipo`. */
export interface DecisionEvaluacionRequest {
  readonly tipo: TipoDecision;
  readonly version: number;
  readonly observaciones?: string | null;
  readonly continuarTramite?: ContinuarTramiteDatos;
  readonly solicitudInformacion?: SolicitudInformacionDatos;
  readonly inhibitorio?: InhibitorioDatos;
  readonly remisionCompetencia?: RemisionCompetenciaDatos;
}

export interface NotificacionEstado {
  readonly evento: 'NOTICIA_RADICADA' | 'SOLICITUD_INFORMACION' | 'ADMISION' | 'CAMBIO_FASE' | 'TRASLADO' | 'REMISION_INTERNA';
  readonly destinatario: 'REPORTANTE' | 'VICTIMA' | 'ACTOR_DESTINO';
  readonly estado: 'PENDIENTE' | 'ENVIADA' | 'FALLIDA' | 'NO_APLICA';
  readonly motivo: string | null;
}

export interface CasoUadResumen {
  readonly casoUadId: string;
  readonly casoId: string;
  readonly expedienteUad: string | null;
  readonly consecutivosNoticia: readonly string[];
  readonly victimaNombre: string | null;
  readonly vinculacionInvestigado: VinculacionInvestigado;
  readonly fechaAdmision: string;
  readonly faseActual: FaseUad;
  readonly equipoResponsable: EquipoUad;
  readonly estadoGestion: EstadoGestionUad;
  readonly version: number;
}

/** Estado de la **gestión UAD** (UAD-SEG-04): no es el de la noticia ni el del caso CASILDA global. */
export type EstadoGestionUad = 'ACTIVA' | 'FINALIZADA';

export interface CasoUadDetalle extends CasoUadResumen {
  /** Otros motivos (inhibitoria posterior, terminación, fallo en firme): PENDIENTES DE VALIDACIÓN. */
  readonly motivoFinGestion: 'REMITIDA_POR_COMPETENCIA' | null;
  readonly fechaUltimoTraslado: string | null;
  readonly equipoInstructor: EquipoUad;
  readonly equipoDecisor: EquipoUad;
}

/** Catálogo definitivo de la bitácora §7 (ordinarias) y §8 (permanentes). */
export type CodigoActuacion =
  | 'INDAGACION_PREVIA'
  | 'INVESTIGACION_DISCIPLINARIA'
  | 'AVERIGUACIONES_PRELIMINARES'
  | 'PRACTICA_PRUEBAS'
  | 'PLIEGO_CARGOS'
  | 'AUDIENCIAS'
  | 'MEDIACION'
  | 'FALLO'
  | 'REPOSICION_APELACION'
  | 'REMISION_COMPETENCIA'
  | 'INHIBITORIO'
  | 'TERMINACION'
  | 'FINALIZAR_INSTRUCCION'
  | 'REMISION_RUTA';

export interface ActuacionDisponible {
  readonly codigo: CodigoActuacion;
  readonly nombre: string;
  /** Acción permanente (§8): visible siempre; se ejecuta por su propia operación. */
  readonly permanente: boolean;
  readonly ejecutable: boolean;
  readonly motivoNoEjecutable: string | null;
  /** Sujeta a validación jurídica (§16): se muestra deshabilitada. */
  readonly pendienteValidacion: boolean;
}

export interface ExpedienteRequest {
  readonly expedienteUad: string | null;
  readonly version: number;
}

export interface RegistrarActuacionesRequest {
  readonly actuaciones: readonly CodigoActuacion[];
  readonly observaciones: string | null;
  readonly version: number;
}

export interface TrasladoRequest {
  readonly confirmaTraslado: boolean;
  readonly observaciones: string | null;
  readonly version: number;
}

/** La fase la toma el servidor de la fase actual del caso. Sin oficio ni radicado de salida (UAD-REM-03). */
export interface RemisionCompetenciaCasoRequest {
  readonly entidadDestinatariaCodigo: string;
  readonly fechaRemision: string;
  readonly justificacion: string | null;
  readonly version: number;
}

export interface ResultadoAccionCaso {
  /** `false` si tras la acción el caso dejó de ser del equipo y fase del usuario (p. ej. tras el traslado). */
  readonly visibleParaUsuario: boolean;
  readonly caso: CasoUadDetalle | null;
  readonly eventos: readonly EventoHistorial[];
  readonly notificaciones: readonly NotificacionEstado[];
}

export interface DecisionEvaluacionResponse {
  readonly noticia: NoticiaDetalle;
  readonly casoUad: CasoUadResumen | null;
  readonly notificaciones: readonly NotificacionEstado[];
}

export type TipoEventoHistorial =
  | 'NOTICIA_RECIBIDA'
  | 'ASIGNADA_EQUIPO'
  | 'CLASIFICACION_VINCULACION'
  | 'CASOS_ASOCIADOS_CONSULTADOS'
  | 'SOLICITUD_INFORMACION'
  | 'SUBSANACION_RECIBIDA'
  | 'DECISION_REGISTRADA'
  | 'CASO_VINCULADO'
  | 'CASO_CREADO'
  | 'NOTIFICACION'
  | 'ACTUACION'
  | 'TRASLADO_FASE'
  | 'EXPEDIENTE_ACTUALIZADO'
  | 'REMISION_COMPETENCIA'
  | 'RECTIFICACION';

export interface EventoHistorial {
  readonly eventoId: string;
  readonly tipo: TipoEventoHistorial;
  readonly fecha: string;
  readonly descripcion: string;
  readonly profesional: string | null;
  readonly equipo: EquipoUad | null;
  readonly fase: FaseUad | null;
  readonly estadoAnterior: string | null;
  readonly estadoNuevo: string | null;
  readonly observaciones: string | null;
}

/** `MaestroDTO` real del backend (`GET /maestros/...`). */
export interface MaestroUad {
  readonly id: number;
  readonly codigo: string | null;
  readonly nombre: string;
}

export type CatalogoUad = 'uad-causales-inhibitorio' | 'uad-entidades-remision' | 'uad-tipos-solicitud-informacion';

export interface FiltroCasosUad {
  readonly fase?: FaseUad | null;
  readonly page: number;
  readonly size: number;
}

/**
 * Queja anónima (NDA), `POST /uad/noticias-anonimas`. Sin identidad ni contacto de quien envía
 * (UAD-NOT-04); ningún campo se precarga desde la sesión.
 */
export interface RadicacionNdaRequest {
  readonly descripcionHechos: string;
  readonly lugarOcurrencia: string | null;
  readonly presuntoResponsable: string | null;
  readonly vinculacionDeclarada: VinculacionInvestigado | null;
}

/** Solo el consecutivo y la fecha: nunca datos de quien envía. */
export interface RadicacionNdaResponse {
  readonly consecutivo: string;
  readonly fechaRecepcion: string;
}

/** Cuerpo de error real del backend (`ErrorResponse`/`ValidationErrorResponse`) + `codigo` propuesto. */
export interface ErrorResponseUad {
  readonly timestamp?: string;
  readonly status: number;
  readonly error?: string;
  readonly message: string;
  readonly path?: string | null;
  readonly codigo?: string | null;
  readonly validationErrors?: Readonly<Record<string, string>>;
}

// ---------------------------------------------------------------------------
// «Mis reportes» (Entrega 3): lo que ve quien radicó. Sin datos internos de la UAD.
// ---------------------------------------------------------------------------

/** Actor de la Ruta que gestiona el reporte. El backend hoy solo entrega `UAD`. */
export type ActorMiReporte = 'EQUIPO_ATENCION' | 'LINEA_ALMA' | 'SEGURIDAD' | 'UAD';

export interface MiReporteResumen {
  /** Código del reporte que la persona recibió al radicar (`CAS-…`). Clave de `obtenerMiReporte`. */
  readonly codigo: string;
  /** Consecutivo de la noticia UAD (`NDI-…`). */
  readonly consecutivo?: string | null;
  readonly actor: ActorMiReporte;
  /** Estado en lenguaje para la persona usuaria: lo redacta el servidor (PROVISIONAL, D-UAD-32). */
  readonly estado: string;
  readonly fechaRegistro: string;
  readonly fechaUltimaActuacion?: string | null;
  readonly solicitudPendiente: boolean;
}

export interface MiReporteDetalle extends MiReporteResumen {
  readonly solicitudInformacion?: SolicitudInformacionVigente | null;
}
