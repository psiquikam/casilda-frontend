import { Component, DOCUMENT, ElementRef, effect, inject, input, output, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ErrorFormulario } from './errores-formulario';

/**
 * Resumen de errores enfocable (WCAG 2.2 · 3.3.1 Identificación de errores ·
 * 3.3.3 Sugerencia ante error · 4.1.3 Mensajes de estado).
 *
 * Al recibir errores mueve el foco al contenedor (`role="alert"` los anuncia) y
 * ofrece un enlace por campo que lleva el foco al control inválido, útil cuando
 * el campo quedó fuera de la vista o en otro paso del formulario.
 *
 * Uso:
 * ```html
 * <app-resumen-errores [errores]="erroresRelato" />
 * ```
 * Cada control listado debe tener un `id` que coincida con `ErrorFormulario.id`.
 */
@Component({
  selector: 'app-resumen-errores',
  imports: [MatIconModule],
  template: `
    @if (errores().length > 0) {
      <div #contenedor class="casilda-alerta casilda-alerta--peligro resumen-errores" role="alert" tabindex="-1">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <div>
          <strong>
            @if (errores().length === 1) {
              Hay un campo por revisar antes de continuar:
            } @else {
              Hay {{ errores().length }} campos por revisar antes de continuar:
            }
          </strong>
          <ul class="resumen-errores__lista">
            @for (e of errores(); track e.id) {
              <li>
                <a [href]="'#' + e.id" (click)="irAlCampo($event, e.id)">{{ e.etiqueta }}</a>: {{ e.mensaje }}
              </li>
            }
          </ul>
        </div>
      </div>
    }
  `,
  styles: `
    .resumen-errores { margin-bottom: var(--space-4); }
    .resumen-errores__lista { margin: var(--space-2) 0 0; padding-left: var(--space-5); }
    .resumen-errores__lista li + li { margin-top: var(--space-1); }
    .resumen-errores a { color: var(--color-danger-text); font-weight: 700; }
  `
})
export class ResumenErroresComponent {
  private readonly document = inject(DOCUMENT);
  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('contenedor');

  readonly errores = input<ErrorFormulario[]>([]);

  /**
   * Se emite antes de enfocar el campo, con su `id`. Permite al formulario
   * anfitrión revelar el control (cambiar de pestaña, expandir una sección…)
   * cuando no está visible.
   */
  readonly campoSolicitado = output<string>();

  constructor() {
    // Cada vez que llega una lista no vacía, el foco va al resumen.
    effect(() => {
      if (this.errores().length === 0) return;
      setTimeout(() => this.contenedor()?.nativeElement.focus());
    });
  }

  irAlCampo(evento: Event, id: string): void {
    evento.preventDefault();
    this.campoSolicitado.emit(id);
    // Un ciclo de espera por si el anfitrión acaba de revelar el campo.
    setTimeout(() => {
      const campo = this.document.getElementById(id);
      if (!campo) return;
      campo.scrollIntoView({ block: 'center', behavior: 'smooth' });
      campo.focus();
    });
  }
}
