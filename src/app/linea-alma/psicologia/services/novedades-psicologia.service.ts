import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import {
  IntentoContactoCrearDto,
  IntentoContactoDto,
  NovedadPsicologiaDto,
  PrimerContactoRequestDto,
  PrimerContactoRespuestaDto
} from '../../shared/types/alma-psicologia-dto';
import { ResumenIntentos, resumenIntentos } from '../dominio/protocolo-intentos';

/** Novedad lista para la vista: el DTO más lo que las pantallas preguntan a cada rato. */
export type NovedadPsicologia = NovedadPsicologiaDto & {
  readonly nombreCompleto: string;
  /** Sigue en la cola: admite tomar, intentos y primer contacto. */
  readonly pendiente: boolean;
  readonly intentosResumen: ResumenIntentos;
  /** Cerrada por «No contacto» tras agotar el protocolo. */
  readonly cerradaPorNoContacto: boolean;
};

export function aNovedad(dto: NovedadPsicologiaDto): NovedadPsicologia {
  return {
    ...dto,
    nombreCompleto: [dto.persona.nombres, dto.persona.apellidos].filter(Boolean).join(' ') || 'Sin nombre registrado',
    pendiente: dto.estado === 'PENDIENTE_PSICOLOGIA',
    intentosResumen: resumenIntentos(dto.intentos),
    cerradaPorNoContacto: dto.estado === 'CERRADO' && dto.cierre?.motivo === 'NO_CONTACTO'
  };
}

/** J-1.2, J-1.3 y J-1.4 — `/psicologia/novedades/{idAtencion}` y acciones de la bandeja. */
@Injectable({ providedIn: 'root' })
export class NovedadesPsicologiaService {
  private readonly api = inject(AlmaApiClient);

  obtener(idAtencion: string): Observable<NovedadPsicologia> {
    return this.api.get<NovedadPsicologiaDto>(`/psicologia/novedades/${idAtencion}`).pipe(map(aNovedad));
  }

  /** `POST /bandeja/psicologia/{id}/tomar` con la `version` leída; 409 `NOVEDAD_YA_TOMADA` si otra profesional se adelantó. */
  tomar(idAtencion: string, version: number): Observable<NovedadPsicologia> {
    return this.api.post<NovedadPsicologiaDto>(`/bandeja/psicologia/${idAtencion}/tomar`, { version }).pipe(map(aNovedad));
  }

  liberar(idAtencion: string, version: number): Observable<NovedadPsicologia> {
    return this.api.post<NovedadPsicologiaDto>(`/bandeja/psicologia/${idAtencion}/liberar`, { version }).pipe(map(aNovedad));
  }

  listarIntentos(idAtencion: string): Observable<IntentoContactoDto[]> {
    return this.api.get<IntentoContactoDto[]>(`/psicologia/novedades/${idAtencion}/intentos`);
  }

  /** Registra un intento (1–9). Devuelve la novedad completa: con el 9.º el servidor la cierra por «No contacto». */
  registrarIntento(idAtencion: string, cuerpo: IntentoContactoCrearDto): Observable<NovedadPsicologia> {
    return this.api.post<NovedadPsicologiaDto>(`/psicologia/novedades/${idAtencion}/intentos`, cuerpo).pipe(map(aNovedad));
  }

  /** Primer contacto efectivo: consolida el caso y devuelve el `CAS-…` (RF-ALMA-PSI-003). */
  registrarPrimerContacto(idAtencion: string, cuerpo: PrimerContactoRequestDto): Observable<PrimerContactoRespuestaDto> {
    return this.api.post<PrimerContactoRespuestaDto>(`/psicologia/novedades/${idAtencion}/primer-contacto`, cuerpo);
  }
}
