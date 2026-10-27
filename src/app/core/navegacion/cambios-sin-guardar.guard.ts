import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Observable, of } from 'rxjs';

import { DialogoService } from '../a11y/dialogo.service';

/** Lo implementa toda vista con un formulario que no debe perderse al navegar. */
export interface ConCambiosPendientes {
  tieneCambiosPendientes(): boolean;
}

/**
 * Pide confirmación antes de salir de una vista con cambios sin guardar
 * (menú, «Volver», botón atrás del navegador). Reutilizable: basta con que el
 * componente implemente `ConCambiosPendientes` y la ruta declare
 * `canDeactivate: [cambiosSinGuardarGuard]`.
 *
 * La Salida rápida no pasa por aquí: usa `location.replace()` fuera del router,
 * y así debe seguir (regla 6 de `CLAUDE.md`).
 */
export const cambiosSinGuardarGuard: CanDeactivateFn<ConCambiosPendientes> = (componente): Observable<boolean> => {
  if (!componente?.tieneCambiosPendientes()) return of(true);

  return inject(DialogoService).confirmar({
    titulo: 'Salir sin guardar',
    subtitulo: 'Los cambios de este formulario se perderán',
    mensaje: '¿Desea salir? Lo que escribió todavía no se ha guardado.',
    textoConfirmar: 'Salir sin guardar',
    iconoConfirmar: 'logout',
    textoCancelar: 'Seguir editando'
  });
};
