import {
  CanalIngreso,
  EstadoAtencion,
  LugarOcurrencia,
  MedioConsentimiento,
  OrigenRemision,
  TipoContexto,
  Triaje
} from './alma.types';

/**
 * DTO del contrato de Línea Alma (`docs/contratos/linea-alma/`), en `camelCase` (Q14).
 * Fechas en ISO-8601 con zona horaria. **Los componentes no usan estos tipos crudos: pasan por
 * `aph/services/*`**, de modo que un cambio de contrato cae en un solo archivo.
 */

/** Respuesta paginada estándar (A.1). */
export interface PaginaAlma<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

/** F3 — SLA. Siempre se calcula con `ahoraServidor`, nunca con el reloj del navegador (R6). */
export interface SlaDto {
  horasLimite: number;
  venceEn: string;
  ahoraServidor: string;
}

/** F5 — Consentimiento. `versionTexto` es una adición propuesta (decisión D-ALMA-06). */
export interface ConsentimientoDto {
  otorgado: boolean;
  medio: MedioConsentimiento;
  fechaRegistro: string;
  versionTexto?: string;
}

export type TipoNota = 'APH' | 'PSICO' | 'SEGTO' | 'POST_CIERRE';
export interface NotaAtencionDto {
  idNota: string;
  tipoOrigen: TipoNota;
  contenido: string;
  fechaRegistro: string;
  autor: string;
}

/** Datos de la persona que se capturan en APH (variables homologadas con EA, RF-ALMA-006). Ver `caracterizacion-campos.ts`. */
export interface PersonaAtencionDto {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres: string | null;
  apellidos: string | null;
  /** El backend real usa estos cuatro en lugar de `nombres`/`apellidos` (ver `almaContratoInterceptor`). */
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  telefonoPrincipal: string | null;
  correoPersonal: string | null;
  ciudad: string | null;
  estrato: number | null;
  /** `YYYY-MM-DD`. Revisión de flujos 2026-11: se captura igual que en el formulario del Equipo de Atención. */
  fechaNacimiento?: string | null;
  /** Código del catálogo `identidades-genero`. */
  identidadGenero?: string | null;
  /** Código del catálogo `vinculos-udea`. */
  vinculoUniversidad?: string | null;
}

/**
 * Quien se comunica. En una solicitud **indirecta** (`esTercero`) es un tercero y lleva su relación
 * con la persona; el teléfono y el correo son suyos y opcionales.
 */
export interface SolicitanteDto {
  esTercero: boolean;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  correo: string | null;
  /** Código del catálogo `parentescos-solicitante`. */
  parentesco: string | null;
  /** Texto libre cuando el parentesco es «Otro (¿Cuál?)». */
  parentescoOtro: string | null;
}

/** Archivo adjunto a la atención (evidencias y documentos, opcional). */
export interface EvidenciaAtencionDto {
  idEvidencia: string;
  nombre: string;
  tipo: string;
  tamanoBytes: number;
  fechaRegistro: string;
}

/** Novedad que APH registra sobre una remisión tras comunicarse de nuevo con la persona. */
export interface SeguimientoRemisionDto {
  idSeguimiento: string;
  /** Momento en que se captó la novedad (ISO-8601). */
  fechaHora: string;
  novedad: string;
  autor: string;
}

export interface SeguimientoRemisionCrearDto {
  novedad: string;
  fechaHora: string;
}

export interface OmisionTriajeDto {
  peligroInminente: true;
  justificacion: string;
}

export interface CierreAtencionDto {
  motivo: string;
  observacion: string | null;
  fecha: string;
}

export interface DerivacionInternaDto {
  idDerivacion: string;
  tipoContexto: TipoContexto;
  idContexto: string;
  destino: string;
  motivo: string;
  /** El backend real devuelve `REGISTRADA` (pedido B-2 de la revisión backend 2026-11-20: preferiblemente `ENVIADA`). */
  estado: 'REGISTRADA' | 'ENVIADA' | 'RECIBIDA' | 'RECHAZADA' | 'CERRADA';
  /** Para la concurrencia optimista del cierre (propuesta: ver revisión backend 2026-11-20). */
  version?: number;
  /** El backend real lo devuelve en `null` (B-2); mientras tanto se usa `fechaRegistro`. */
  fechaEnvio: string | null;
  fechaRegistro?: string;
  peligroInminente: boolean;
  consentimiento: ConsentimientoDto | null;
  resultado: string | null;
  /** Solo con `environment.lineaAlma.extensiones`: el backend real no lo devuelve. */
  seguimientos?: SeguimientoRemisionDto[];
}

/** Cuerpo de `PATCH /derivaciones/internas/{id}` para cerrarla con su resultado. */
export interface DerivacionInternaCerrarDto {
  version: number;
  estado: 'CERRADA';
  resultado: string;
}

export type EstadoRutaExterna = 'ACTIVADA' | 'EN_SEGUIMIENTO' | 'CERRADA';
export interface RutaExternaDto {
  idRuta: string;
  version: number;
  tipoContexto: TipoContexto;
  idContexto: string;
  entidad: string;
  motivo: string;
  fechaActivacion: string;
  estado: EstadoRutaExterna;
  resultado: string | null;
  peligroInminente: boolean;
  consentimiento: ConsentimientoDto | null;
  /** Solo con `environment.lineaAlma.extensiones`: el backend real no lo devuelve. */
  seguimientos?: SeguimientoRemisionDto[];
}

