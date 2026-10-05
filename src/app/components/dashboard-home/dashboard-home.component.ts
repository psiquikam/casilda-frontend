import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PanelInicioComponent } from '../dashboard/panel-inicio.component';
import { PanelUsuarioComponent } from '../dashboard-usuario/panel-usuario.component';

/**
 * Punto de entrada de `/inicio`.
 *
 * Reparte entre dos vistas y **no contiene lógica de panel**: el personal usa
 * `PanelInicioComponent`, que se arma por zonas desde `DASHBOARD_POR_ROL`
 * (Subfase 2); el rol Usuario conserva su vista actual hasta la Subfase 4, que
 * la rediseña con enfoque informado en trauma.
 *
 * Hasta la Subfase 2 este componente concentraba las cinco vistas de rol, los
 * mocks de todos los indicadores y un catálogo de 13 módulos que duplicaba el
 * menú lateral (DSH-04-01). Todo eso salió de aquí.
 */
@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [PanelInicioComponent, PanelUsuarioComponent],
  templateUrl: './dashboard-home.component.html'
})
export class DashboardHomeComponent {
  readonly auth = inject(AuthService);
}
