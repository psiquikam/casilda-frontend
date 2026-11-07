import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { AtencionAphDto, BandejaAphItemDto, FiltroBandejaAph, PaginaAlma } from '../../shared/types/alma-dto';
import { AtencionAph, aAtencion } from './atenciones-aph.service';

/** H-1.6 — `GET /bandeja/aph` y `POST /bandeja/aph/{id}/tomar`. */
@Injectable({ providedIn: 'root' })
export class BandejaAphService {
  private readonly api = inject(AlmaApiClient);

  listar(filtro: FiltroBandejaAph): Observable<PaginaAlma<BandejaAphItemDto>> {
    return this.api.get<PaginaAlma<BandejaAphItemDto>>('/bandeja/aph', {
      vista: filtro.vista,
      origen: filtro.origen,
      estado: filtro.estado,
      page: filtro.page,
      size: filtro.size
    });
  }

  /** Toma la remisión enviando la `version` leída; 409 `REMISION_YA_TOMADA` si otra persona se adelantó. */
  tomar(idAtencion: string, version: number): Observable<AtencionAph> {
    return this.api.post<AtencionAphDto>(`/bandeja/aph/${idAtencion}/tomar`, { version }).pipe(map(aAtencion));
  }
}
