import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RelojServidorService } from '../../sla/reloj-servidor.service';
import { ETIQUETA_SEMAFORO, UMBRALES_SLA_POR_DEFECTO, UmbralesSla, describirSla, evaluarSla } from '../../sla/sla';
import { SlaDto } from '../../types/alma-dto';
import { SemaforoSla } from '../../types/alma-psicologia-dto';

const ICONO: Record<SemaforoSla, string> = { VERDE: 'schedule', AMARILLO: 'hourglass_top', ROJO: 'alarm_off' };

/**
 * `SlaBadge` — semáforo y reloj decreciente del plazo de primer contacto (J-0.3, RN-ALMA-01).
 *
 * Lo consumen la bandeja de Psicología y las listas de APH (frontera F3). El color nunca es el
 * único portador de significado: lleva ícono y texto («Quedan 3 h 20 min», «Vencido hace 2 h»).
 * El tiempo se calcula con `RelojServidorService` (anclado a `ahoraServidor`), y se actualiza sin
 * recargar la página.
 */
@Component({
  selector: 'app-sla-badge',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (estado(); as e) {
      <span class="sla" [class]="'sla sla--' + e.semaforo.toLowerCase()" [class.sla--compacto]="compacto()" [attr.aria-label]="descripcionCompleta()">
        <mat-icon aria-hidden="true">{{ icono[e.semaforo] }}</mat-icon>
        <span class="sla__texto">{{ texto() }}</span>
        @if (!compacto()) {
          <span class="sla__detalle">· {{ e.horasLimite }} h</span>
        }
      </span>
    }
  `,
  styles: `
    .sla { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); border: 1px solid transparent; font-size: var(--font-size-sm); font-weight: 600; white-space: nowrap; }
    .sla mat-icon { font-size: var(--font-size-md); width: var(--font-size-md); height: var(--font-size-md); }
    .sla--verde { background: var(--color-bg-success-light); color: var(--color-primary); border-color: var(--color-primary-border); }
    .sla--amarillo { background: var(--color-bg-warning-light); color: var(--color-text-primary); border-color: var(--color-warning); }
    .sla--rojo { background: var(--color-bg-danger-light); color: var(--color-danger-text); border-color: var(--color-comp-red-border); }
    .sla--compacto { padding: 0 var(--space-2); }
    .sla__detalle { font-weight: 400; color: var(--color-text-secondary); }
  `
})
export class SlaBadgeComponent {
  private readonly reloj = inject(RelojServidorService);

  readonly sla = input.required<SlaDto>();
  readonly umbrales = input<UmbralesSla>(UMBRALES_SLA_POR_DEFECTO);
  /** Sin el detalle de horas límite (para tablas densas). */
  readonly compacto = input(false);

  protected readonly icono = ICONO;
  protected readonly estado = computed(() => {
    const ahora = this.reloj.ahora() ?? Date.parse(this.sla().ahoraServidor);
    return evaluarSla(this.sla(), ahora, this.umbrales());
  });
  protected readonly texto = computed(() => describirSla(this.estado()));
  protected readonly descripcionCompleta = computed(() => `${ETIQUETA_SEMAFORO[this.estado().semaforo]}: ${this.texto()}`);

  constructor() {
    effect(() => {
      const ahoraServidor = this.sla().ahoraServidor;
      untracked(() => this.reloj.sincronizar(ahoraServidor));
    });
  }
}
