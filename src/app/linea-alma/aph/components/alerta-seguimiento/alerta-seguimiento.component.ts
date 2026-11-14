import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { ConsultaPersonaVista } from '../../services/personas-alma.service';

/**
 * Resultado de la consulta previa por documento (H-1.1, `RF-ALMA-003`, `RN-ALMA-06`).
 *
 * - **Seguimiento psicológico activo:** banner informativo con la fecha del próximo seguimiento
 *   y la profesional a cargo. **Nada clínico** (RNF-ALMA-002). El aviso a Psicología lo envía el
 *   sistema; aquí solo se informa. La alerta **no vincula**: una llamada nueva siempre genera una
 *   atención `ALMA-…` nueva y la decisión de vincularla es solo de Psicología.
 * - **Caso cerrado:** habilita el camino de contención post-cierre (H-1.7).
 */
@Component({
  selector: 'app-alerta-seguimiento',
  imports: [DatePipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alerta" aria-live="polite">
      @if (!consulta().existe) {
        <p class="casilda-alerta">
          <mat-icon aria-hidden="true">person_search</mat-icon>
          <span>No encontramos atenciones previas de esta persona. Puede continuar con el registro.</span>
        </p>
      } @else {
        <p class="casilda-alerta casilda-alerta--exito">
          <mat-icon aria-hidden="true">history</mat-icon>
          <span>
            La persona ya tiene historial en Línea Alma@if (consulta().nombreCompleto) { : <strong>{{ consulta().nombreCompleto }}</strong> }.
            Esta llamada se registrará como una <strong>atención nueva</strong>.
          </span>
        </p>
      }

      @if (consulta().seguimientoActivo; as seguimiento) {
        @if (permisos.tiene('alma.alertaSeguimiento.consultar')) {
          <div class="casilda-alerta casilda-alerta--precaucion" role="status">
            <mat-icon aria-hidden="true">event_available</mat-icon>
            <div>
              <p class="alerta__titulo">Esta persona tiene un seguimiento psicológico activo.</p>
              <ul class="alerta__datos">
                <li>
                  <strong>Próximo seguimiento:</strong>
                  @if (seguimiento.proximoSeguimiento) { {{ seguimiento.proximoSeguimiento | date: "EEEE d 'de' MMMM, h:mm a" }} } @else { sin fecha programada }
                </li>
                <li><strong>Profesional a cargo:</strong> {{ seguimiento.profesional ?? 'sin información' }}</li>
              </ul>
              <p class="alerta__nota">
                El sistema avisa a Psicología de esta llamada. Usted no necesita vincularla: la decisión de
                unirla al caso la toma Psicología.
              </p>
            </div>
          </div>
        }
      }

      @if (consulta().casoCerrado; as caso) {
        <div class="casilda-alerta" role="status">
          <mat-icon aria-hidden="true">inventory_2</mat-icon>
          <div>
            <p class="alerta__titulo">
              La persona tiene un caso cerrado ({{ caso.numeroCaso }}, {{ caso.fechaCierre | date: 'd MMM y' }}).
            </p>
            <p class="alerta__nota">
              Si solo necesita contención, registre la atención y use «Contención después del cierre»: no reabre el caso.
            </p>
            @if (permitirContencion()) {
              <button type="button" class="boton boton--secundario" (click)="contencion.emit(caso.numeroCaso)">
                Registrar contención después del cierre
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .alerta { display: flex; flex-direction: column; gap: var(--space-3); }
    .alerta p { margin: 0; }
    .alerta__titulo { font-weight: 700; }
    .alerta__datos { margin: var(--space-2) 0; padding-left: var(--space-5); }
    .alerta__nota { color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-2) !important; }
  `
})
export class AlertaSeguimientoComponent {
  protected readonly permisos = inject(AlmaPermisosService);

  readonly consulta = input.required<ConsultaPersonaVista>();
  readonly permitirContencion = input(true);
  /** Se emite con el número del caso cerrado cuando la persona elige registrar contención. */
  readonly contencion = output<string>();
}
