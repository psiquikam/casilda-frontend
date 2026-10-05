import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';

import { ZonaPanelComponent } from '../zona-panel/zona-panel.component';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { DashboardMetricasService, IndicadorDto } from '../../../services/dashboard-metricas.service';

/** Z3 — Indicadores clave. Máximo 4 tarjetas, cada una con contexto (DSH-P5). */
@Component({
  selector: 'app-widget-kpis',
  standalone: true,
  imports: [ZonaPanelComponent, KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-zona-panel
      titulo="Indicadores clave"
      icono="insights"
      [cargando]="cargando()"
      [error]="error()"
      [vacio]="!cargando() && !error() && indicadores().length === 0"
      mensajeVacio="Todavía no hay indicadores definidos para tu perfil."
      (reintentar)="cargar()"
    >
      <div class="kpis">
        @for (indicador of indicadores(); track indicador.id) {
          <app-kpi-card [indicador]="indicador" [corte]="corte()" />
        }
      </div>
    </app-zona-panel>
  `,
  styleUrl: './widgets.scss'
})
export class KpisWidget implements OnInit {
  private readonly metricas = inject(DashboardMetricasService);
  private readonly notificacion = inject(NotificacionService);

  readonly rol = input.required<string>();

  readonly indicadores = signal<readonly IndicadorDto[]>([]);
  readonly corte = signal('');
  readonly cargando = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.metricas.obtenerIndicadores(this.rol()).subscribe({
      next: (datos) => {
        // Máximo 4 indicadores por pantalla inicial (DSH-P5).
        this.indicadores.set(datos.indicadores.slice(0, 4));
        this.corte.set(datos.corte);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error('No pudimos cargar los indicadores.');
      }
    });
  }
}
