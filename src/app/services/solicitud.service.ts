import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MaestroDto } from './listas.service';

export interface CorreoSolicitanteDto {
  tipoId: number;
  correo: string;
}

export interface TelefonoSolicitanteDto {
  tipoId: number;
  telefono: string;
}

export interface DatosSolicitanteRequest {
  primerNombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  tipoDocumentoId: number;
  numeroDocumento: string;
  fechaNacimiento: string; // formato yyyy-MM-dd
  identidadGeneroId: number;
  campusId?: number | null;
  unidadAdministrativaId?: number | null;
  unidadAcademicaId?: number | null;
  correos?: CorreoSolicitanteDto[];
  telefonos?: TelefonoSolicitanteDto[];
}

export interface DatosRemitenteRequest {
  primerNombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  tipoDocumentoId?: number | null;
  numeroDocumento?: string | null;
  cargoId: number;
  campusId?: number | null;
  unidadAdministrativaId?: number | null;
  unidadAcademicaId?: number | null;
}

export interface SolicitudAcompanamientoRequest {
  tipoSolicitudId: number;
  medioSolicitudId: number;
  observacionesTelefono?: string | null;
  observacionesCorreo?: string | null;
  datosSolicitante: DatosSolicitanteRequest;
  datosRemitente?: DatosRemitenteRequest | null;
}

export interface SolicitudAcompanamientoResponse {
  id: number;
  codigo: string;
  tipoSolicitud: string;
  estado: string;
  fechaCreacion: string;
  observacionesTelefono?: string | null;
  observacionesCorreo?: string | null;
  // Para la tabla
  unidadAdministrativa: string;
  profesional: string;
  tipoAsignacion: string;
  // Solicitante resumen
  nombreSolicitante: string;
  documentoSolicitante: string;
  // Solicitante completo
  tipoDocumentoId?: number | null;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string | null;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  identidadGeneroId?: number | null;
  identidadGenero: string;
  idDepartamentoResidencia?: number | null;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
  celular: string;
  telefonoAlterno: string;
  correoInstitucional: string;
  correoPersonal: string;
  correos?: CorreoBusquedaDto[];
  telefonos?: TelefonoBusquedaDto[];
  // Remitente
  nombreRemitente: string | null;
  remitenteTipoSolicitud: string;
  remitentePrimerNombre: string;
  remitenteSegundoNombre: string;
  remitentePrimerApellido: string;
  remitenteSegundoApellido: string;
  remitenteCargoId?: number | null;
  remitenteCargo: string;
  remitenteCampusId?: number | null;
  remitenteCampus: string;
  remitenteUnidadAdministrativaId?: number | null;
  remitenteUnidadAdministrativa: string;
  remitenteUnidadAcademicaId?: number | null;
  remitenteUnidadAcademica: string;
  remitenteOtraUnidadAcademica: string;
  remitenteFechaSolicitud: string;
  remitenteTipoDocumentoId?: number | null;
  remitenteTipoDocumento: string;
  remitenteNumeroDocumento: string;
}

export interface PersonaSearchDto {
  id?: number | null;
  primerNombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  tipoDocumentoId?: number | null;
  numeroDocumento?: string | null;
  fechaNacimiento?: string | null;
  correos?: CorreoBusquedaDto[];
  telefonos?: TelefonoBusquedaDto[];
  sexoId?: number | null;
  ciudadNacimientoId?: number | null;
  departamentoNacimientoId?: number | null;
  discapacidades?: DiscapacidadSearchDto[];
}

export interface DiscapacidadSearchDto {
  idSubTipoDiscapacidad: number;
  subTipo?: string | null;
  tipo?: string | null;
  descripcion: string;
}

export interface CorreoBusquedaDto {
  tipoId: number;
  tipo?: string | null;
  correo: string;
  descripcion?: string | null;
}

