import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SpybApiClient } from './spyb-api.client';
import {
  ConteosBandejaAnalista,
  IndicadoresSpyb,
  RegistroSeguridad
} from '../models/spyb.models';
import {
  SugerenciaCasoDto,
  VincularCasoRequest
} from '../models/spyb-dtos';

@Injectable({ providedIn: 'root' })
export class SpybAnalistaService {
  private readonly api = inject(SpybApiClient);

  obtenerConteos(): Observable<ConteosBandejaAnalista> {
    return this.api.get<ConteosBandejaAnalista>('/analista/conteos');
  }

  obtenerBandeja(pestana: string, page = 0, size = 10): Observable<{ items: RegistroSeguridad[]; total: number }> {
    return this.api.get<{ items: RegistroSeguridad[]; total: number }>('/analista/bandeja', { pestana, page, size });
  }

  obtenerSugerenciasCasos(numeroDocumento: string): Observable<SugerenciaCasoDto[]> {
    return this.api.get<SugerenciaCasoDto[]>('/casos/sugerencias-vinculacion', { numeroDocumento });
  }

  vincularCaso(idRegistro: number, idCaso: number, criterioJustificacion: string): Observable<RegistroSeguridad> {
    const payload: VincularCasoRequest = { idCaso, criterioJustificacion };
    return this.api.post<RegistroSeguridad>(`/registros/${idRegistro}/vincular-caso`, payload);
  }

  declararIndependiente(idRegistro: number, motivo: string): Observable<RegistroSeguridad> {
    return this.api.post<RegistroSeguridad>(`/registros/${idRegistro}/declarar-independiente`, { motivo });
  }

  solicitarSubsanacion(idRegistro: number, motivoSubsanacion: string): Observable<RegistroSeguridad> {
    return this.api.post<RegistroSeguridad>(`/registros/${idRegistro}/solicitar-subsanacion`, { motivoSubsanacion });
  }

  obtenerIndicadores(): Observable<IndicadoresSpyb> {
    return this.api.get<IndicadoresSpyb>('/indicadores/resumen');
  }
}

