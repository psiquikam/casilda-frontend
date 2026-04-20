import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MaestroDto } from './listas.service';

export interface CorreoSolicitanteDto {
  tipoId: number;
  correo: string;
  descripcion: string;
}

export interface TelefonoSolicitanteDto {
  tipoId: number;
  telefono: string;
  descripcion: string;
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
  dependenciaId?: number | null;
  facultadId?: number | null;
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
  dependenciaId?: number | null;
  facultadId?: number | null;
}

export interface SolicitudAcompanamientoRequest {
  tipoSolicitudId: number;
  datosSolicitante: DatosSolicitanteRequest;
  datosRemitente?: DatosRemitenteRequest | null;
}

export interface SolicitudAcompanamientoResponse {
  id: number;
  codigo: string;
  tipoSolicitud: string;
  estado: string;
  fechaCreacion: string;
  // Para la tabla
  dependencia: string;
  profesional: string;
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
  remitenteDependenciaId?: number | null;
  remitenteDependencia: string;
  remitenteFacultadId?: number | null;
  remitenteFacultad: string;
  remitenteOtraFacultad: string;
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
    descripcion: string;
  }>;
  telefonos?: Array<{
    tipoId?: number | null;
    tipo?: string | null;
    telefono: string;
    descripcion: string;
  }>;
  remitentePrimerNombre?: string | null;
  remitenteSegundoNombre?: string | null;
  remitentePrimerApellido?: string | null;
  remitenteSegundoApellido?: string | null;
  remitenteCargoId?: number | null;
  remitenteCampusId?: number | null;
  remitenteDependenciaId?: number | null;
  remitenteFacultadId?: number | null;
  remitenteTipoDocumentoId?: number | null;
  remitenteNumeroDocumento?: string | null;
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
  dependencia: string;
  facultad?: string;
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
  idDependencia: number;
  idCampus: number;
  idFacultad: number;
  idVinculoUniversidad: number;
  idSubVinculoUniversidad?: number | null;
  idPrograma: number;
  idEtnia?: number | null;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
}

export interface AtencionRegistroRequestDto {
  citaId: number;
  idTipoServicio: number;
  idMunicipioEntrevista: number;
  idRegimen: number;
  idEps: number;
  logroAcuerdo?: boolean;
  archivoConsentimientoNombre?: string;
  archivoConsentimientoTipo?: string;
  archivoConsentimientoContenido?: string;
}

export interface CompromisosAtencionRequestDto {
  persona?: CompromisoPersonaRequestDto[];
  profesional?: CompromisoProfesionalRequestDto[];
}

export interface CasoAtencionRequestDto {
  idOrientacionSexual: number;
  idIdentidadGenero: number;
  tiempoOcurrido: string;
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
  atencion: AtencionRegistroRequestDto;
  atencionContexto: AtencionContextoRequestDto;
  persona: PersonaAtencionRequestDto;
  caso: CasoAtencionRequestDto;
  seguimientos?: SeguimientoAtencionRequestDto[];
  hechos?: HechoRequestDto[];
  compromisos?: CompromisosAtencionRequestDto;
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

  crearCompromisoPersona(datos: CompromisoPersonaRequestDto): Observable<unknown> {
    return this.http.post(`${this.compromisosUrl}/persona`, datos);
  }

  crearCompromisoProfesional(datos: CompromisoProfesionalRequestDto): Observable<unknown> {
    return this.http.post(`${this.compromisosUrl}/profesional`, datos);
  }

  registrarAtencionCompleta(datos: RegistroAtencionCompleteRequestDto): Observable<AtencionResponseDto> {
    return this.http.post<AtencionResponseDto>(this.atencionesUrl, datos);
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
