import {
  CanalRecepcionSeguridad,
  DestinoRemisionSeguridad,
  EstadoGestionCamara,
  EstadoOrdenAcompanamiento,
  EstadoRegistroSeguridad,
  PrioridadAcompanamiento,
  RolPersonaReportada,
  TipoIncidenteAcompanamiento,
  TipoRegistroSeguridad,
  TipoRequerimientoUad
} from './spyb-catalogos';

export interface PersonaSeguridad {
  tipoIdentificacionId?: number;
  tipoIdentificacionNombre?: string;
  numeroDocumento: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nombreCompleto: string;
  telefono?: string;
  correo?: string;
  vinculoUdeAId?: number;
  vinculoUdeANombre?: string;
}

export interface ReportanteSeguridad {
  cedula: string;
  nombre: string;
  cargo?: string;
}

export interface ConsentimientoRutaVioleta {
  lecturaConsentimiento: boolean;
  autorizaActivacionRuta: boolean;
  funcionarioLectura?: string;
  fechaHora?: string;
}

export interface RegistroSeguridad {
  id: number;
  consecutivo: string; // Formato SPB-YYYY-XXXXX
  tipoRegistro: TipoRegistroSeguridad;
  tipoRegistroNombre?: string;
  canalRecepcion: CanalRecepcionSeguridad;
  canalRecepcionNombre?: string;
  estado: EstadoRegistroSeguridad;
  estadoNombre?: string;

  fechaReporte: string; // ISO 8601
  fechaHoraHechos?: string;

  campusId?: number;
  campusNombre?: string;
  lugarHechos: string;
  descripcionHechos: string;

  rolPersona: RolPersonaReportada;
  persona: PersonaSeguridad;
  reportante: ReportanteSeguridad;

  consentimientoRutaVioleta: ConsentimientoRutaVioleta;

  // Vinculación a caso CASILDA
  idCaso?: number;
  codigoCaso?: string;
  criterioVinculacion?: string;
  fechaVinculacion?: string;
  usuarioVinculacion?: string;

  // Subsanación
  solicitaSubsanacion?: boolean;
  motivoSubsanacion?: string;
  fechaSubsanacion?: string;

  // Auditoría
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
}

export interface OrdenAcompanamiento {
  id: number;
  codigoOrden: string; // ORD-SPB-YYYY-XXXXX
  idCaso?: number;
  codigoCaso?: string;
  idMedidaProteccion?: number;
  idRegistroOrigen?: number;

  esMedidaFormal: boolean;
  prioridad: PrioridadAcompanamiento;

  fechaProgramada: string;
  horaProgramada: string;
  lugarOrigen: string;
  lugarDestino: string;

  personaAcompanada: string;
  documentoAcompanada?: string;
  telefonoAcompanada?: string;

  condicionesOperativas?: string;
  observacionesOperativas?: string;

  tokenAcceso: string;
  estado: EstadoOrdenAcompanamiento;

  supervisorAsignado?: string;
  cedulaSupervisor?: string;

  fechaCreacion?: string;
  usuarioCreacion?: string;
}

export interface InformeAcompanamiento {
  id: number;
  idOrden?: number;
  codigoOrden?: string;
  idRegistroSeguridad: number;
  consecutivoSeguridad?: string;

  vigilanteResponsable: string;
  cedulaVigilante: string;

  lugarInicio: string;
  lugarDestino: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;

  // Agresor avistado
  identificoAgresor: boolean;
  lugarHoraAgresor?: string;
  descripcionAgresor?: string;

  // Incidentes
  ocurrioIncidente: boolean;
  tipoIncidente?: TipoIncidenteAcompanamiento;
  descripcionIncidente?: string;
  actuacionAdoptada?: string;

  // Cámaras
  camarasDisponibles: boolean;
  observacionesCamaras?: string;

  novedadesAdicionales?: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
}

export interface SolicitudEvidenciaCamara {
  id: number;
  codigoSolicitud: string; // EVD-SPB-YYYY-XXXXX
  idRegistroSeguridad?: number;
  consecutivoSeguridad?: string;
  idCaso?: number;
  codigoCaso?: string;

  ubicacionCamara: string;
  fechaHechos: string;
  horaInicioFranja: string;
  horaFinFranja: string;
  motivoSolicitud: string;

  estadoGestion: EstadoGestionCamara;
  estadoGestionNombre?: string;

  // Cadena de custodia (referencia, no video)
  referenciaArchivoInstitucional?: string;
  ubicacionRepositorioAutorizado?: string;
  observacionesCustodia?: string;

  // Entrega a autoridades
  entidadAutoridad?: string;
  oficioSolicitud?: string;
  fechaEntrega?: string;
  responsableEntrega?: string;
  constanciaEntrega?: string;

  fechaCreacion?: string;
  usuarioCreacion?: string;
}

export interface RemisionSeguridad {
  id: number;
  idRegistroSeguridad: number;
  consecutivoSeguridad: string;
  idCaso?: number;
  codigoCaso?: string;
  destino: DestinoRemisionSeguridad;
  destinoNombre?: string;

  motivo: string;
  fechaRemision: string;
  usuarioRemitente: string;
  estadoRemision: string;

  // UAD
  consecutivoRecibidoUad?: string;
  radicadoDisciplinarioUad?: string;
  estadoProcesoUad?: string;

  // Externas
  entidadExterna?: string;
  medioNotificacion?: string;
  numeroDenunciaExterna?: string;
  observacionesExternas?: string;
}

export interface RequerimientoUad {
  id: number;
  idRemision: number;
  tipoRequerimiento: TipoRequerimientoUad;
  tipoRequerimientoNombre?: string;

  personaRequerida: string;
  cedulaPersonaRequerida: string;
  fechaAudiencia?: string;

  estadoNotificacion: 'PENDIENTE' | 'NOTIFICADO' | 'FALLIDO';
  asistio?: boolean;
  observaciones?: string;

  fechaRegistro?: string;
  usuarioRegistro?: string;
}

export interface MedidaProteccionActiva {
  idMedida: number;
  idCaso: number;
  codigoCaso: string;
  tipoMedida: string;
  fechaRegistro: string;
  vigenciaFin?: string;
  condiciones: string;
  responsable?: string;
  estado?: string;
}

export interface ConsultaMedidaActivaResponse {
  tieneMedidaActiva: boolean;
  persona?: {
    numeroDocumento: string;
    nombreCompleto: string;
  };
  medidas: MedidaProteccionActiva[];
}

export interface ConteosBandejaAnalista {
  nuevos: number;
  enRevision: number;
  pendienteVinculacion: number;
  acompanamientos: number;
  camaras: number;
  remisiones: number;
  uad: number;
}

export interface IndicadoresSpyb {
  totalPersonasAtendidas: number;
  totalCasosVinculados: number;
  totalActuacionesSeguridad: number;
  actuacionesIndependientes: number;
  porTipoRegistro: Record<string, number>;
  porCanalRecepcion: Record<string, number>;
  porCampus: Record<string, number>;
  acompanamientosFormalesVsEspontaneos: {
    formales: number;
    espontaneos: number;
  };
  camarasCustodiadas: number;
  remisionesPorDestino: Record<string, number>;
}

