import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SpybApiClient, ParametrosSpyb } from './spyb-api.client';
import {
  CrearRegistroSeguridadRequest,
  RegistroSeguridadResponse
} from '../models/spyb-dtos';
import {
  ConsultaMedidaActivaResponse,
  RegistroSeguridad
} from '../models/spyb.models';

@Injectable({ providedIn: 'root' })
export class SpybRegistroService {
  private readonly api = inject(SpybApiClient);

  crearRegistro(payload: CrearRegistroSeguridadRequest): Observable<RegistroSeguridadResponse> {
    return this.api.post<RegistroSeguridadResponse>('/registros', payload);
  }

  crearRegistroRestringido(payload: CrearRegistroSeguridadRequest): Observable<RegistroSeguridadResponse> {
    return this.api.post<RegistroSeguridadResponse>('/registros/restringido', payload);
  }

  obtenerRegistro(id: number): Observable<RegistroSeguridad> {
    return this.api.get<RegistroSeguridad>(`/registros/${id}`);
  }

  consultarMedidaActiva(documento: string): Observable<ConsultaMedidaActivaResponse> {
    return this.api.get<ConsultaMedidaActivaResponse>(`/consultas/medida-activa/${encodeURIComponent(documento)}`);
  }

  listarRegistros(params?: ParametrosSpyb): Observable<{ items: RegistroSeguridad[]; total: number }> {
    return this.api.get<{ items: RegistroSeguridad[]; total: number }>('/registros', params);
  }
}

