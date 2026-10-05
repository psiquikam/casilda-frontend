import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ZonaPanelComponent } from '../zona-panel/zona-panel.component';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import { ETIQUETA_SUPRIMIDA, UMBRAL_SUPRESION } from '../../../core/vigilancia/supresion-celdas';
import {
  CatalogosVigilancia,
  FILTROS_POR_DEFECTO,
  FiltrosVigilancia,
  VigilanciaDto,
  VigilanciaService
} from '../../../services/vigilancia.service';

/**
 * Z4 del perfil analítico — Vigilancia con enfoque diferencial y filtros
 * (§4.5 del contrato).
 *
 * La **tabla es la representación primaria**, no una alternativa escondida: el
 * significado nunca depende del color (DSH-03-03, DSH-09-02). La barra es
 * decorativa y queda fuera del árbol de accesibilidad.
 *
 * Los conteos demasiado pequeños llegan ya suprimidos desde el servicio
 * (DSH-03-04, DSH-09-01); aquí solo se muestran como tales y se explica por qué.
 */
@Component({
  selector: 'app-widget-vigilancia',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PercentPipe, FormsModule, MatIconModule, ZonaPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vigilancia.widget.html',
  styleUrl: './widgets.scss'
})
export class VigilanciaWidget implements OnInit {
  private readonly vigilancia = inject(VigilanciaService);
  private readonly notificacion = inject(NotificacionService);

  readonly etiquetaSuprimida = ETIQUETA_SUPRIMIDA;
  readonly umbralSupresion = UMBRAL_SUPRESION;

  readonly catalogos = signal<CatalogosVigilancia | null>(null);
  readonly datos = signal<VigilanciaDto | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);

  filtros: FiltrosVigilancia = { ...FILTROS_POR_DEFECTO };

  ngOnInit(): void {
    this.vigilancia.obtenerCatalogos().subscribe({
      next: (catalogos) => this.catalogos.set(catalogos),
      error: () => this.notificacion.error('No pudimos cargar los filtros de vigilancia.')
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);
    this.vigilancia.obtenerDistribucion(this.filtros).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.notificacion.error('No pudimos cargar la distribución de vigilancia.');
      }
    });
  }

  /** Recarga al cambiar cualquier filtro. */
  alCambiarFiltro(): void {
    this.cargar();
  }
}
