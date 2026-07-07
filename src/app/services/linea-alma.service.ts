import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CorreoBusquedaDto, TelefonoBusquedaDto } from './solicitud.service';
import { environment } from '../../environments/environment';

export interface AtencionAphRequestDto {
  fechaHora: string;
  idProtocoloAph: number;
  practicoTriage: boolean;
  idResultadoTriage?: number | null;
  motivoNoTriage?: string | null;
  notaAph?: string | null;
  aceptaPsicologia: boolean;
  requiereRemision: boolean;
}

export interface RemisionRegistroAlmaRequestDto {
  idTipoRemision: number;
  cual?: string | null;
  fecha: string;
}

export interface RegistroLineaAlmaRequestDto {
  id?: number | null;
  idPersona?: number | null;
  idTipoReporte?: number;
  idCanalContacto?: number;
  fechaNacimiento?: string | null;
  idQuienRemite?: number | null;
  fechaHoraAtencion?: string;
  idPersonaAtiende?: number;
  idTipoServicio?: number;
  idPersonaRegistra?: number;
  idLugarEntrevista?: number | null;
  idIdentidadGenero?: number | null;
  idSexo?: number | null;
  idOrientacionSexual?: number | null;
  idEtnia?: number | null;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
  idVinculoUdeA?: number | null;
  idSubVinculoUdeA?: number | null;
  idUnidadAcademica?: number | null;
  idPrograma?: number | null;
  idUnidadAdministrativa?: number | null;
  idCampus?: number | null;
  correos?: CorreoBusquedaDto[];
  telefonos?: TelefonoBusquedaDto[];
  discapacidades?: DiscapacidadRequestDto[];
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  numeroDocumento?: string | null;
  idTipoIdentificacion?: number | null;
  idCiudadNacimiento?: number | null;
  atencionAph?: AtencionAphRequestDto | null;
  remisiones?: RemisionRegistroAlmaRequestDto[];
  contactos?: ContactoLineaAlmaRequestDto[];
  observacionesCorreo?: string | null;
  observacionesTelefono?: string | null;
}

export interface AtencionAphResponseDto {
  id: number;
  idRegistroLineaAlma: number;
  fechaHora: string;
  idProtocoloAph: number;
  protocoloAph: string;
  practicoTriage: boolean;
  idResultadoTriage?: number | null;
  resultadoTriage?: string | null;
  motivoNoTriage?: string | null;
  notaAph?: string | null;
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
  idQuienRemite?: number | null;
  fechaHoraAtencion: string;
  idPersonaAtiende: number;
  idTipoServicio: number;
  tipoServicio: string;
  idPersonaRegistra: number;
  idLugarEntrevista?: number | null;
  lugarEntrevista?: string | null;
  idIdentidadGenero: number;
  idOrientacionSexual?: number | null;
  idEtnia?: number | null;
  idCiudadResidencia?: number | null;
  direccionResidencia?: string | null;
  idVinculoUdeA?: number | null;
  idSubVinculoUdeA?: number | null;
  idUnidadAcademica?: number | null;
  idPrograma?: number | null;
  idUnidadAdministrativa?: number | null;
  idCampus?: number | null;
  atencionAph?: AtencionAphResponseDto | null;
  remisiones?: RemisionRegistroAlmaResponseDto[];
  fechaCreacion: string;
  idUsuarioCreacion?: number | null;
  fechaActualizacion: string;
  idUsuarioActualizacion?: number | null;
  observacionesCorreo?: string | null;
  observacionesTelefono?: string | null;
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

  registrarPestana(tabIndex: number, request: RegistroLineaAlmaRequestDto): Observable<RegistroLineaAlmaResponseDto> {
    return this.http.post<RegistroLineaAlmaResponseDto>(`${this.apiUrl}/registros/pestana/${tabIndex}`, request);
  }
}

export interface DiscapacidadRequestDto {
  idSubTipoDiscapacidad: number;
  descripcion?: string | null;
}
