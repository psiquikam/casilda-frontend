import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadoRegistroSeguridad } from '../models/spyb-catalogos';

@Component({
  selector: 'app-spyb-estado-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="estado-badge" [ngClass]="claseEstado">
      {{ etiquetaEstado }}
    </span>
  `,
  styles: [`
    .estado-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    .estado-nuevo {
      background-color: var(--color-bg-info-light, #e0f2fe);
      color: var(--color-info, #137598);
      border: 1px solid var(--color-comp-blue-border, rgba(19, 117, 152, 0.28));
    }
    .estado-en-revision {
      background-color: var(--color-bg-warning-light, #fef3c7);
      color: var(--color-warning, #d97706);
      border: 1px solid rgba(217, 119, 6, 0.28);
    }
    .estado-subsanacion {
      background-color: var(--color-danger-tint, rgba(239, 67, 77, 0.08));
      color: var(--color-danger-text, #b3141f);
      border: 1px solid var(--color-comp-red-border, rgba(239, 67, 77, 0.28));
    }
    .estado-pendiente-vinculacion {
      background-color: var(--color-comp-purple-light, rgba(112, 32, 91, 0.08));
      color: var(--color-comp-purple, #70205b);
      border: 1px solid var(--color-comp-purple-border, rgba(112, 32, 91, 0.28));
    }
    .estado-vinculado {
      background-color: var(--color-primary-tint, rgba(2, 105, 55, 0.08));
      color: var(--color-primary, #026937);
      border: 1px solid var(--color-primary-border, rgba(2, 105, 55, 0.25));
    }
    .estado-independiente {
      background-color: var(--color-bg-surface-alt, #f8fafc);
      color: var(--color-text-secondary, #475569);
      border: 1px solid var(--color-border, #e2e8f0);
    }
    .estado-cerrado {
      background-color: var(--color-bg-surface-alt, #f1f5f9);
      color: var(--color-text-muted, #64748b);
      border: 1px solid var(--color-border, #cbd5e1);
    }
  `]
})
export class SpybEstadoBadgeComponent {
  @Input({ required: true }) estado!: EstadoRegistroSeguridad | string;

  get claseEstado(): string {
    switch (this.estado) {
      case 'NUEVO':
        return 'estado-nuevo';
      case 'EN_REVISION':
        return 'estado-en-revision';
      case 'SUBSANACION_REQUERIDA':
        return 'estado-subsanacion';
      case 'PENDIENTE_VINCULACION':
        return 'estado-pendiente-vinculacion';
      case 'VINCULADO_CASO':
        return 'estado-vinculado';
      case 'ACTUACION_INDEPENDIENTE':
        return 'estado-independiente';
      case 'CERRADO':
        return 'estado-cerrado';
      default:
        return 'estado-nuevo';
    }
  }

  get etiquetaEstado(): string {
    switch (this.estado) {
      case 'NUEVO':
        return 'Nuevo';
      case 'EN_REVISION':
        return 'En revisión';
      case 'SUBSANACION_REQUERIDA':
        return 'Subsanación requerida';
      case 'PENDIENTE_VINCULACION':
        return 'Pendiente vinculación';
      case 'VINCULADO_CASO':
        return 'Vinculado a caso';
      case 'ACTUACION_INDEPENDIENTE':
        return 'Actuación independiente';
      case 'CERRADO':
        return 'Cerrado';
      default:
        return String(this.estado);
    }
  }
}

