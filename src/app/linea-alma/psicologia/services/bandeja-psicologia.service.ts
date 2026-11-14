import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { PaginaAlma } from '../../shared/types/alma-dto';
import { BandejaPsicologiaItemDto, FiltroBandejaPsicologia } from '../../shared/types/alma-psicologia-dto';

/** J-1.1 — `GET /bandeja/psicologia` (cola compartida con SLA; consume F1 y F3). */
@Injectable({ providedIn: 'root' })
export class BandejaPsicologiaService {
  private readonly api = inject(AlmaApiClient);

  listar(filtro: FiltroBandejaPsicologia): Observable<PaginaAlma<BandejaPsicologiaItemDto>> {
    return this.api.get<PaginaAlma<BandejaPsicologiaItemDto>>('/bandeja/psicologia', {
      triaje: filtro.triaje,
      semaforo: filtro.semaforo,
      estado: filtro.estado,
      documento: filtro.documento?.trim(),
      page: filtro.page,
      size: filtro.size
    });
  }
}
