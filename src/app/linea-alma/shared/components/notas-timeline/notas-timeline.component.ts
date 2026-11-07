import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NotaAtencionDto, TipoNota } from '../../types/alma-dto';

const ETIQUETA_TIPO: Record<TipoNota, string> = {
  APH: 'Nota de APH',
  PSICO: 'Nota de Psicología',
  SEGTO: 'Seguimiento',
  POST_CIERRE: 'Después del cierre'
};

/**
 * `NotasTimeline` — línea de tiempo de notas (APH / PSICO / SEGTO / POST_CIERRE).
 *
 * **PROVISIONAL — dueño: Jonathan.** Versión mínima para el detalle APH (H-2.1). El rol APH solo
 * debe recibir notas `APH` y `POST_CIERRE`; por eso `tiposVisibles` **filtra también aquí**
 * (defensa en profundidad, R4) aunque el DTO ya llegue reducido desde el servidor.
 */
@Component({
  selector: 'app-notas-timeline',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visibles().length === 0) {
      <p class="notas__vacio">Todavía no hay notas.</p>
    } @else {
      <ol class="notas" aria-label="Notas de la atención, de la más reciente a la más antigua">
        @for (nota of visibles(); track nota.idNota) {
          <li class="notas__item" [class.notas__item--cierre]="nota.tipoOrigen === 'POST_CIERRE'">
            <p class="notas__cabecera">
              <strong>{{ etiquetas[nota.tipoOrigen] }}</strong>
              <span>{{ nota.fechaRegistro | date: 'd MMM y, h:mm a' }} · {{ nota.autor }}</span>
            </p>
            <p class="notas__texto">{{ nota.contenido }}</p>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .notas { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
    .notas__item { padding: var(--space-3) var(--space-4); border-left: 4px solid var(--color-secondary); background: var(--color-bg-subtle); border-radius: var(--radius-sm); }
    .notas__item--cierre { border-left-color: var(--color-comp-purple); }
    .notas__cabecera { margin: 0 0 var(--space-1); display: flex; flex-wrap: wrap; gap: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .notas__texto { margin: 0; white-space: pre-wrap; }
    .notas__vacio { margin: 0; color: var(--color-text-secondary); }
  `
})
export class NotasTimelineComponent {
  readonly notas = input.required<readonly NotaAtencionDto[]>();
  /** Tipos que el rol actual puede ver. APH: `APH` y `POST_CIERRE`. */
  readonly tiposVisibles = input<readonly TipoNota[]>(['APH', 'POST_CIERRE']);

  protected readonly etiquetas = ETIQUETA_TIPO;
  protected readonly visibles = computed(() =>
    this.notas()
      .filter((nota) => this.tiposVisibles().includes(nota.tipoOrigen))
      .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro))
  );
}
