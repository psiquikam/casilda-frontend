import { Observable, of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';

/**
 * Utilidades compartidas por los servicios mock del panel de inicio.
 *
 * Los estados de carga, vacío y error son requisito de cada zona (DSH-07-04).
 * Para poder probarlos sin backend, el mock simula latencia y puede forzar un
 * fallo (DSH-12-09). Nada de esto sobrevive a la integración: cuando el
 * endpoint real exista, se sustituye el cuerpo del método del servicio y estas
 * utilidades dejan de usarse.
 */

/** Latencia simulada, en milisegundos. */
export const LATENCIA_MOCK_MS = 450;

/**
 * Permite forzar el estado de error desde la consola del navegador durante una
 * revisión: `window.casildaForzarErrorPanel = true`.
 */
declare global {
  interface Window {
    casildaForzarErrorPanel?: boolean;
  }
}

/** Emite el valor tras la latencia simulada, o falla si se forzó el error. */
export function respuestaSimulada<T>(valor: T): Observable<T> {
  return timer(LATENCIA_MOCK_MS).pipe(
    mergeMap(() =>
      typeof window !== 'undefined' && window.casildaForzarErrorPanel
        ? throwError(() => new Error('Error simulado del panel de inicio'))
        : of(valor)
    )
  );
}

/** Variante sin `timer` para pruebas que no quieren manejar el reloj. */
export function respuestaInmediata<T>(valor: T): Observable<T> {
  return of(valor).pipe(delay(0));
}

/**
 * Fecha relativa al día actual, para que los mocks no envejezcan: una agenda
 * fechada en marzo de 2026 se ve rota en octubre (DSH-12-06).
 */
export function diasDesdeHoy(dias: number, hora = 0, minutos = 0): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, minutos, 0, 0);
  return fecha;
}
