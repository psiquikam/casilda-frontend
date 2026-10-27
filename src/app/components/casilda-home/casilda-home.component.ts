import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../environments/environment';
import { CasildaCardComponent } from '../casilda-card/casilda-card.component';
import { esTelefonoPublicable } from '../../core/security/telefono-crisis';
import { SECCIONES_CONTENIDO } from '../../core/contenidos/catalogo-contenidos';
import { ContenidoDestacadoDto, ContenidoHomeService } from '../../services/contenido-home.service';

/**
 * Landing pública de Casilda. La página no contiene textos de negocio
 * quemados: las tarjetas de opción se alimentan del gestor de contenidos
 * (`ContenidoHomeService`), de modo que puedan actualizarse sin desplegar.
 */
@Component({
  selector: 'app-casilda-home',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule, CasildaCardComponent],
  templateUrl: './casilda-home.component.html',
  styleUrls: ['./casilda-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CasildaHomeComponent implements OnInit {
  private readonly contenidoHome = inject(ContenidoHomeService);

  readonly telefonoOrientacion = environment.telefonoOrientacion;

  /**
   * El llamado a orientación telefónica solo se ofrece si hay un número real.
   * Un `tel:` vacío o con un número de relleno en un botón rotulado
   * «de emergencia» es peor que no ofrecer el canal (DSH-05-01).
   */
  get hayLineaOrientacion(): boolean {
    return esTelefonoPublicable(this.telefonoOrientacion);
  }

  readonly cargando = signal(true);
  readonly errorCarga = signal(false);
  private readonly contenidos = signal<ContenidoDestacadoDto[]>([]);

  /**
   * Bloques de la portada en el orden del catálogo, cada uno con sus tarjetas en
   * el orden en que llegan del backend. Un bloque sin tarjetas no se pinta.
   * Los títulos salen de `SECCIONES_CONTENIDO`, el mismo catálogo que usa el
   * módulo de gestión, para que quien edita lea los mismos nombres que la portada.
   */
  readonly secciones = computed(() =>
    SECCIONES_CONTENIDO.map((seccion) => ({
      ...seccion,
      items: this.contenidos().filter((c) => c.seccion === seccion.valor)
    })).filter((seccion) => seccion.items.length > 0)
  );

  ngOnInit(): void {
    this.cargarContenido();
  }

  cargarContenido(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);

    this.contenidoHome.listarContenidoVigente().subscribe({
      next: (contenidos) => {
        this.contenidos.set(contenidos);
        this.cargando.set(false);
      },
      error: () => {
        this.contenidos.set([]);
        this.errorCarga.set(true);
        this.cargando.set(false);
      }
    });
  }
}
