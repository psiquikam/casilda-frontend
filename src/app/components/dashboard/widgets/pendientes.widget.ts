import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ZonaPanelComponent } from '../zona-panel/zona-panel.component';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { DashboardTrabajoService, PendienteDto } from '../../../services/dashboard-trabajo.service';

/**
 * Z2 — Atención requerida. Va **antes** que los indicadores: lo accionable
 * precede a lo informativo (DSH-P1, DSH-07-01).
 *
 * Máximo 5 ítems; identifica por radicado e iniciales, nunca por nombre
 * completo (DSH-P6, DSH-08-02).
 */
@Component({
  selector: 'app-widget-pendientes',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, ZonaPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-zona-panel
      titulo="Atención requerida"
      icono="assignment_late"
      descripcion="Lo que necesita una decisión tuya hoy."
      mensajeVacio="No tienes pendientes para hoy."
      [cargando]="cargando()"
      [error]="error()"
      [vacio]="!cargando() && !error() && pendientes().length === 0"
      (reintentar)="cargar()"
    >
      <ul class="lista">
        @for (pendiente of pendientes(); track pendiente.id) {
          <li class="lista__item">
            <div class="lista__texto">
              <span class="lista__descripcion">{{ pendiente.descripcion }}</span>
              <span class="lista__meta">
                @if (pendiente.radicado !== '—') {
                  <span class="lista__radicado">{{ pendiente.radicado }}</span>
                  <span>·</span>
                  <span>{{ pendiente.iniciales }}</span>
                  <span>·</span>
                }
                <span>{{ pendiente.vence | date:'d MMM' }}</span>
              </span>
            </div>
            <a class="lista__accion" [routerLink]="pendiente.ruta">
              <span>Abrir</span>
              <mat-icon aria-hidden="true">arrow_forward</mat-icon>
            </a>
          </li>
        }
      </ul>
    </app-zona-panel>
  `,
  styleUrl: './widgets.scss'
})
export class PendientesWidget implements OnInit {
  private readonly trabajo = inject(DashboardTrabajoService);
  private readonly notificacion = inject(NotificacionService);

  readonly rol = input.required<string>();

  readonly pendientes = signal<readonly PendienteDto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.trabajo.obtenerPendientes(this.rol()).subscribe({
      next: (pendientes) => {
        this.pendientes.set(pendientes.slice(0, 5));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error('No pudimos cargar tus pendientes.');
      }
    });
  }
}
