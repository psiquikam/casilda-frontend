import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { RecontactoDto, ResolucionRecontactoRequestDto, ResolucionRecontactoRespuestaDto } from '../../shared/types/alma-psicologia-dto';

/** J-1.7 — `/psicologia/recontactos` (frontera F2, RN-ALMA-06). */
@Injectable({ providedIn: 'root' })
export class RecontactosPsicologiaService {
  private readonly api = inject(AlmaApiClient);

  listar(): Observable<RecontactoDto[]> {
    return this.api.get<RecontactoDto[]>('/psicologia/recontactos');
  }

  /** La decisión es exclusiva de Psicología, pide confirmación y queda auditada en el servidor. */
  resolver(idAtencion: string, cuerpo: ResolucionRecontactoRequestDto): Observable<ResolucionRecontactoRespuestaDto> {
    return this.api.post<ResolucionRecontactoRespuestaDto>(`/psicologia/recontactos/${idAtencion}/resolucion`, cuerpo);
  }
}
