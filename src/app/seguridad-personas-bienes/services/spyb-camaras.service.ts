import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SpybApiClient, ParametrosSpyb } from './spyb-api.client';
import { SolicitudEvidenciaCamara } from '../models/spyb.models';
import {
  ActualizarCustodiaCamaraRequest,
  EntregaEvidenciaAutoridadRequest,
  SolicitarEvidenciaCamaraRequest
} from '../models/spyb-dtos';

@Injectable({ providedIn: 'root' })
export class SpybCamarasService {
  private readonly api = inject(SpybApiClient);

  solicitarEvidencia(payload: SolicitarEvidenciaCamaraRequest): Observable<SolicitudEvidenciaCamara> {
    return this.api.post<SolicitudEvidenciaCamara>('/evidencias/solicitudes', payload);
  }

  listarSolicitudes(params?: ParametrosSpyb): Observable<SolicitudEvidenciaCamara[]> {
    return this.api.get<SolicitudEvidenciaCamara[]>('/evidencias/solicitudes', params);
  }

  actualizarCustodia(id: number, payload: ActualizarCustodiaCamaraRequest): Observable<SolicitudEvidenciaCamara> {
    return this.api.patch<SolicitudEvidenciaCamara>(`/evidencias/solicitudes/${id}/custodia`, payload);
  }

  registrarEntregaAutoridad(id: number, payload: EntregaEvidenciaAutoridadRequest): Observable<SolicitudEvidenciaCamara> {
    return this.api.post<SolicitudEvidenciaCamara>(`/evidencias/solicitudes/${id}/entrega-autoridad`, payload);
  }
}

