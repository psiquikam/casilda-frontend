import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../services/auth.service';
import { PanelInicioComponent } from '../dashboard/panel-inicio.component';
import { esTelefonoPublicable } from '../../core/security/telefono-crisis';
import { environment } from '../../../environments/environment';

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
  imports: [RouterLink, MatIconModule, PanelInicioComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent {
  readonly auth = inject(AuthService);
  readonly features = environment.features;
  readonly telefonoOrientacion = environment.telefonoOrientacion;

  /**
   * La línea de orientación solo se muestra si hay un número real configurado.
   * Un número de relleno en contenido de crisis puede impedir que una persona
   * en riesgo reciba ayuda (DSH-05-01).
   */
  get hayLineaOrientacion(): boolean {
    return esTelefonoPublicable(this.telefonoOrientacion);
  }

  /**
   * Solicitudes de la persona autenticada.
   *
   * TODO(Subfase 4): sustituir por un servicio con DTO y endpoint previsto,
   * como el resto del panel. Se deja el mock aquí porque esta vista se reescribe
   * completa y moverlo ahora sería trabajo desechable.
   */
  readonly misSolicitudesUsuario = [
    {
      radicado: 'CAS-2026-081',
      fecha: '12 de marzo de 2026',
      tipo: 'Acompañamiento Psicosocial',
      estado: 'En Atención Activa',
      estadoClass: 'activo',
      proximaCita: 'Viernes 20 de marzo, 10:00 AM (Presencial - Bloque 22)',
      profesional: 'Lic. Carlos Restrepo'
    },
    {
      radicado: 'CAS-2026-045',
      fecha: '18 de febrero de 2026',
      tipo: 'Asesoría Jurídica',
      estado: 'Finalizado con Acuerdos',
      estadoClass: 'finalizado',
      proximaCita: null,
      profesional: 'Dra. María Carmona'
    }
  ];
}
