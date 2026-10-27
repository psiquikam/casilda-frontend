import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { EstadoVigencia } from '../../../core/contenidos/reglas-contenido';

/** Texto e ícono por estado. El color acompaña, nunca sustituye (regla 5 de `CLAUDE.md`). */
export const ETIQUETAS_ESTADO: Record<EstadoVigencia, { texto: string; icono: string }> = {
  vigente: { texto: 'Publicado', icono: 'visibility' },
  programado: { texto: 'Programado', icono: 'schedule' },
  vencido: { texto: 'Vencido', icono: 'history' }
};

/** Insignia del estado de publicación de un contenido del home. */
@Component({
  selector: 'app-estado-vigencia',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'estado estado--' + estado()">
      <mat-icon aria-hidden="true">{{ etiqueta().icono }}</mat-icon>
      {{ etiqueta().texto }}
    </span>
  `,
  styles: `
    .estado {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 2px var(--space-3) 2px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-sm);
      font-weight: 700;
      line-height: var(--line-height-base);
      white-space: nowrap;
      border: 1px solid transparent;

      .mat-icon { width: 16px; height: 16px; font-size: 16px; }
    }
    .estado--vigente { color: var(--color-primary); background: var(--color-primary-tint); border-color: var(--color-primary-border); }
    .estado--programado { color: var(--color-info); background: var(--color-bg-info-light); border-color: var(--color-comp-blue-border); }
    .estado--vencido { color: var(--color-text-secondary); background: var(--color-bg-subtle); border-color: var(--color-border-strong); }
  `
})
export class EstadoVigenciaComponent {
  readonly estado = input.required<EstadoVigencia>();
  readonly etiqueta = computed(() => ETIQUETAS_ESTADO[this.estado()]);
}
