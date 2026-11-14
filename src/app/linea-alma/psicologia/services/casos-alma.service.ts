import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { AgendaItemDto, AlcanceAgenda, CasoDto, CierreCasoRequestDto, SeguimientoCrearDto, SeguimientoDto } from '../../shared/types/alma-psicologia-dto';
import { ESTADOS_CASO_ACTIVOS } from '../../shared/types/alma.types';
import { ContadorControles, contadorControles } from '../dominio/seguimientos';

/** Tolerancia para la generación del PDF (Q10). */
export const TIEMPO_MAXIMO_PDF_MS = 30_000;

/** Expediente listo para la vista. */
export type CasoAlma = CasoDto & {
  readonly nombreCompleto: string;
  /** Admite seguimientos y cierre. */
  readonly activo: boolean;
  readonly controles: ContadorControles;
};

export function aCaso(dto: CasoDto): CasoAlma {
  return {
    ...dto,
    nombreCompleto: [dto.persona.nombres, dto.persona.apellidos].filter(Boolean).join(' ') || 'Sin nombre registrado',
    activo: ESTADOS_CASO_ACTIVOS.includes(dto.estado),
    controles: contadorControles(dto.numeroSeguimientos)
  };
}

/** J-1.5, J-1.6 y J-2.1 — `/casos/{numeroCaso}` y `/psicologia/agenda`. */
@Injectable({ providedIn: 'root' })
export class CasosAlmaService {
  private readonly api = inject(AlmaApiClient);

  obtener(numeroCaso: string): Observable<CasoAlma> {
    return this.api.get<CasoDto>(`/casos/${numeroCaso}`).pipe(map(aCaso));
  }

  listarSeguimientos(numeroCaso: string): Observable<SeguimientoDto[]> {
    return this.api.get<SeguimientoDto[]>(`/casos/${numeroCaso}/seguimientos`);
  }

  /** Registra el seguimiento; el recordatorio por correo lo envía el servidor y vuelve en `recordatorio.estado`. */
  registrarSeguimiento(numeroCaso: string, cuerpo: SeguimientoCrearDto): Observable<CasoAlma> {
    return this.api.post<CasoDto>(`/casos/${numeroCaso}/seguimientos`, cuerpo).pipe(map(aCaso));
  }

  cerrar(numeroCaso: string, cuerpo: CierreCasoRequestDto): Observable<CasoAlma> {
    return this.api.post<CasoDto>(`/casos/${numeroCaso}/cierre`, cuerpo).pipe(map(aCaso));
  }

  /** PDF del historial (RF-ALMA-007). Solo para roles con `alma.pdf.exportar`; el servidor también lo verifica. */
  descargarPdf(numeroCaso: string): Observable<Blob> {
    return this.api.descargar(`/casos/${numeroCaso}/pdf`).pipe(timeout(TIEMPO_MAXIMO_PDF_MS));
  }

  /** Controles programados en el rango (`YYYY-MM-DD`). `mios` = de la sesión actual. */
  agenda(desde: string, hasta: string, alcance: AlcanceAgenda = 'mios'): Observable<AgendaItemDto[]> {
    return this.api.get<AgendaItemDto[]>('/psicologia/agenda', { desde, hasta, alcance });
  }
}
