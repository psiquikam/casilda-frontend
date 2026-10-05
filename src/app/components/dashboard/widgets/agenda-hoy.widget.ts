import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ZonaPanelComponent } from '../zona-panel/zona-panel.component';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { CitaAgendaDto, DashboardTrabajoService } from '../../../services/dashboard-trabajo.service';

/**
 * Z4 (Profesional) — Agenda del día.
 *
 * Muestra radicado e iniciales, no nombres: el panel se consulta a menudo en
 * espacios compartidos (DSH-08-02).
 */
@Component({
  selector: 'app-widget-agenda-hoy',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, ZonaPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-zona-panel
      titulo="Tu agenda de hoy"
      icono="event_available"
      [cargando]="cargando()"
      [error]="error()"
      [vacio]="!cargando() && !error() && citas().length === 0"
      mensajeVacio="No tienes citas agendadas para hoy."
      accionTexto="Gestionar agenda"
      accionRuta="/cita"
      (reintentar)="cargar()"
    >
      <table class="tabla" aria-label="Citas agendadas para hoy">
        <thead>
          <tr>
            <th scope="col">Hora</th>
            <th scope="col">Radicado</th>
            <th scope="col">Atención</th>
            <th scope="col">Modalidad</th>
            <th scope="col"><span class="visually-hidden">Acción</span></th>
          </tr>
        </thead>
        <tbody>
          @for (cita of citas(); track cita.id) {
            <tr>
              <th scope="row">{{ cita.inicio | date:'h:mm a' }}</th>
              <td>
                <span class="tabla__radicado">{{ cita.radicado }}</span>
                <span class="tabla__iniciales">{{ cita.iniciales }}</span>
              </td>
              <td>{{ cita.tipo }}</td>
              <td>{{ cita.modalidad }}</td>
              <td>
                <a class="lista__accion" [routerLink]="cita.ruta">
                  <span>Atender</span>
                  <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                </a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </app-zona-panel>
  `,
  styleUrl: './widgets.scss'
})
export class AgendaHoyWidget implements OnInit {
  private readonly trabajo = inject(DashboardTrabajoService);
  private readonly notificacion = inject(NotificacionService);

  readonly citas = signal<readonly CitaAgendaDto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.trabajo.obtenerAgendaDeHoy().subscribe({
      next: (citas) => {
        this.citas.set(citas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error('No pudimos cargar tu agenda de hoy.');
      }
    });
  }
}
