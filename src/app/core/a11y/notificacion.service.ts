import { Injectable, inject, isDevMode } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Duraciones (ms). Los errores permanecen más tiempo y siempre se pueden cerrar. */
const DURACION_ERROR = 10000;
const DURACION_INFO = 5000;

/**
 * Notificaciones visibles y anunciadas (WCAG 2.2 · 3.3.1 · 4.1.3).
 *
 * Antes, un fallo de red terminaba en `console.error` y la persona veía un
 * spinner que se detenía y nada más: no sabía si guardó, si debía reintentar o
 * si perdió lo escrito. Este servicio centraliza la retroalimentación:
 *
 * - `error()`   → `role="alert"` (politeness *assertive*), 10 s, acción «Cerrar».
 * - `exito()`   → `role="status"` (politeness *polite*), 5 s.
 * - `info()`    → `role="status"`, 5 s.
 *
 * La causa técnica solo se registra en consola en modo desarrollo.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly snackBar = inject(MatSnackBar);

  error(mensaje: string, causa?: unknown): void {
    if (isDevMode() && causa !== undefined) {
      console.debug('[Casilda] detalle del error:', mensaje, causa);
    }
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: DURACION_ERROR,
      politeness: 'assertive',
      panelClass: 'casilda-snackbar--error'
    });
  }

  exito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: DURACION_INFO,
      politeness: 'polite',
      panelClass: 'casilda-snackbar--exito'
    });
  }

  info(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: DURACION_INFO, politeness: 'polite' });
  }
}
