import {
  CanalRecepcionSeguridad,
  DestinoRemisionSeguridad,
  EstadoGestionCamara,
  PrioridadAcompanamiento,
  RolPersonaReportada,
  TipoIncidenteAcompanamiento,
  TipoRegistroSeguridad,
  TipoRequerimientoUad
} from './spyb-catalogos';
import {
  ConsentimientoRutaVioleta,
  PersonaSeguridad,
  ReportanteSeguridad
} from './spyb.models';

export interface CrearRegistroSeguridadRequest {
  tipoRegistroCodigo: TipoRegistroSeguridad;
  canalRecepcionCodigo: CanalRecepcionSeguridad;
  fechaHoraHechos?: string;
  campusId?: number;
  lugarHechos: string;
  descripcionHechos: string;
  rolPersonaCodigo: RolPersonaReportada;
  persona: PersonaSeguridad;
  reportante: ReportanteSeguridad;
  consentimientoRutaVioleta: ConsentimientoRutaVioleta;
}

export interface RegistroSeguridadResponse {
  id: number;
  consecutivo: string;
  estado: string;
  fechaReporte: string;
  mensaje: string;
}

export interface VincularCasoRequest {
  idCaso: number;
  criterioJustificacion: string;
}

export interface SubsanarRegistroRequest {
  motivoSubsanacion: string;
}

export interface CrearOrdenAcompanamientoRequest {
  idCaso?: number;
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
}

export interface RegistrarInformeAcompanamientoRequest {
  idOrden?: number;
  idRegistroSeguridad?: number;
  vigilanteResponsable: string;
  cedulaVigilante: string;
  lugarInicio: string;
  lugardestino: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  identificoAgresor: boolean;
  lugarHoraAgresor?: string;
  descripcionAgresor?: string;
  ocurrioIncidente: boolean;
  tipoIncidente?: TipoIncidenteAcompanamiento;
  descripcionIncidente?: string;
  actuacionAdoptada?: string;
  camarasDisponibles: boolean;
  observacionesCamaras?: string;
  novedadesAdicionales?: string;
}

export interface SolicitarEvidenciaCamaraRequest {
  idRegistroSeguridad?: number;
  idCaso?: number;
  ubicacionCamara: string;
  fechaHechos: string;
  horaInicioFranja: string;
  horaFinFranja: string;
  motivoSolicitud: string;
}

export interface ActualizarCustodiaCamaraRequest {
  estadoGestion: EstadoGestionCamara;
  referenciaArchivoInstitucional?: string;
  ubicacionRepositorioAutorizado?: string;
  observacionesCustodia?: string;
}

export interface EntregaEvidenciaAutoridadRequest {
  entidadAutoridad: string;
  oficioSolicitud: string;
  responsableEntrega: string;
  constanciaEntrega: string;
}

export interface CrearRemisionSeguridadRequest {
  idRegistroSeguridad: number;
  idCaso?: number;
  destino: DestinoRemisionSeguridad;
  motivo: string;
  consecutivoRecibidoUad?: string;
  entidadExterna?: string;
  medioNotificacion?: string;
}

export interface RegistrarRequerimientoUadRequest {
  idRemision: number;
  tipoRequerimiento: TipoRequerimientoUad;
  personaRequerida: string;
  cedulaPersonaRequerida: string;
  fechaAudiencia?: string;
  observaciones?: string;
}

export interface SugerenciaCasoDto {
  idCaso: number;
  codigoCaso: string;
  fechaApertura: string;
  estado: string;
  lugarHechos?: string;
  presuntoAgresor?: string;
  motivo?: string;
}

