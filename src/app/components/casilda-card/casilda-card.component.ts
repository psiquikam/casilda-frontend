import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { IMAGEN_RESPALDO } from '../../core/contenidos/catalogo-contenidos';
import { esEnlaceInterno, resolverImagenContenido } from '../../core/contenidos/reglas-contenido';
import { ContenidoDestacadoDto } from '../../services/contenido-home.service';

/**
 * Tarjeta de opción del Home. Es puramente presentacional: todo su contenido
 * (imagen, título y texto) proviene del gestor de contenidos, nunca del código.
 *
 * Si el contenido trae un `enlace` interno válido se renderiza como enlace
 * navegable; si no, como tarjeta informativa (sin foco ni semántica de acción).
 *
 * El módulo `/gestion-contenidos` la reutiliza como vista previa (`vistaPrevia`)
 * para que quien edita vea exactamente lo que verá la portada.
 */
@Component({
  selector: 'app-casilda-card',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './casilda-card.component.html',
  styleUrls: ['./casilda-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CasildaCardComponent {
  readonly contenido = input.required<ContenidoDestacadoDto>();
  /**
   * En la vista previa la tarjeta conserva el aspecto de acción pero no navega:
   * un clic accidental no debe sacar a nadie del formulario que está editando.
   */
  readonly vistaPrevia = input(false);

  /** La imagen del backend no cargó (borrada, 404, CORS): se usa el respaldo. */
  private readonly imagenFallida = signal<string | null>(null);

  readonly esNavegable = computed(() => esEnlaceInterno(this.contenido().enlace));

  readonly imagenUrl = computed(() => {
    const url = resolverImagenContenido(this.contenido().imagen, environment.apiBaseUrl);
    return url === this.imagenFallida() ? IMAGEN_RESPALDO : url;
  });

  alFallarImagen(): void {
    const url = this.imagenUrl();
    // Evita un ciclo de error si el respaldo tampoco carga.
    if (url !== IMAGEN_RESPALDO) this.imagenFallida.set(url);
  }
}
