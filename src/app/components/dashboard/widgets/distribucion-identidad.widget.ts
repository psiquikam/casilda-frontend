import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';

import { ZonaPanelComponent } from '../zona-panel/zona-panel.component';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { DashboardMetricasService, DistribucionIdentidadDto } from '../../../services/dashboard-metricas.service';

/**
 * Z4 (perfiles analíticos) — Distribución por identidad de género.
 *
 * El significado **nunca** depende del color: cada grupo lleva etiqueta y cifra
 * en texto, y la tabla es la representación primaria, no una alternativa
 * escondida (DSH-03-03, DSH-09-02). La barra es decorativa y queda oculta a los
 * lectores de pantalla.
 *
 * **[PENDIENTE P-03]** Paleta `--color-data-*`. Mientras tanto las series usan
 * los alias complementarios oficiales, asignados por orden y no por categoría,
 * para no reproducir el estereotipo rosa/azul (DSH-03-01).
 */
@Component({
  selector: 'app-widget-distribucion-identidad',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, ZonaPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-zona-panel
      titulo="Distribución por identidad de género"
      icono="diversity_1"
      [descripcion]="descripcion()"
      [cargando]="cargando()"
      [error]="error()"
      [vacio]="!cargando() && !error() && !distribucion()"
      mensajeVacio="Todavía no hay casos suficientes para mostrar la distribución."
      accionTexto="Ver panel completo"
      accionRuta="/dashboard-revisor"
      (reintentar)="cargar()"
    >
      @if (distribucion(); as datos) {
        <div class="barra" aria-hidden="true">
          @for (grupo of datos.grupos; track grupo.etiqueta; let i = $index) {
            <span class="barra__tramo" [class]="'barra__tramo--' + (i + 1)"
                  [style.width.%]="grupo.proporcion * 100"></span>
          }
        </div>

        <table class="tabla" aria-label="Casos activos por identidad de género">
          <thead>
            <tr>
              <th scope="col">Identidad de género</th>
              <th scope="col">Casos</th>
              <th scope="col">Proporción</th>
            </tr>
          </thead>
          <tbody>
            @for (grupo of datos.grupos; track grupo.etiqueta; let i = $index) {
              <tr>
                <th scope="row">
                  <span class="tabla__punto" [class]="'tabla__punto--' + (i + 1)" aria-hidden="true"></span>
                  {{ grupo.etiqueta }}
                </th>
                <td>{{ grupo.casos | number }}</td>
                <td>{{ grupo.proporcion | percent:'1.0-1' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </app-zona-panel>
  `,
  styleUrl: './widgets.scss'
})
export class DistribucionIdentidadWidget implements OnInit {
  private readonly metricas = inject(DashboardMetricasService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fecha = new DatePipe('es-CO');

  readonly distribucion = signal<DistribucionIdentidadDto | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);

  descripcion(): string {
    const datos = this.distribucion();
    if (!datos) return '';
    return `${datos.total} casos activos · corte ${this.fecha.transform(datos.corte, 'd MMM, h:mm a')}`;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.metricas.obtenerDistribucionIdentidad().subscribe({
      next: (datos) => {
        this.distribucion.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error('No pudimos cargar la distribución por identidad de género.');
      }
    });
  }
}
