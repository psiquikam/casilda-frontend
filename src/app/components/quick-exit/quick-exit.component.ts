import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { QuickExitService } from '../../core/security/quick-exit.service';

/** Ventana máxima (ms) entre dos pulsaciones de Escape para disparar la salida. */
const VENTANA_DOBLE_ESCAPE_MS = 1000;

/**
 * Botón flotante de **Salida Rápida**. Visible de forma permanente en toda la
 * aplicación: permite abandonar Casilda al instante si la persona está en
 * riesgo de ser descubierta mientras consulta o redacta información sensible.
 *
 * Activación: clic, `Alt + Q`, o doble pulsación de `Escape` en menos de 1 s.
 */
@Component({
  selector: 'app-quick-exit',
  imports: [MatIconModule],
  templateUrl: './quick-exit.component.html',
  styleUrls: ['./quick-exit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickExitComponent {
  private readonly quickExit = inject(QuickExitService);
  private ultimoEscape = 0;

  salir(): void {
    this.quickExit.ejecutar();
  }

  @HostListener('document:keydown', ['$event'])
  manejarAtajo(evento: KeyboardEvent): void {
    if (evento.altKey && evento.key.toLowerCase() === 'q') {
      evento.preventDefault();
      this.salir();
      return;
    }

    if (evento.key === 'Escape') {
      const ahora = Date.now();
      if (ahora - this.ultimoEscape < VENTANA_DOBLE_ESCAPE_MS) {
        evento.preventDefault();
        this.ultimoEscape = 0;
        this.salir();
        return;
      }
      this.ultimoEscape = ahora;
    }
  }
}
