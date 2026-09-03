import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContenidoDestacadoDto } from '../../services/contenido-home.service';

/**
 * Tarjeta de opción del Home. Es puramente presentacional: todo su contenido
 * (imagen, título y texto) proviene del gestor de contenidos, nunca del código.
 *
 * Si el contenido trae `enlace` se renderiza como enlace navegable; si no,
 * como tarjeta informativa (sin foco ni semántica de acción).
 */
@Component({
  selector: 'app-casilda-card',
  imports: [RouterLink],
  templateUrl: './casilda-card.component.html',
  styleUrls: ['./casilda-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CasildaCardComponent {
  readonly contenido = input.required<ContenidoDestacadoDto>();

  readonly esNavegable = computed(() => !!this.contenido().enlace);
}
