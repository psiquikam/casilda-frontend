import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import {
  DerivacionInternaCerrarDto,
  DerivacionInternaCrearDto,
  DerivacionInternaDto,
  RutaExternaActualizarDto,
  RutaExternaCrearDto,
  RutaExternaDto,
  SeguimientoRemisionCrearDto
} from '../../shared/types/alma-dto';
import { ContextoAlma } from '../../shared/types/alma.types';

/** H-1.5 — derivaciones internas y rutas externas (frontera F6: reutilizable por Psicología). */
@Injectable({ providedIn: 'root' })
export class DerivacionesAlmaService {
  private readonly api = inject(AlmaApiClient);

  crearInterna(cuerpo: DerivacionInternaCrearDto): Observable<DerivacionInternaDto> {
    return this.api.post<DerivacionInternaDto>('/derivaciones/internas', cuerpo);
  }

  listarInternas(contexto: ContextoAlma): Observable<DerivacionInternaDto[]> {
    return this.api.get<DerivacionInternaDto[]>('/derivaciones/internas', { tipoContexto: contexto.tipo, idContexto: contexto.id });
  }

  crearRutaExterna(cuerpo: RutaExternaCrearDto): Observable<RutaExternaDto> {
    return this.api.post<RutaExternaDto>('/rutas-externas', cuerpo);
  }

  listarRutasExternas(contexto: ContextoAlma): Observable<RutaExternaDto[]> {
    return this.api.get<RutaExternaDto[]>('/rutas-externas', { tipoContexto: contexto.tipo, idContexto: contexto.id });
  }

  /** Cierra una derivación interna con su resultado (cerrarla no cierra la atención). */
  cerrarInterna(idDerivacion: string, cuerpo: DerivacionInternaCerrarDto): Observable<DerivacionInternaDto> {
    return this.api.patch<DerivacionInternaDto>(`/derivaciones/internas/${idDerivacion}`, cuerpo);
  }

  /** Novedad con fecha y hora sobre una derivación interna: se pueden agregar tantas como haga falta. */
  agregarSeguimientoInterna(idDerivacion: string, cuerpo: SeguimientoRemisionCrearDto): Observable<DerivacionInternaDto> {
    return this.api.post<DerivacionInternaDto>(`/derivaciones/internas/${idDerivacion}/seguimientos`, cuerpo);
  }

  agregarSeguimientoRuta(idRuta: string, cuerpo: SeguimientoRemisionCrearDto): Observable<RutaExternaDto> {
    return this.api.post<RutaExternaDto>(`/rutas-externas/${idRuta}/seguimientos`, cuerpo);
  }

  actualizarRutaExterna(idRuta: string, cuerpo: RutaExternaActualizarDto): Observable<RutaExternaDto> {
    return this.api.patch<RutaExternaDto>(`/rutas-externas/${idRuta}`, cuerpo);
  }
}