export interface TelefonoBusquedaDto {
  tipoId: number;
  tipo?: string | null;
  telefono: string;
  descripcion?: string | null;
}

export interface PagedResponseDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UpdateSolicitudDto {
  primerNombre?: string;
  segundoNombre?: string | null;
  primerApellido?: string;
  segundoApellido?: string | null;
  tipoDocumentoId?: number | null;
  numeroDocumento?: string | null;
  fechaNacimiento?: string | null;
  identidadGeneroId?: number | null;
  correos?: Array<{
    tipoId?: number | null;
    tipo?: string | null;
    correo: string;
  }>;
  telefonos?: Array<{
    tipoId?: number | null;
    tipo?: string | null;
    telefono: string;
  }>;
  remitentePrimerNombre?: string | null;
  remitenteSegundoNombre?: string | null;
  remitentePrimerApellido?: string | null;
  remitenteSegundoApellido?: string | null;
  remitenteCargoId?: number | null;
  remitenteCampusId?: number | null;
  remitenteUnidadAdministrativaId?: number | null;
  remitenteUnidadAcademicaId?: number | null;
  remitenteTipoDocumentoId?: number | null;
  remitenteNumeroDocumento?: string | null;
  observacionesTelefono?: string | null;
  observacionesCorreo?: string | null;
  medioSolicitudId?: number | null;
}

export interface AsignarSolicitudDto {
  grupoProfesionalId: number;
  idTipoAsignacion: number;
  idTipoServicio: number;
  observaciones: string;
  fechaReparto?: string;
}

export interface GrupoProfesionalDto {
  id: number;
  nombre: string;
}

export interface ContactoTelefonicoDto {
  fecha: string;
  hora?: string;
  jornada: string;
  resultado: string;
  observacion: string;
  citaCreada?: boolean;
  citaId?: number;
  fechaCita?: string;
}

export interface ContactoTelefonicoRequestDto {
  fecha: string;
  resultado: string;
  observacion: string;
  fechaCita?: string;
  horaCita?: string;
}

export enum EstadoCitaEnum {
  CREADA = 1,
  CANCELADA = 2,
  REPROGRAMADA = 3
}

export enum VinculoUdeAEnum {
  ESTUDIANTE_PREGRADO = 1,
  PERSONAL_ADMINISTRATIVO = 2,
  DOCENTE_VINCULADO = 3,
  EGRESADO = 4,
  DOCENTE_OCASIONAL = 5,
  DOCENTE_DE_CATEDRA = 6,
  CONTRATISTA = 7,
  OTRO_TIPO_DE_VINCULO = 8,
  ESTUDIANTE_DE_POSGRADO = 9,
  DOCENTE_CATEDRA_50 = 10,
  JUBILADO_PENSIONADO = 11,
  PRESTADOR_DE_SERVICIOS = 12,
  EXTERNO = 13
}

export interface CitaDto {
  id: number;
  solicitudId: number;
  codigoSolicitud: string;
  nombreSolicitante: string;
  tipoDocumento?: string | null;
  documento: string;
  fechaCita: string;
  idEstadoCita: number;
  estadoCita: string;
  motivoEstadoCita?: string;
  observaciones?: string;
  tipoSolicitud: string;
  unidadAdministrativa: string;
  profesional: string;
  unidadAcademica?: string;
  campus?: string;
  identidadGenero?: string;
  celular?: string;
  telefonoAlterno?: string;
  correoInstitucional?: string;
  correoPersonal?: string;
}

export interface AtencionResponseDto {
  id: number;
  fecha: string;
  citaId: number;
  tipoServicioId: number;
  tipoServicio: string;
  lugarEntrevistaId: number;
  lugarEntrevista: string;
  regimenId: number;
  regimen: string;
  epsId: number;
  eps: string;
  logroAcuerdo: boolean;
}

export interface ReprogramarCitaRequestDto {
  fechaCita: string;
  horaCita: string;
  idMotivoEstadoCita?: number;
  observaciones?: string;
}

