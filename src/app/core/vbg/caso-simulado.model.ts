import type { CasoDto, CitaDto, PagedResponseDto, SolicitudAcompanamientoResponse } from '../../services/solicitud.service';

/**
 * Modelo de un caso simulado en memoria.
 *
 * Es el único almacén del modo de demostración (M1 del plan de
 * estandarización VBG): lo que se registra en los formularios durante la
 * sesión se guarda aquí, y de aquí se alimentan también los widgets del
 * panel que dependen de casos concretos y `MiProcesoService` de la vista del
 * rol Usuario, para que el mismo caso se vea igual en todas las pantallas.
 *
 * **No persiste entre sesiones** (no usa `localStorage` ni `sessionStorage`,
 * por instrucción explícita): es un `Injectable({ providedIn: 'root' })`, así
 * que vive mientras dura la pestaña del navegador.
 *
 * Ningún dato es real: nombres, documentos y teléfonos son evidentemente de
 * demostración.
 */
export interface CasoSimuladoVbg {
  readonly id: number;
  readonly codigo: string;
  readonly solicitudId: number;
  readonly citaId: number;

  /** `idEstadoCita` de la matriz de `EstadoCitaEnum` (1 = Creada, no cancelada). */
  readonly idEstadoCita: number;
  readonly estadoCita: string;
  readonly estadoCaso: string;
  /** ISO 8601. */
  readonly fechaCita: string;
  readonly fechaCaso: string;

  readonly tipoSolicitud: string;
  readonly unidadAdministrativa: string;
  readonly unidadAcademica: string;
  readonly campus: string;
  /** Nombre de la cuenta profesional a la que se asignó, para la tabla. */
  readonly profesional: string;
  readonly tipoAsignacion: string;

  readonly solicitud: SolicitudAcompanamientoResponse;

  /**
   * VBG-09-01, solo lectura. `null` = «Sin calcular» (el cálculo está
   * bloqueado por el pendiente 17 de la matriz: no se implementa).
   */
  grupoAtencion: string | null;

  /** VBG-00-01, estado del consentimiento (pendiente 18, decisión provisional). */
  consentimiento: {
    estado: 'pendiente' | 'cargado';
    nombreArchivo?: string;
  };

  /**
   * Payload crudo que cada pestaña del formulario envía al guardar. M1 solo
   * lo persiste sin interpretarlo; M2 a M5 añaden métodos propios con
   * semántica de negocio (compromisos, seguimientos, cierre) que lo
   * sustituyen progresivamente para cada sección.
   */
  readonly pestanas: Record<number, unknown>;
}

/** Construye una página `PagedResponseDto` a partir de un arreglo en memoria. */
export function paginar<T>(items: readonly T[], page: number, size: number): PagedResponseDto<T> {
  const inicio = page * size;
  const content = items.slice(inicio, inicio + size);
  return {
    content,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
    size,
    number: page
  };
}

export function aCitaDto(caso: CasoSimuladoVbg): CitaDto {
  const s = caso.solicitud;
  return {
    id: caso.citaId,
    solicitudId: caso.solicitudId,
    codigoSolicitud: caso.codigo,
    nombreSolicitante: s.nombreSolicitante,
    tipoDocumento: s.tipoDocumento,
    documento: s.documentoSolicitante,
    fechaCita: caso.fechaCita,
    idEstadoCita: caso.idEstadoCita,
    estadoCita: caso.estadoCita,
    tipoSolicitud: caso.tipoSolicitud,
    unidadAdministrativa: caso.unidadAdministrativa,
    profesional: caso.profesional,
    unidadAcademica: caso.unidadAcademica,
    campus: caso.campus,
    identidadGenero: s.identidadGenero,
    celular: s.celular,
    telefonoAlterno: s.telefonoAlterno,
    correoInstitucional: s.correoInstitucional,
    correoPersonal: s.correoPersonal,
    grupoAtencion: caso.grupoAtencion
  };
}

export function aCasoDto(caso: CasoSimuladoVbg): CasoDto {
  const s = caso.solicitud;
  return {
    id: caso.id,
    codigo: caso.codigo,
    solicitudId: caso.solicitudId,
    citaId: caso.citaId,
    nombreSolicitante: s.nombreSolicitante,
    tipoDocumento: s.tipoDocumento,
    documento: s.documentoSolicitante,
    fechaCaso: caso.fechaCaso,
    estadoCaso: caso.estadoCaso,
    tipoSolicitud: caso.tipoSolicitud,
    unidadAdministrativa: caso.unidadAdministrativa,
    profesional: caso.profesional,
    tipoAsignacion: caso.tipoAsignacion,
    unidadAcademica: caso.unidadAcademica,
    campus: caso.campus,
    identidadGenero: s.identidadGenero,
    celular: s.celular,
    telefonoAlterno: s.telefonoAlterno,
    correoInstitucional: s.correoInstitucional,
    correoPersonal: s.correoPersonal,
    primerNombre: s.primerNombre,
    segundoNombre: s.segundoNombre,
    primerApellido: s.primerApellido,
    segundoApellido: s.segundoApellido,
    fechaNacimiento: s.fechaNacimiento ?? undefined,
    grupoAtencion: caso.grupoAtencion
  };
}
