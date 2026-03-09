import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CorreoSolicitanteDto {
  tipoId: number;
  correo: string;
  descripcion?: string;
}

export interface TelefonoSolicitanteDto {
  tipoId: number;
  telefono: string;
  descripcion?: string;
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
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string | null;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  identidadGenero: string;
  celular: string;
  telefonoAlterno: string;
  correoInstitucional: string;
  correoPersonal: string;
  // Remitente
  nombreRemitente: string | null;
  remitenteTipoSolicitud: string;
  remitentePrimerNombre: string;
  remitenteSegundoNombre: string;
  remitentePrimerApellido: string;
  remitenteSegundoApellido: string;
  remitenteCargo: string;
  remitenteCampus: string;
  remitenteDependencia: string;
  remitenteFacultad: string;
  remitenteOtraFacultad: string;
  remitenteFechaSolicitud: string;
  remitenteTipoDocumento: string;
  remitenteNumeroDocumento: string;
}

export interface UpdateSolicitudDto {
  primerNombre?: string;
  segundoNombre?: string | null;
  primerApellido?: string;
  segundoApellido?: string | null;
  identidadGenero?: string | null;
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
  hora: string;
  jornada: string;
  resultado: string;
  observacion: string;
  citaCreada?: boolean;
  citaId?: number;
  fechaCita?: string;
}

export interface ContactoTelefonicoRequestDto {
  fecha: string;
  hora: string;
  resultado: string;
  observacion: string;
  fechaCita?: string;
  horaCita?: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/solicitudes`;

  crearAcompanamiento(request: SolicitudAcompanamientoRequest): Observable<SolicitudAcompanamientoResponse> {
    return this.http.post<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento`, request);
  }

  obtenerPorId(id: number): Observable<SolicitudAcompanamientoResponse> {
    return this.http.get<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento/${id}`);
  }

  obtenerPorCodigo(codigo: string): Observable<SolicitudAcompanamientoResponse> {
    return this.http.get<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento/codigo/${codigo}`);
  }

  listarTodas(): Observable<SolicitudAcompanamientoResponse[]> {
    return this.http.get<SolicitudAcompanamientoResponse[]>(`${this.apiUrl}/acompanamiento`);
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
}