export interface CancelarCitaRequestDto {
  idMotivoEstadoCita: number;
  observaciones?: string;
}

export interface CompromisoPersonaRequestDto {
  idatencion: number;
  fechacompromiso: string;
  idtipocompromiso: number;
}

export interface CompromisoProfesionalRequestDto {
  idatencion: number;
  fechacompromiso: string;
  idgrupoprofesional: number;
  idtipocompromiso: number;
}

export interface SeguimientoAtencionRequestDto {
  idAtencion: number;
  idTipoSeguimiento: number;
  fecha: string; // formato ISO 8601 yyyy-MM-ddTHH:mm:ss
  idAccion: number;
  idActividad: number;
  descripcion: string;
  idEstadoSeguimiento: number;
  idMotivoEstadoSeguimiento: number;
  archivoNombre?: string; // Nombre del archivo
  archivoTipo?: string; // MIME type (ej: application/pdf)
  archivoContenido?: string; // Base64 encoded file content
}

export interface HechoRequestDto {
  fecha?: string | null;
  lugar: string;
  descripcion: string;
}

export interface AgresorVictimaRequestDto {
  primerNombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  idVinculoUniversidad: number;
  idVinculoVictima: number;
}

export interface PersonaAtencionRequestDto {
  idSexo: number;
  idEtnia: number;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
  correos?: CorreoSolicitanteDto[];
  telefonos?: TelefonoSolicitanteDto[];
}

export interface AtencionContextoRequestDto {
  idUnidadAdministrativa: number;
  idCampus: number;
  idUnidadAcademica: number;
  idVinculoUniversidad: number;
  otroVinculo?: string | null;
  idPrograma: number;
  idEtnia?: number | null;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
}

export interface AtencionRegistroRequestDto {
  citaId: number;
  idAtencion?: number | null;
  idTipoServicio: number;
  idMunicipioEntrevista?: number | null;
  idLugarEntrevista: number;
  idRegimen: number;
  idEps: number;
  logroAcuerdo?: boolean;
  archivoConsentimientoNombre?: string;
  archivoConsentimientoTipo?: string;
  archivoConsentimientoContenido?: string;
  observacionesTelefono?: string | null;
  observacionesCorreo?: string | null;
  idEstadoAtencion?: number;
}

export interface CompromisosAtencionRequestDto {
  persona?: CompromisoPersonaRequestDto[];
  profesional?: CompromisoProfesionalRequestDto[];
}

export interface CasoAtencionRequestDto {
  idOrientacionSexual: number;
  idIdentidadGenero: number;
  tiempoOcurridoValor: number;
  idTiempoOcurridoUnidad: number;
  idFormaOcurrencia: number;
  idLugarOcurrencia: number;
  violenciaGenero: boolean;
  violenciaMisional: boolean;
  idActividadMisional?: number | null;
  idPrograma?: number | null;
  tipoViolenciaPsicologica?: boolean;
  tipoViolenciaFisica?: boolean;
  tipoViolenciaSexual?: boolean;
  tipoViolenciaInstitucional?: boolean;
  tipoViolenciaEconomicaPatrimonial?: boolean;
  tipoViolenciaSexualInformatica?: boolean;
  tipoViolenciaPorPrejuicio?: boolean;
  modalidadesViolenciaPsicologica?: number[];
  modalidadesViolenciaFisica?: number[];
  modalidadesViolenciaSexual?: number[];
  modalidadesViolenciaInstitucional?: number[];
  modalidadesViolenciaEconomica?: number[];
  modalidadesViolenciaInformatica?: number[];
  modalidadesViolenciaPrejuicio?: number[];
  agresorVictima: AgresorVictimaRequestDto;
}

