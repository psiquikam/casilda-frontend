import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Envoltura de una zona del panel de inicio: aporta el encabezado `h2` y los
 * tres estados que toda zona debe tener —carga, vacío y error— para que ninguna
 * zona quede en blanco sin explicación (DSH-07-02, DSH-07-04).
 *
 * El contenido se proyecta; cada widget solo decide sus datos, no su chrome.
 */
@Component({
  selector: 'app-zona-panel',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zona-panel.component.html',
  styleUrl: './zona-panel.component.scss'
})
export class ZonaPanelComponent {
  /** Encabezado de la zona. Es un `h2`: un `h1` por vista (DSH-11-09). */
  readonly titulo = input.required<string>();
  readonly icono = input<string>();
  /** Texto de apoyo bajo el título. */
  readonly descripcion = input<string>();

  readonly cargando = input(false);
  readonly error = input(false);
  /** `true` cuando no hay datos que mostrar y no hay error. */
  readonly vacio = input(false);
  /** Mensaje del estado vacío. Amable y concreto, nunca un espacio en blanco. */
  readonly mensajeVacio = input('Por ahora no hay nada aquí.');

  /** Enlace opcional de la esquina superior derecha. */
  readonly accionTexto = input<string>();
  readonly accionRuta = input<string>();

  readonly reintentar = output<void>();
}
