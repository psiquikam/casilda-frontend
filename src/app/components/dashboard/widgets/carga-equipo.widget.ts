import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';

import { ZonaPanelComponent } from '../zona-panel/zona-panel.component';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { CargaProfesionalDto, DashboardMetricasService } from '../../../services/dashboard-metricas.service';

/**
 * Z4 (Coordinación) — Carga de trabajo del equipo.
 *
 * Aquí el color sí porta un estado (nivel de ocupación), pero nunca va solo:
 * lo acompaña el porcentaje en texto (regla 5 de `CLAUDE.md`). El nivel alto usa
 * ámbar, no rojo: el rojo queda para la salida rápida (DSH-P5).
 */
@Component({
  selector: 'app-widget-carga-equipo',
  standalone: true,
  imports: [DecimalPipe, PercentPipe, ZonaPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-zona-panel
      titulo="Carga del equipo de atención"
      icono="balance"
      descripcion="Casos activos y citas de hoy por profesional."
      [cargando]="cargando()"
      [error]="error()"
      [vacio]="!cargando() && !error() && carga().length === 0"
      mensajeVacio="Todavía no hay profesionales con casos asignados."
      accionTexto="Ir al reparto"
      accionRuta="/consulta"
      (reintentar)="cargar()"
    >
      <table class="tabla" aria-label="Carga de trabajo por profesional">
        <thead>
          <tr>
            <th scope="col">Profesional</th>
            <th scope="col">Casos</th>
            <th scope="col">Citas hoy</th>
            <th scope="col">Ocupación</th>
          </tr>
        </thead>
        <tbody>
          @for (persona of carga(); track persona.profesional) {
            <tr>
              <th scope="row">{{ persona.profesional }}</th>
              <td>{{ persona.casos | number }}</td>
              <td>{{ persona.citasHoy | number }}</td>
              <td>
                <span class="ocupacion">
                  <span class="ocupacion__pista" aria-hidden="true">
                    <span class="ocupacion__barra" [class]="'ocupacion__barra--' + persona.nivel"
                          [style.width.%]="persona.ocupacion * 100"></span>
                  </span>
                  <span class="ocupacion__cifra">{{ persona.ocupacion | percent }}</span>
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </app-zona-panel>
  `,
  styleUrl: './widgets.scss'
})
export class CargaEquipoWidget implements OnInit {
  private readonly metricas = inject(DashboardMetricasService);
  private readonly notificacion = inject(NotificacionService);

  readonly carga = signal<readonly CargaProfesionalDto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.metricas.obtenerCargaEquipo().subscribe({
      next: (carga) => {
        this.carga.set(carga);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error('No pudimos cargar la carga del equipo.');
      }
    });
  }
}