export interface RegistroAtencionCompleteRequestDto {
  atencion?: AtencionRegistroRequestDto;
  atencionContexto?: AtencionContextoRequestDto;
  persona?: PersonaAtencionRequestDto;
  caso?: CasoAtencionRequestDto;
  seguimientos?: SeguimientoAtencionRequestDto[];
  hechos?: HechoRequestDto[];
  compromisos?: CompromisosAtencionRequestDto;
  otrosCasos?: RegistroOtroCasoRequestDto[];
  otrosCasosActualizar?: ActualizarOtroCasoRequestDto[];
  otrosCasosEliminar?: number[];
}

export interface Pestana1RequestDto {
  citaId: number;
  idAtencion?: number | null;
  persona: PersonaAtencionRequestDto;
  idRegimen?: number;
  idEps?: number;
}

export interface Pestana2RequestDto {
  citaId: number;
  idAtencion?: number | null;
  atencionContexto: AtencionContextoRequestDto;
  observacionesTelefono?: string | null;
  observacionesCorreo?: string | null;
}

export interface Pestana3RequestDto {
  citaId: number;
  idAtencion?: number | null;
  caso: CasoAtencionRequestDto;
  hechos?: HechoRequestDto[];
}

export interface Pestana4RequestDto {
  citaId: number;
  idAtencion?: number | null;
  caso: CasoAtencionRequestDto;
}

export interface Pestana5RequestDto {
  citaId: number;
  idAtencion?: number | null;
  agresorVictima: AgresorVictimaRequestDto;
}

export interface Pestana6RequestDto {
  citaId: number;
  idAtencion?: number | null;
}

export interface Pestana7RequestDto {
  citaId: number;
  idAtencion?: number | null;
  logroAcuerdo: boolean;
}

export interface Pestana8RequestDto {
  citaId: number;
  idAtencion?: number | null;
  otrosCasos?: RegistroOtroCasoRequestDto[];
  otrosCasosActualizar?: ActualizarOtroCasoRequestDto[];
  otrosCasosEliminar?: number[];
}

export interface MedidaProteccionRequestDto {
  tipoMedidaId: number;
  subtipoMedidaId: number;
  responsableId: number;
  fechaRegistro: string;
  descripcion: string;
}

export interface Pestana9RequestDto {
  citaId: number;
  idAtencion?: number | null;
  medidas?: MedidaProteccionRequestDto[];
}

export interface Pestana10RequestDto {
  citaId: number;
  idAtencion?: number | null;
  compromisos: CompromisosAtencionRequestDto;
}

export interface Pestana11RequestDto {
  citaId: number;
  idAtencion?: number | null;
  seguimientos: SeguimientoAtencionRequestDto[];
}

export interface Pestana12RequestDto {
  citaId: number;
  idAtencion?: number | null;
  idEstadoAtencion: number;
}

export interface RegistroOtroCasoRequestDto {
  caso: CasoAtencionRequestDto;
  hechos?: HechoRequestDto[];
}

export interface ActualizarOtroCasoRequestDto {
  idCaso: number;
  caso: CasoAtencionRequestDto;
  hechos?: HechoRequestDto[];
}

export interface OtroCasoDto {
  idCaso: number;
  id: string;
  tiempoHechos: string;
  tiempoOcurridoValor?: number;
  idTiempoOcurridoUnidad?: number;
  tipoViolencia: string;
  subcategoriaViolencia: string;
  descripcion: string;

  idOrientacionSexual?: number | null;
  idIdentidadGenero?: number | null;
  idFormaOcurrencia?: number | null;
  idLugarOcurrencia?: number | null;
  violenciaGenero?: boolean | null;
  violenciaMisional?: boolean | null;
  idActividadMisional?: number | null;

  modalidadesViolenciaPsicologica?: number[];
  modalidadesViolenciaFisica?: number[];
  modalidadesViolenciaSexual?: number[];
  modalidadesViolenciaInstitucional?: number[];
  modalidadesViolenciaEconomica?: number[];
  modalidadesViolenciaInformatica?: number[];
  modalidadesViolenciaPrejuicio?: number[];

