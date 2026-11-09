import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import {
  AtencionAphDto,
  AtencionAphGuardarDto,
  CierreAtencionRequestDto,
  ConsentimientoDto,
  DerivacionPsicologiaDto,
  TriajeRequestDto
} from '../../shared/types/alma-dto';
import { ESTADOS_EDITABLES_APH } from '../../shared/types/alma.types';

/** Atención lista para la vista: el DTO más lo que las pantallas preguntan a cada rato. */
export type AtencionAph = AtencionAphDto & { readonly editable: boolean };

export function aAtencion(dto: AtencionAphDto): AtencionAph {
  return { ...dto, editable: ESTADOS_EDITABLES_APH.includes(dto.estado) };
}

/** H-1.2 a H-1.4 y H-1.7 — `/atenciones-aph`. */
@Injectable({ providedIn: 'root' })
export class AtencionesAphService {
  private readonly api = inject(AlmaApiClient);

  /** `POST /atenciones-aph`: crea el borrador y genera el `ALMA-…` (Q4). */
  crear(cuerpo: AtencionAphGuardarDto): Observable<AtencionAph> {
    return this.api.post<AtencionAphDto>('/atenciones-aph', cuerpo).pipe(map(aAtencion));
  }

  obtener(idAtencion: string): Observable<AtencionAph> {
    return this.api.get<AtencionAphDto>(`/atenciones-aph/${idAtencion}`).pipe(map(aAtencion));
  }

  /** `PATCH`: actualización parcial; exige la `version` que se leyó (409 si cambió). */
  actualizar(idAtencion: string, cuerpo: AtencionAphGuardarDto & { version: number }): Observable<AtencionAph> {
    return this.api.patch<AtencionAphDto>(`/atenciones-aph/${idAtencion}`, cuerpo).pipe(map(aAtencion));
  }

  registrarTriaje(idAtencion: string, cuerpo: TriajeRequestDto): Observable<AtencionAph> {
    return this.api.put<AtencionAphDto>(`/atenciones-aph/${idAtencion}/triaje`, cuerpo).pipe(map(aAtencion));
  }

  /** F1 — deriva a Psicología. Sin consentimiento el servidor responde 422 `CONSENTIMIENTO_REQUERIDO`. */
  derivarAPsicologia(idAtencion: string, version: number, consentimiento: ConsentimientoDto): Observable<DerivacionPsicologiaDto> {
    return this.api.post<DerivacionPsicologiaDto>(`/atenciones-aph/${idAtencion}/derivaciones/psicologia`, {
      version,
      consentimiento
    });
  }

  cerrar(idAtencion: string, cuerpo: CierreAtencionRequestDto): Observable<AtencionAph> {
    return this.api.post<AtencionAphDto>(`/atenciones-aph/${idAtencion}/cierre`, cuerpo).pipe(map(aAtencion));
  }
}
