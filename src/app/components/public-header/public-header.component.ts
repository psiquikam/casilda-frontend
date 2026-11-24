import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { environment } from '../../../environments/environment';

/**
 * Navegación pública. La consulta de casos no se expone aquí: esa
 * funcionalidad se ofrece únicamente desde una sesión autenticada.
 */
@Component({
  selector: 'app-public-header',
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './public-header.component.html',
  styleUrls: ['./public-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicHeaderComponent {
  /** «Reportar VBG de forma anónima»: oculto mientras el flag esté apagado; la ruta sigue existiendo. */
  readonly mostrarReporteAnonimo = environment.features.reporteAnonimoEnNavPublica;
}
