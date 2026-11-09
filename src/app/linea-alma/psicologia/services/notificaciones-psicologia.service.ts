import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, Subject, catchError, merge, share, switchMap, tap, timer } from 'rxjs';
import { AlmaApiClient } from '../../shared/http/alma-api.client';
import { NotificacionesPsicologiaDto } from '../../shared/types/alma-psicologia-dto';

/** Cada cuánto se consulta al servidor mientras una pantalla de Psicología está abierta (Q7). */
export const INTERVALO_NOTIFICACIONES_MS = 30_000;

/**
 * Notificaciones de Psicología (equivale al `useNotificaciones` del plan, Q7): contadores de
 * novedades pendientes, recontactos por resolver y plazos vencidos.
 *
 * Hoy es **polling cada 30 s** detrás de esta abstracción; si Backend ofrece SSE o WebSocket se
 * cambia aquí la fuente de `cambios$` sin tocar la bandeja ni la cabecera. Solo consulta mientras
 * alguien está suscrito (`share`), así que al salir del módulo deja de pedir.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesPsicologiaService {
  private readonly api = inject(AlmaApiClient);
  private readonly manual = new Subject<void>();

  /** Último resumen recibido; `null` hasta la primera respuesta. */
  readonly resumen = signal<NotificacionesPsicologiaDto | null>(null);

  /** Emite cada vez que llega un resumen nuevo (periódico o por `refrescar()`). Los fallos de red se ignoran y se reintenta en el siguiente ciclo. */
  readonly cambios$: Observable<NotificacionesPsicologiaDto> = merge(timer(0, INTERVALO_NOTIFICACIONES_MS), this.manual).pipe(
    switchMap(() => this.api.get<NotificacionesPsicologiaDto>('/psicologia/notificaciones').pipe(catchError(() => EMPTY))),
    tap((resumen) => this.resumen.set(resumen)),
    share()
  );

  /** Fuerza una consulta inmediata (p. ej. tras tomar una novedad o resolver un recontacto). */
  refrescar(): void {
    this.manual.next();
  }
}
