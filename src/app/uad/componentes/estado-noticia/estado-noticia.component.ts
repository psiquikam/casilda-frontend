import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EstadoNoticia } from '../../contratos/uad-api.types';
import { ETIQUETA_ESTADO_NOTICIA, ICONO_ESTADO_NOTICIA } from '../../dominio/etiquetas';

type Tono = 'neutro' | 'proceso' | 'espera' | 'cierre' | 'exito';

const TONO: Record<EstadoNoticia, Tono> = {
  RECIBIDA: 'neutro',
  PENDIENTE_CLASIFICACION: 'espera',
  EN_EVALUACION_PRELIMINAR: 'proceso',
  PENDIENTE_SUBSANACION: 'espera',
  SUBSANACION_RECIBIDA: 'proceso',
  EN_REEVALUACION: 'proceso',
  INHIBITORIA: 'cierre',
  REMITIDA_POR_COMPETENCIA: 'cierre',
  PROCEDE_TRAMITE: 'exito'
};

/** Estado de la **noticia** con ícono y texto: el color nunca va solo (CLAUDE.md §6.5). */
@Component({
  selector: 'app-uad-estado-noticia',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="estado" [class]="'estado estado--' + tono()">
      <mat-icon aria-hidden="true">{{ icono() }}</mat-icon>
      {{ etiqueta() }}
    </span>
  `,
  styles: `
    .estado {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border-strong);
      background: var(--color-bg-subtle);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      white-space: nowrap;
    }
    .estado mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .estado--proceso { background: var(--color-bg-info-light); border-color: var(--color-info); }
    .estado--espera { background: var(--color-bg-warning-light); border-color: var(--color-warning); }
    .estado--cierre { background: var(--color-bg-subtle); border-color: var(--color-text-muted); }
    .estado--exito { background: var(--color-bg-success-light); border-color: var(--color-success); }
  `
})
export class EstadoNoticiaComponent {
  readonly estado = input.required<EstadoNoticia>();
  protected readonly etiqueta = computed(() => ETIQUETA_ESTADO_NOTICIA[this.estado()]);
  protected readonly icono = computed(() => ICONO_ESTADO_NOTICIA[this.estado()]);
  protected readonly tono = computed(() => TONO[this.estado()]);
}
