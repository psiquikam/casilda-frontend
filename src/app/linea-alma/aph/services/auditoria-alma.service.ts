import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { AuditoriaEventoDto } from '../../shared/types/alma-dto';
import { ContextoAlma } from '../../shared/types/alma.types';

/** H-3.1 — `GET /auditoria` (historial inmutable, solo lectura, `RNF-ALMA-003`). */
@Injectable({ providedIn: 'root' })
export class AuditoriaAlmaService {
  private readonly api = inject(AlmaApiClient);

  listar(contexto: ContextoAlma): Observable<AuditoriaEventoDto[]> {
    return this.api.get<AuditoriaEventoDto[]>('/auditoria', { tipoContexto: contexto.tipo, idContexto: contexto.id });
  }
}
