import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { ContencionPostCierreCrearDto, ContencionPostCierreDto } from '../../shared/types/alma-dto';

/** H-1.7 — `POST /contenciones-post-cierre` (no reabre el caso ni suma seguimientos). */
@Injectable({ providedIn: 'root' })
export class ContencionesAlmaService {
  private readonly api = inject(AlmaApiClient);

  crear(cuerpo: ContencionPostCierreCrearDto): Observable<ContencionPostCierreDto> {
    return this.api.post<ContencionPostCierreDto>('/contenciones-post-cierre', cuerpo);
  }
}
