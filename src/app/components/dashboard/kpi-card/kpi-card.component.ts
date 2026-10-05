import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { IndicadorDto } from '../../../services/dashboard-metricas.service';

/**
 * Tarjeta de indicador del panel de inicio.
 *
 * Estructura obligatoria del contrato (§6.1): etiqueta en tipo oración, botón de
 * definición, valor principal y contexto con periodo y denominador.
 *
 * No reutiliza `CasildaCardComponent`, que está pensado para contenido
 * destacado (`ContenidoDestacadoDto`) y no para métricas, pero sí comparte sus
 * tokens de superficie, borde, radio y sombra (DSH-11-05).
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PercentPipe, RouterLink, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
  readonly indicador = input.required<IndicadorDto>();
  /** Fecha de corte de la cifra, común a todo el bloque (DSH-02-05). */
  readonly corte = input.required<string>();

  /**
   * Nombre accesible del botón de definición. `matTooltip` muestra el texto,
   * pero **no** es nombre accesible (regla 7 de `CLAUDE.md`, DSH-11-01).
   */
  readonly etiquetaDefinicion = computed(() => `Definición de ${this.indicador().etiqueta.toLowerCase()}`);

  /** La tarjeta solo es clicable si lleva a una vista coherente (DSH-11-03). */
  readonly esClicable = computed(() => Boolean(this.indicador().ruta));
}
