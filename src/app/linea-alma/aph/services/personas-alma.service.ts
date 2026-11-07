import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { ConsultaPersonaDto } from '../../shared/types/alma-dto';

/** Modelo de vista de la consulta previa (F2). Nunca contiene información clínica (RNF-ALMA-002). */
export interface ConsultaPersonaVista {
  readonly existe: boolean;
  readonly nombreCompleto: string | null;
  readonly nombres: string | null;
  readonly apellidos: string | null;
  readonly seguimientoActivo: { readonly proximoSeguimiento: string | null; readonly profesional: string | null } | null;
  readonly casoCerrado: { readonly numeroCaso: string; readonly fechaCierre: string } | null;
}

export function aVistaConsulta(dto: ConsultaPersonaDto): ConsultaPersonaVista {
  const nombres = dto.persona?.nombres?.trim() || null;
  const apellidos = dto.persona?.apellidos?.trim() || null;
  return {
    existe: dto.existe,
    nombres,
    apellidos,
    nombreCompleto: [nombres, apellidos].filter(Boolean).join(' ') || null,
    seguimientoActivo: dto.seguimientoActivo?.activo
      ? { proximoSeguimiento: dto.seguimientoActivo.proximoSeguimiento, profesional: dto.seguimientoActivo.profesional }
      : null,
    casoCerrado: dto.tieneCasoCerrado && dto.ultimoCasoCerrado ? dto.ultimoCasoCerrado : null
  };
}

/** H-1.1 — `GET /personas/consulta` (frontera F2). */
@Injectable({ providedIn: 'root' })
export class PersonasAlmaService {
  private readonly api = inject(AlmaApiClient);

  consultar(tipoIdentificacion: string, numeroIdentificacion: string): Observable<ConsultaPersonaVista> {
    return this.api
      .get<ConsultaPersonaDto>('/personas/consulta', { tipoIdentificacion, numeroIdentificacion })
      .pipe(map(aVistaConsulta));
  }
}
