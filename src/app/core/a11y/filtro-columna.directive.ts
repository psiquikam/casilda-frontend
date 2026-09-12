import { Directive, computed, input } from '@angular/core';

/**
 * Campo de filtro de columna accesible (WCAG 2.2 · 3.3.2 · 4.1.2 · 2.4.7).
 *
 * Las cabeceras de las tablas del back-office llevan un `<input>` por columna
 * cuyo único texto era el `placeholder` («Filtrar», «...», «N°»), que desaparece
 * al escribir y no cuenta como etiqueta. La directiva:
 *
 * - da un **nombre accesible** contextual: «Filtrar por {columna}»;
 * - declara `type="search"` (semántica y tecla de borrado nativa) y
 *   `autocomplete="off"` (no sugerir datos de personas atendidas);
 * - añade la clase `filtro-columna`, cuyo foco visible se define en
 *   `src/styles/_base.scss`.
 *
 * Uso:
 * ```html
 * <input appFiltroColumna="ID de caso" (keyup)="applyFilter('id', $event)" placeholder="Filtrar">
 * ```
 */
@Directive({
  selector: 'input[appFiltroColumna]',
  host: {
    type: 'search',
    autocomplete: 'off',
    class: 'filtro-columna',
    '[attr.aria-label]': 'nombreAccesible()'
  }
})
export class FiltroColumnaDirective {
  /** Nombre visible de la columna, tal como aparece en la cabecera. */
  readonly columna = input.required<string>({ alias: 'appFiltroColumna' });

  readonly nombreAccesible = computed(() => `Filtrar por ${this.columna()}`);
}
