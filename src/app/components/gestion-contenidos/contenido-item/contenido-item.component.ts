import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '../../../../environments/environment';
import { IMAGEN_RESPALDO, etiquetaDestino } from '../../../core/contenidos/catalogo-contenidos';
import { esEnlaceInterno, resolverImagenContenido, type EstadoVigencia } from '../../../core/contenidos/reglas-contenido';
import type { ContenidoAdminDto } from '../../../services/contenido-admin.service';
import { EstadoVigenciaComponent } from '../estado-vigencia/estado-vigencia.component';

/**
 * Fila del listado de contenidos: lo que la persona necesita para decidir sin
 * abrir el contenido —cómo se ve, si está publicado, hasta cuándo, a dónde lleva
 * y quién lo tocó por última vez—.
 *
 * Presentacional: no llama servicios. «Editar» es un enlace (cambia de vista) y
 * «Eliminar» un botón que solo avisa al padre, que confirma y elimina.
 */
@Component({
  selector: 'app-contenido-item',
  imports: [DatePipe, RouterLink, MatIconModule, EstadoVigenciaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contenido-item.component.html',
  styleUrl: './contenido-item.component.scss'
})
export class ContenidoItemComponent {
  readonly contenido = input.required<ContenidoAdminDto>();
  readonly estado = input.required<EstadoVigencia>();
  /** Deshabilita «Eliminar» mientras la petición está en curso. */
  readonly eliminando = input(false);

  readonly eliminar = output<ContenidoAdminDto>();

  private readonly imagenFallida = signal(false);

  readonly imagenUrl = computed(() =>
    this.imagenFallida() ? IMAGEN_RESPALDO : resolverImagenContenido(this.contenido().imagen, environment.apiBaseUrl)
  );

  readonly tieneEnlace = computed(() => esEnlaceInterno(this.contenido().enlace));

  readonly destino = computed(() =>
    this.tieneEnlace() ? `Lleva a: ${etiquetaDestino(this.contenido().enlace)}` : 'Tarjeta informativa, sin enlace'
  );

  /** Quién y cuándo, para la trazabilidad que exige el contrato (§8). */
  readonly ultimaEdicion = computed(() => {
    const { modifiedAt, modifiedBy, createdAt, createdBy } = this.contenido();
    return { fecha: modifiedAt ?? createdAt ?? null, autor: modifiedBy ?? createdBy ?? null };
  });

  alFallarImagen(): void {
    this.imagenFallida.set(true);
  }
}
