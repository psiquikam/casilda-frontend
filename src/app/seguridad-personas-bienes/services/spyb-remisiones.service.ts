import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SpybApiClient, ParametrosSpyb } from './spyb-api.client';
import {
  RequerimientoUad,
  RemisionSeguridad
} from '../models/spyb.models';
import {
  CrearRemisionSeguridadRequest,
  RegistrarRequerimientoUadRequest
} from '../models/spyb-dtos';

@Injectable({ providedIn: 'root' })
export class SpybRemisionesService {
  private readonly api = inject(SpybApiClient);

  crearRemision(payload: CrearRemisionSeguridadRequest): Observable<RemisionSeguridad> {
    return this.api.post<RemisionSeguridad>('/remisiones', payload);
  }

  listarRemisiones(params?: ParametrosSpyb): Observable<RemisionSeguridad[]> {
    return this.api.get<RemisionSeguridad[]>('/remisiones', params);
  }

  actualizarConsecutivoUad(idRemision: number, consecutivo: string): Observable<RemisionSeguridad> {
    return this.api.patch<RemisionSeguridad>(`/remisiones/${idRemision}/uad-consecutivo`, { consecutivo });
  }

  actualizarRadicadoUad(idRemision: number, radicado: string, estado: string): Observable<RemisionSeguridad> {
    return this.api.patch<RemisionSeguridad>(`/remisiones/${idRemision}/uad-radicado`, { radicado, estado });
  }

  registrarRequerimientoUad(payload: RegistrarRequerimientoUadRequest): Observable<RequerimientoUad> {
    return this.api.post<RequerimientoUad>('/remisiones/uad/requerimientos', payload);
  }

  listarRequerimientosUad(idRemision?: number): Observable<RequerimientoUad[]> {
    return this.api.get<RequerimientoUad[]>('/remisiones/uad/requerimientos', idRemision ? { idRemision } : undefined);
  }
}