  presuntoPrimerNombre?: string | null;
  presuntoSegundoNombre?: string | null;
  presuntoPrimerApellido?: string | null;
  presuntoSegundoApellido?: string | null;
  idVinculoUniversidad?: number | null;
  idVinculoVictima?: number | null;
  hechos?: HechoRequestDto[];
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/solicitudes`;
  private readonly citasUrl = `${environment.apiBaseUrl}/citas`;
  private readonly atencionesUrl = `${environment.apiBaseUrl}/atenciones`;
  private readonly compromisosUrl = `${environment.apiBaseUrl}/compromisos`;

  buscarPersonaPorDocumento(tipoDocumentoId: number, documento: string): Observable<PersonaSearchDto> {
    const params = new HttpParams()
      .set('tipoDocumentoId', String(tipoDocumentoId))
      .set('numeroDocumento', documento);

    return this.http.get<PersonaSearchDto>(`${environment.apiBaseUrl}/personas/documento/${documento}`, { params });
  }

  crearAcompanamiento(request: SolicitudAcompanamientoRequest): Observable<SolicitudAcompanamientoResponse> {
    return this.http.post<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento`, request);
  }

  obtenerPorId(id: number): Observable<SolicitudAcompanamientoResponse> {
    return this.http.get<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento/${id}`);
  }

  listarTodas(idEstadoSolicitud?: number): Observable<SolicitudAcompanamientoResponse[]> {
    let params = new HttpParams();
    if (idEstadoSolicitud != null) {
      params = params.set('idEstadoSolicitud', String(idEstadoSolicitud));
    }
    return this.http.get<SolicitudAcompanamientoResponse[]>(`${this.apiUrl}/acompanamiento`, { params });
  }

  listarPaginadas(page: number, size: number, idEstadoSolicitud?: number): Observable<PagedResponseDto<SolicitudAcompanamientoResponse>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (idEstadoSolicitud != null) {
      params = params.set('idEstadoSolicitud', String(idEstadoSolicitud));
    }
    return this.http.get<PagedResponseDto<SolicitudAcompanamientoResponse>>(`${this.apiUrl}/acompanamiento/paginado`, { params });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/acompanamiento/${id}`);
  }

  actualizar(id: number, datos: UpdateSolicitudDto): Observable<SolicitudAcompanamientoResponse> {
    return this.http.put<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento/${id}`, datos);
  }

  asignar(id: number, datos: AsignarSolicitudDto): Observable<SolicitudAcompanamientoResponse> {
    return this.http.post<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento/${id}/asignar`, datos);
  }

  listarGruposProfesionales(): Observable<GrupoProfesionalDto[]> {
    return this.http.get<GrupoProfesionalDto[]>(`${this.apiUrl}/grupos-profesionales`);
  }

  listarContactos(id: number): Observable<ContactoTelefonicoDto[]> {
    return this.http.get<ContactoTelefonicoDto[]>(`${this.apiUrl}/acompanamiento/${id}/contactos`);
  }

  registrarContacto(id: number, datos: ContactoTelefonicoRequestDto): Observable<ContactoTelefonicoDto> {
    return this.http.post<ContactoTelefonicoDto>(`${this.apiUrl}/acompanamiento/${id}/contacto`, datos);
  }

  listarCitas(): Observable<CitaDto[]> {
    return this.http.get<CitaDto[]>(this.citasUrl);
  }

  listarCitasPaginadas(page: number, size: number, idEstadoCita?: number, excluirEstadoCitaId?: number): Observable<PagedResponseDto<CitaDto>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (idEstadoCita != null) {
      params = params.set('idEstadoCita', String(idEstadoCita));
    }
    if (excluirEstadoCitaId != null) {
      params = params.set('excluirEstadoCitaId', String(excluirEstadoCitaId));
    }

    return this.http.get<PagedResponseDto<CitaDto>>(`${this.citasUrl}/paginado`, { params });
  }

  reprogramarCita(id: number, datos: ReprogramarCitaRequestDto): Observable<CitaDto> {
    return this.http.put<CitaDto>(`${this.citasUrl}/${id}/reprogramar`, datos);
  }

  cancelarCita(id: number, datos: CancelarCitaRequestDto): Observable<CitaDto> {
    return this.http.put<CitaDto>(`${this.citasUrl}/${id}/cancelar`, datos);
  }

  listarMotivosEstadoCita(): Observable<MaestroDto[]> {
    return this.http.get<MaestroDto[]>(`${environment.apiBaseUrl}/maestros/motivos-estado-cita`);
  }

  listarTiposMedida(): Observable<MaestroDto[]> {
    return this.http.get<MaestroDto[]>(`${environment.apiBaseUrl}/maestros/tipos-medida`);
  }

  listarSubTiposMedida(): Observable<MaestroDto[]> {
    return this.http.get<MaestroDto[]>(`${environment.apiBaseUrl}/maestros/subtipos-medida`);
  }

  listarSubTiposMedidaPorTipo(tipoId: number): Observable<MaestroDto[]> {
    return this.http.get<MaestroDto[]>(`${environment.apiBaseUrl}/maestros/subtipos-medida/${tipoId}`);
  }

  listarResponsablesMedida(): Observable<MaestroDto[]> {
    return this.http.get<MaestroDto[]>(`${environment.apiBaseUrl}/maestros/responsables-medida`);
  }

  crearCompromisoPersona(datos: CompromisoPersonaRequestDto): Observable<unknown> {
    return this.http.post(`${this.compromisosUrl}/persona`, datos);
  }

  crearCompromisoProfesional(datos: CompromisoProfesionalRequestDto): Observable<unknown> {
    return this.http.post(`${this.compromisosUrl}/profesional`, datos);
  }

  registrarAtencionCompleta(datos: RegistroAtencionCompleteRequestDto): Observable<AtencionResponseDto> {
    return this.http.post<AtencionResponseDto>(this.atencionesUrl, datos);
  }

  registrarPestana(tabIndex: number, datos: any): Observable<AtencionResponseDto> {
    return this.http.post<AtencionResponseDto>(`${this.atencionesUrl}/pestana/${tabIndex}`, datos);
  }

  obtenerAtencionPorCita(citaId: number): Observable<AtencionResponseDto> {
    return this.http.get<AtencionResponseDto>(`${this.atencionesUrl}/cita/${citaId}`);
  }

  listarOtrosCasos(solicitudId: number): Observable<OtroCasoDto[]> {
    return this.http.get<OtroCasoDto[]>(`${this.atencionesUrl}/solicitudes/${solicitudId}/otros-casos`);
  }

  crearOtroCaso(solicitudId: number, datos: RegistroOtroCasoRequestDto): Observable<OtroCasoDto> {
    return this.http.post<OtroCasoDto>(`${this.atencionesUrl}/solicitudes/${solicitudId}/otros-casos`, datos);
  }

  actualizarOtroCaso(idCaso: number, datos: RegistroOtroCasoRequestDto): Observable<OtroCasoDto> {
    return this.http.put<OtroCasoDto>(`${this.atencionesUrl}/otros-casos/${idCaso}`, datos);
  }

  eliminarOtroCaso(idCaso: number): Observable<void> {
    return this.http.delete<void>(`${this.atencionesUrl}/otros-casos/${idCaso}`);
  }

  crearSeguimiento(datos: SeguimientoAtencionRequestDto): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/seguimientos`, datos);
  }

  /**
   * Convierte un archivo (File) a base64 string
   * @param file El archivo a convertir
   * @returns Promise que resuelve con el contenido en base64
   */
  convertirArchivoABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        resolve(base64);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  }
}
