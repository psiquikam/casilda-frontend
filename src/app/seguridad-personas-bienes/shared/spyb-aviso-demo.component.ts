import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

/** `true` si algún servicio de SPyB está simulado en este entorno. */
export function spybConDatosSimulados(mocks: Record<string, boolean>): boolean {
  return Object.values(mocks).some(Boolean);
}

/** Aviso «Datos de demostración» de las pantallas de SPyB. Sin simulación no dibuja nada. */
@Component({
  selector: 'app-spyb-aviso-demo',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <p class="casilda-alerta casilda-alerta--precaucion" role="note">
        <mat-icon aria-hidden="true">science</mat-icon>
        <span><strong>Datos de demostración.</strong> Los servicios de Seguridad a personas y bienes están simulados.</span>
      </p>
    }
  `,
  styles: `:host { display: block; }`
})
export class SpybAvisoDemoComponent {
  readonly visible = spybConDatosSimulados(environment.seguridadPyB.mocks);
}
