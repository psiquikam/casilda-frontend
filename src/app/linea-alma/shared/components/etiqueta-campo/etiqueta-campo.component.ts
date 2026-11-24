import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Etiqueta de un campo, con el mismo aspecto que en Seguridad a personas y bienes: texto arriba,
 * asterisco rojo si es obligatorio y un «?» con tooltip de ayuda (clases globales `spyb-campo__etiqueta`,
 * `required-star`, `help-tooltip-trigger` y `casilda-help-tooltip` de `styles.scss`).
 *
 * Va dentro de un contenedor `.spyb-campo` y se enlaza al control con `para` (el `id` del input).
 * El nombre accesible del «?» lleva el de la etiqueta; `matTooltip` por sí solo no basta (regla 7).
 */
@Component({
  selector: 'app-etiqueta-campo',
  imports: [MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'etiqueta-campo' },
  template: `
    <label class="spyb-campo__etiqueta" [attr.for]="para()">
      {{ texto() }}
      @if (obligatorio()) {
        <span class="required-star" aria-hidden="true">*</span>
        <span class="visually-hidden">(obligatorio)</span>
      }
      @if (ayuda()) {
        <button
          type="button"
          class="help-tooltip-trigger"
          [matTooltip]="ayuda()"
          matTooltipClass="casilda-help-tooltip"
          (click)="$event.stopPropagation()"
          [attr.aria-label]="'Ayuda sobre ' + texto().toLowerCase()"
        >?</button>
      }
    </label>
  `,
  styles: `:host { display: block; }`
})
export class EtiquetaCampoComponent {
  readonly texto = input.required<string>();
  /** `id` del control al que acompaña. */
  readonly para = input<string | null>(null);
  readonly obligatorio = input(false);
  /** Texto del tooltip; si falta no se dibuja el «?». */
  readonly ayuda = input('');
}
