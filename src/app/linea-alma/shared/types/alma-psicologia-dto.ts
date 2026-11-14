import {
  CanalIngreso,
  DecisionRecontacto,
  EstadoAtencion,
  EstadoCaso,
  EstadoRecordatorio,
  OrigenRemision,
  PrioridadCaso,
  ProtocoloIntento,
  RiesgoClinico,
  TipoSeguimiento,
  Triaje
} from './alma.types';
import {
  CierreAtencionDto,
  ConsentimientoDto,
  DerivacionInternaDto,
  NotaAtencionDto,
  OmisionTriajeDto,
  PersonaAtencionDto,
  RutaExternaDto,
  SlaDto
} from './alma-dto';

/**
 * DTO del contrato del submódulo **Psicología** (`docs/contratos/linea-alma/contrato-psicologia-*.md`),
 * en `camelCase` (Q14) y fechas ISO-8601 con zona. Dueño: Jonathan.
 *
 * **Los componentes no usan estos tipos crudos: pasan por `psicologia/services/*`**, que
 * mapean DTO → modelo de vista. Un cambio de contrato cae en un solo archivo.
 *
 * Decisión Q2: mientras no exista `numeroCaso`, la **novedad** (≈ `atencion_psicologia` del ER)
 * se identifica por `idAtencion` (`ALMA-…`).
 */

// ───────────────────────── bandeja (J-1.1) ─────────────────────────

export type SemaforoSla = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface BandejaPsicologiaItemDto {
  idAtencion: string;
  version: number;
  persona: { tipoIdentificacion: string; numeroIdentificacion: string; nombreCompleto: string };
  triaje: Triaje;
  canalIngreso: CanalIngreso;
  estado: EstadoAtencion;
  fechaDerivacion: string;
  /** Nombre de la profesional que tomó la novedad; `null` en la cola compartida. */
  tomadaPor: string | null;
  /** La sesión actual es quien la tomó (lo calcula el servidor, D-PSI-03). */
  tomadaPorMi: boolean;
  /** La persona ya tiene un caso activo: requiere resolución de recontacto (F2, RN-ALMA-06). */
  recontacto: boolean;
  intentosRealizados: number;
  sla: SlaDto;
}

export interface FiltroBandejaPsicologia {
  triaje?: Triaje | '';
  semaforo?: SemaforoSla | '';
  estado?: EstadoAtencion | '';
  documento?: string;
  page: number;
  size: number;
}

/** `GET /psicologia/notificaciones` — contadores para la cabecera y el refresco de la bandeja (Q7). */
export interface NotificacionesPsicologiaDto {
  novedadesPendientes: number;
  recontactosPendientes: number;
  slaVencidos: number;
  ahoraServidor: string;
}

// ───────────────────────── novedad (J-1.2, J-1.3) ─────────────────────────

export interface IntentoContactoDto {
  idIntento: string;
  numeroIntento: number;
  protocolo: ProtocoloIntento;
  fechaHora: string;
  /** Código del catálogo `resultados-intento`. */
  resultado: string;
  nota: string;
  /** Obligatoria desde el cuarto intento (Q11). */
  justificacion: string | null;
  autor: string;
}

export interface IntentoContactoCrearDto {
  version: number;
  fechaHora: string;
  resultado: string;
  nota: string;
  justificacion?: string | null;
}

/** Caso activo de la persona, resumido para la novedad y el recontacto. Solo visible con `alma.notasClinicas.consultar`. */
export interface CasoActivoResumenDto {
  numeroCaso: string;
  estado: EstadoCaso;
  fechaApertura: string;
  profesional: string | null;
  numeroSeguimientos: number;
  proximoControl: string | null;
}

