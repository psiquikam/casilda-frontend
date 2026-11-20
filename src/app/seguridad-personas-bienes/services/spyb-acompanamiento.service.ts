import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SpybApiClient, ParametrosSpyb } from './spyb-api.client';
import {
  InformeAcompanamiento,
  OrdenAcompanamiento
} from '../models/spyb.models';
import {
  CrearOrdenAcompanamientoRequest,
  RegistrarInformeAcompanamientoRequest
} from '../models/spyb-dtos';

@Injectable({ providedIn: 'root' })
export class SpybAcompanamientoService {
  private readonly api = inject(SpybApiClient);

  crearOrden(payload: CrearOrdenAcompanamientoRequest): Observable<OrdenAcompanamiento> {
    return this.api.post<OrdenAcompanamiento>('/ordenes-acompanamiento', payload);
  }

  listarOrdenes(params?: ParametrosSpyb): Observable<OrdenAcompanamiento[]> {
    return this.api.get<OrdenAcompanamiento[]>('/ordenes-acompanamiento', params);
  }

  obtenerOrdenPorToken(tokenAcceso: string): Observable<OrdenAcompanamiento> {
    return this.api.get<OrdenAcompanamiento>(`/ordenes-acompanamiento/restringida/${encodeURIComponent(tokenAcceso)}`);
  }

  registrarInforme(codigoOrden: string, payload: RegistrarInformeAcompanamientoRequest): Observable<InformeAcompanamiento> {
    return this.api.post<InformeAcompanamiento>(`/ordenes-acompanamiento/${encodeURIComponent(codigoOrden)}/informe`, payload);
  }

  registrarInformeDirecto(payload: RegistrarInformeAcompanamientoRequest): Observable<InformeAcompanamiento> {
    return this.api.post<InformeAcompanamiento>('/informes-acompanamiento', payload);
  }

  obtenerInforme(id: number): Observable<InformeAcompanamiento> {
    return this.api.get<InformeAcompanamiento>(`/informes-acompanamiento/${id}`);
  }
}

