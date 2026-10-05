import { Component } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { esTelefonoPublicable } from '../../core/security/telefono-crisis';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-public-footer',
    imports: [MatIconModule],
    templateUrl: './public-footer.component.html',
    styleUrls: ['./public-footer.component.scss']
})
export class PublicFooterComponent {
  /** Teléfono de contacto del pie, servido por entorno (nunca quemado). */
  readonly telefonoContacto = environment.telefonoContactoPublico;

  /**
   * El pie es la primera referencia de contacto para quien aún no inició
   * sesión: si el número no es real, no se muestra (mismo criterio que
   * DSH-05-01 para la línea de orientación).
   */
  get hayTelefonoContacto(): boolean {
    return esTelefonoPublicable(this.telefonoContacto);
  }
}
