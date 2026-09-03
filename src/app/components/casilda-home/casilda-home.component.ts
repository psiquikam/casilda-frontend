import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../environments/environment';
import { CasildaCardComponent } from '../casilda-card/casilda-card.component';
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

  readonly cargando = signal(true);
  readonly errorCarga = signal(false);
  private readonly contenidos = signal<ContenidoDestacadoDto[]>([]);

  readonly acciones = computed(() => this.contenidos().filter((c) => c.seccion === 'acciones'));
  readonly informacion = computed(() => this.contenidos().filter((c) => c.seccion === 'informacion'));

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
