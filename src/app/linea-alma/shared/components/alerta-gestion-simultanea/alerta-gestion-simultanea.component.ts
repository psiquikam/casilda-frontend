import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * `AlertaGestionSimultanea` — el caso tiene actuaciones activas en **Equipo de Atención** y en
 * **Línea Alma** al mismo tiempo (J-1.8, levantamiento §10). Dueño: Jonathan; la usan ambos
 * submódulos (detalle APH, novedad y expediente).
 *
 * Solo informa: la coordinación entre equipos es una decisión de las personas. La fuente es el
 * campo `gestionSimultanea` del DTO (Q15, mock hasta que exista el módulo EA).
 */
@Component({
  selector: 'app-alerta-gestion-simultanea',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (activa()) {
      <p class="casilda-alerta casilda-alerta--precaucion" role="status">
        <mat-icon aria-hidden="true">sync_alt</mat-icon>
        <span>
          <strong>Gestión en simultáneo.</strong>
          @if (numeroCaso(); as n) {
            El caso {{ n }} tiene actuaciones activas en Equipo de Atención y en Línea Alma.
          } @else {
            Este caso tiene actuaciones activas en Equipo de Atención y en Línea Alma.
          }
          Antes de acordar algo con la persona, coordine con el otro equipo para no duplicar acciones.
        </span>
      </p>
    }
  `
})
export class AlertaGestionSimultaneaComponent {
  readonly activa = input.required<boolean>();
  readonly numeroCaso = input<string | null>(null);
}