/** Atención APH completa. Para el rol Psicología solo trae notas `APH` (RNF-ALMA-002). */
export interface AtencionAphDto {
  idAtencion: string;
  version: number;
  estado: EstadoAtencion;
  canalIngreso: CanalIngreso;
  origenRemision: OrigenRemision | null;
  persona: PersonaAtencionDto;
  solicitante: SolicitanteDto | null;
  /** Dentro o fuera de la universidad (opcional). */
  lugarOcurrencia?: LugarOcurrencia | null;
  motivoConsulta: string | null;
  notaAph: string | null;
  evidencias?: EvidenciaAtencionDto[];
  triaje: Triaje | null;
  omisionTriaje: OmisionTriajeDto | null;
  aceptaPsicologia: boolean | null;
  consentimiento: ConsentimientoDto | null;
  fechaDerivacion: string | null;
  sla: SlaDto | null;
  tomadaPor: string | null;
  cierre: CierreAtencionDto | null;
  numeroCaso: string | null;
  /** Hay actuaciones activas del mismo caso en Equipo de Atención y en Línea Alma (Q15). */
  gestionSimultanea: boolean;
  notas: NotaAtencionDto[];
  derivaciones: DerivacionInternaDto[];
  rutasExternas: RutaExternaDto[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

/** Cuerpo de `POST /atenciones-aph` y de `PATCH /atenciones-aph/{id}`: todo opcional salvo documento y canal al crear. */
export interface AtencionAphGuardarDto {
  version?: number;
  canalIngreso?: CanalIngreso;
  persona?: Partial<PersonaAtencionDto>;
  solicitante?: SolicitanteDto | null;
  lugarOcurrencia?: LugarOcurrencia | null;
  motivoConsulta?: string | null;
  notaAph?: string | null;
  aceptaPsicologia?: boolean | null;
}

export interface TriajeRequestDto {
  version: number;
  triaje?: Triaje;
  peligroInminente?: boolean;
  justificacionOmision?: string;
}

/** F1 — respuesta de `POST /atenciones-aph/{id}/derivaciones/psicologia`. */
export interface DerivacionPsicologiaDto {
  idAtencion: string;
  version: number;
  estado: EstadoAtencion;
  triaje: Triaje;
  fechaDerivacion: string;
  sla: SlaDto;
}

/** F2 — respuesta de `GET /personas/consulta` para un Técnico APH: nunca información clínica. */
export interface ConsultaPersonaDto {
  existe: boolean;
  persona: { idPersona: number; nombres: string; apellidos: string } | null;
  seguimientoActivo: {
    activo: boolean;
    proximoSeguimiento: string | null;
    profesional: string | null;
  } | null;
  tieneCasoCerrado: boolean;
  /** Adición propuesta a F2 (D-ALMA-05): permite registrar la contención post-cierre sobre el caso correcto. */
  ultimoCasoCerrado: { numeroCaso: string; fechaCierre: string } | null;
}

export interface DerivacionInternaCrearDto {
  tipoContexto: TipoContexto;
  idContexto: string;
  destino: string;
  motivo: string;
  peligroInminente?: boolean;
  consentimiento?: ConsentimientoDto | null;
}

export interface RutaExternaCrearDto {
  tipoContexto: TipoContexto;
  idContexto: string;
  entidad: string;
  motivo: string;
  fechaActivacion: string;
  peligroInminente?: boolean;
  consentimiento?: ConsentimientoDto | null;
}

export interface RutaExternaActualizarDto {
  version: number;
  estado: EstadoRutaExterna;
  resultado?: string | null;
}

export interface CierreAtencionRequestDto {
  version: number;
  motivo: string;
  observacion?: string | null;
}

export interface ContencionPostCierreCrearDto {
  idAtencion: string;
  numeroCaso: string;
  nota: string;
}

export interface ContencionPostCierreDto {
  idContencion: string;
  idAtencion: string;
  numeroCaso: string;
  /** Siempre `POST_CIERRE`: no reabre el caso ni incrementa el contador de seguimientos. */
  tipoSeguimiento: 'POST_CIERRE';
  nota: string;
  fechaRegistro: string;
  autor: string;
}

export type VistaBandejaAph = 'remisiones' | 'mias';

export interface BandejaAphItemDto {
  idAtencion: string;
  version: number;
  persona: { tipoIdentificacion: string; numeroIdentificacion: string; nombreCompleto: string };
  canalIngreso: CanalIngreso;
  origenRemision: OrigenRemision | null;
  resumen: string | null;
  fechaRemision: string;
  estado: EstadoAtencion;
  tomadaPor: string | null;
  triaje: Triaje | null;
  /** Solo en la vista `mias`, para las derivadas a Psicología. */
  sla: SlaDto | null;
}

export interface FiltroBandejaAph {
  vista: VistaBandejaAph;
  origen?: OrigenRemision | '';
  estado?: string;
  page: number;
  size: number;
}

export interface AuditoriaEventoDto {
  idEvento: string;
  fechaHora: string;
  usuario: string;
  accion: 'CREACION' | 'ACTUALIZACION' | 'CAMBIO_ESTADO' | 'DERIVACION' | 'VINCULACION' | 'NOTA';
  detalle: string;
}

/** Error estándar del módulo (A.1). */
export interface ErrorAlmaDto {
  codigo: string;
  mensaje: string;
  detalles?: Record<string, unknown>;
}
