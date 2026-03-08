import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CorreoSolicitanteDto {
  tipo: string;
  correo: string;
  descripcion?: string;
}

export interface TelefonoSolicitanteDto {
  tipo: string;
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
  tipoReporte: string;
  estado: string;
  fechaCreacion: string;
  nombreSolicitante: string;
  documentoSolicitante: string;
  correoSolicitante?: string;
  nombreRemitente?: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/solicitudes`;

  crearAcompanamiento(request: SolicitudAcompanamientoRequest): Observable<SolicitudAcompanamientoResponse> {
    return this.http.post<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento`, request);
  }

  obtenerPorCodigo(codigo: string): Observable<SolicitudAcompanamientoResponse> {
    return this.http.get<SolicitudAcompanamientoResponse>(`${this.apiUrl}/acompanamiento/codigo/${codigo}`);
  }

  listarTodas(): Observable<SolicitudAcompanamientoResponse[]> {
    return this.http.get<SolicitudAcompanamientoResponse[]>(`${this.apiUrl}/acompanamiento`);
  }
}