/** Detalle de la novedad: lo que APH entregó (F1) más la gestión de Psicología. */
export interface NovedadPsicologiaDto {
  idAtencion: string;
  version: number;
  estado: EstadoAtencion;
  canalIngreso: CanalIngreso;
  origenRemision: OrigenRemision | null;
  persona: PersonaAtencionDto;
  motivoConsulta: string | null;
  /** Triaje de APH. **No es editable** por Psicología (RN-ALMA-04). */
  triaje: Triaje | null;
  omisionTriaje: OmisionTriajeDto | null;
  consentimientoAph: ConsentimientoDto | null;
  fechaDerivacion: string;
  sla: SlaDto;
  tomadaPor: string | null;
  tomadaPorMi: boolean;
  recontacto: boolean;
  casoActivo: CasoActivoResumenDto | null;
  /** Caso al que quedó vinculada tras el primer contacto o la resolución del recontacto. */
  numeroCaso: string | null;
  /** Solo notas `APH` y `POST_CIERRE` (las clínicas viven en el caso). */
  notasAph: NotaAtencionDto[];
  derivaciones: DerivacionInternaDto[];
  rutasExternas: RutaExternaDto[];
  intentos: IntentoContactoDto[];
  /** Presente cuando se cerró por «No contacto» (9 intentos) o por contención puntual. */
  cierre: CierreAtencionDto | null;
  gestionSimultanea: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// ───────────────────────── primer contacto y caso (J-1.4, J-2.1) ─────────────────────────

export interface ValoracionRiesgoDto {
  nivel: RiesgoClinico;
  descripcion: string;
}

export interface PresuntoAgresorDto {
  nombres: string | null;
  apellidos: string | null;
  /** Código del catálogo `vinculos-agresor`. */
  vinculo: string | null;
  convivencia: boolean | null;
  observaciones: string | null;
}

export interface PrimerContactoRequestDto {
  version: number;
  /** Variante verbal (F5). Sin él el servidor responde `422 CONSENTIMIENTO_REQUERIDO`. */
  consentimiento: ConsentimientoDto;
  persona: Partial<PersonaAtencionDto>;
  valoracionRiesgo: ValoracionRiesgoDto;
  /** Códigos del catálogo `dimensiones-salud-mental`. */
  dimensiones: string[];
  presuntoAgresor: PresuntoAgresorDto | null;
  acuerdos: string;
  proximoControl: string;
  /**
   * Si la persona ya tiene un caso activo, el servidor responde `422 CASO_ACTIVO_EXISTENTE` hasta
   * que la UI confirme explícitamente la vinculación enviando aquí ese `numeroCaso` (RN-ALMA-06).
   * `CASO_NUEVO` pide abrir un caso distinto aunque exista uno activo.
   */
  vincularA?: string | 'CASO_NUEVO' | null;
}

export interface AtencionVinculadaDto {
  idAtencion: string;
  fechaCreacion: string;
  canalIngreso: CanalIngreso;
  triaje: Triaje | null;
  estado: EstadoAtencion;
  motivoConsulta: string | null;
}

export interface RecordatorioDto {
  estado: EstadoRecordatorio;
  correo: string | null;
  fechaEnvio: string | null;
}

export interface SeguimientoDto {
  idSeguimiento: string;
  numeroSeguimiento: number;
  tipo: TipoSeguimiento;
  fecha: string;
  nota: string;
  deseaContinuar: boolean;
  proximoControl: string | null;
  recordatorio: RecordatorioDto | null;
  autor: string;
}

export interface SeguimientoCrearDto {
  version: number;
  nota: string;
  deseaContinuar: boolean;
  proximoControl?: string | null;
}

export interface CierreCasoDto {
  /** Código del catálogo `motivos-cierre-psicologia`. */
  motivo: string;
  observacion: string | null;
  fecha: string;
  autor: string;
}

export interface CierreCasoRequestDto {
  version: number;
  motivo: string;
  observacion?: string | null;
}

/** Expediente del caso (`GET /casos/{numeroCaso}`): una sola llamada para la vista consolidada (J-2.1). */
export interface CasoDto {
  numeroCaso: string;
  version: number;
  estado: EstadoCaso;
  prioridad: PrioridadCaso;
  persona: PersonaAtencionDto;
  fechaApertura: string;
  profesional: string | null;
  /** Triaje de APH y valoración clínica se conservan por separado (RN-ALMA-04). */
  triajeAph: Triaje | null;
  valoracionRiesgo: ValoracionRiesgoDto | null;
  consentimiento: ConsentimientoDto | null;
  dimensiones: string[];
  presuntoAgresor: PresuntoAgresorDto | null;
  acuerdos: string | null;
  /** Atenciones APH vinculadas (1:N). */
  atenciones: AtencionVinculadaDto[];
  numeroSeguimientos: number;
  proximoControl: string | null;
  seguimientos: SeguimientoDto[];
  notas: NotaAtencionDto[];
  cierre: CierreCasoDto | null;
  /** Hay actuaciones activas en Equipo de Atención y en Línea Alma (Q15). */
  gestionSimultanea: boolean;
  pdfDisponible: boolean;
  fechaActualizacion: string;
}

export interface PrimerContactoRespuestaDto {
  numeroCaso: string;
  idAtencion: string;
  version: number;
  estadoAtencion: EstadoAtencion;
  /** `true` si se vinculó a un caso existente en vez de crear uno. */
  vinculado: boolean;
}

// ───────────────────────── agenda (J-1.5) ─────────────────────────

export type AlcanceAgenda = 'mios' | 'todos';

export interface AgendaItemDto {
  numeroCaso: string;
  nombreCompleto: string;
  proximoControl: string;
  numeroSeguimientos: number;
  profesional: string | null;
  recordatorio: RecordatorioDto | null;
}

// ───────────────────────── recontactos (J-1.7, F2) ─────────────────────────

export interface RecontactoDto {
  idAtencion: string;
  version: number;
  fechaCreacion: string;
  canalIngreso: CanalIngreso;
  triaje: Triaje | null;
  motivoConsulta: string | null;
  notaAph: string | null;
  persona: { tipoIdentificacion: string; numeroIdentificacion: string; nombreCompleto: string };
  casoActivo: CasoActivoResumenDto & { ultimaNota: string | null };
}

export interface ResolucionRecontactoRequestDto {
  version: number;
  decision: DecisionRecontacto;
  /** Obligatorio con `VINCULAR_A_CASO` y `CONTENCION_PUNTUAL`. */
  numeroCaso?: string | null;
  nota: string;
}

export interface ResolucionRecontactoRespuestaDto {
  idAtencion: string;
  version: number;
  decision: DecisionRecontacto;
  numeroCaso: string | null;
  estadoAtencion: EstadoAtencion;
}
