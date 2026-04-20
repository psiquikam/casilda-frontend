import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AtencionAphRequestDto {
  idCanalAph: number;
  fechaHora: string;
  idConvenioAph: number;
  idAmbitoAph: number;
  idProtocoloAph: number;
  practicoTriage: boolean;
  idResultadoTriage?: number | null;
  notaOMotivoTriage?: string | null;
  aceptaPsicologia: boolean;
  requiereRemision: boolean;
}

export interface RemisionRegistroAlmaRequestDto {
  idTipoRemision: number;
  cual?: string | null;
  fecha: string;
}

export interface RegistroLineaAlmaRequestDto {
  idPersona: number;
  idTipoReporte: number;
  idCanalContacto: number;
  quienRemite?: string | null;
  fechaHoraAtencion: string;
  idPersonaAtiende: number;
  idTipoServicio: number;
  idPersonaRegistra: number;
  idFormaEntrevista?: number | null;
  idIdentidadGenero: number;
  idOrientacionSexual?: number | null;
  idEtnia?: number | null;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
  idVinculoUdeA?: number | null;
  idSubVinculoUdeA?: number | null;
  idFacultad?: number | null;
  idPrograma?: number | null;
  idDependencia?: number | null;
  idCampus?: number | null;
  atencionAph?: AtencionAphRequestDto | null;
  remisiones?: RemisionRegistroAlmaRequestDto[];
}

export interface AtencionAphResponseDto {
  id: number;
  idRegistroLineaAlma: number;
  idCanalAph: number;
  canalAph: string;
  fechaHora: string;
  idConvenioAph: number;
  convenioAph: string;
  idAmbitoAph: number;
  ambitoAph: string;
  idProtocoloAph: number;
  protocoloAph: string;
  practicoTriage: boolean;
  idResultadoTriage?: number | null;
  resultadoTriage?: string | null;
  notaOMotivoTriage?: string | null;
  aceptaPsicologia: boolean;
  requiereRemision: boolean;
}

export interface RemisionRegistroAlmaResponseDto {
  idRegistroLineaAlma: number;
  idTipoRemision: number;
  tipoRemision: string;
  cual?: string | null;
  fecha: string;
}

export interface RegistroLineaAlmaResponseDto {
  id: number;
  idPersona: number;
  idTipoReporte: number;
  tipoReporte: string;
  idCanalContacto: number;
  canalContacto: string;
  quienRemite?: string | null;
  fechaHoraAtencion: string;
  idPersonaAtiende: number;
  idTipoServicio: number;
  tipoServicio: string;
  idPersonaRegistra: number;
  idFormaEntrevista?: number | null;
  formaEntrevista?: string | null;
  idIdentidadGenero: number;
  idOrientacionSexual?: number | null;
  idEtnia?: number | null;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
  idVinculoUdeA?: number | null;
  idSubVinculoUdeA?: number | null;
  idFacultad?: number | null;
  idPrograma?: number | null;
  idDependencia?: number | null;
  idCampus?: number | null;
  atencionAph?: AtencionAphResponseDto | null;
  remisiones?: RemisionRegistroAlmaResponseDto[];
  fechaCreacion: string;
  idUsuarioCreacion?: number | null;
  fechaActualizacion: string;
  idUsuarioActualizacion?: number | null;
}

export interface ContactoLineaAlmaRequestDto {
  fecha?: string;
  idResultado: number;
}

export interface ContactoLineaAlmaResponseDto {
  id: number;
  idRegistroLineaAlma: number;
  fecha: string;
  idResultado: number;
  resultado: string;
}

@Injectable({ providedIn: 'root' })
export class LineaAlmaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/linea-alma`;

  crearRegistro(request: RegistroLineaAlmaRequestDto): Observable<RegistroLineaAlmaResponseDto> {
    return this.http.post<RegistroLineaAlmaResponseDto>(`${this.apiUrl}/registros`, request);
  }

  obtenerRegistro(id: number): Observable<RegistroLineaAlmaResponseDto> {
    return this.http.get<RegistroLineaAlmaResponseDto>(`${this.apiUrl}/registros/${id}`);
  }

  listarRegistros(): Observable<RegistroLineaAlmaResponseDto[]> {
    return this.http.get<RegistroLineaAlmaResponseDto[]>(`${this.apiUrl}/registros`);
  }

  registrarContacto(idRegistro: number, request: ContactoLineaAlmaRequestDto): Observable<ContactoLineaAlmaResponseDto> {
    return this.http.post<ContactoLineaAlmaResponseDto>(`${this.apiUrl}/registros/${idRegistro}/contactos`, request);
  }

  listarContactos(idRegistro: number): Observable<ContactoLineaAlmaResponseDto[]> {
    return this.http.get<ContactoLineaAlmaResponseDto[]>(`${this.apiUrl}/registros/${idRegistro}/contactos`);
  }
}
