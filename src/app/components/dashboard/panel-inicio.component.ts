import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { widgetsDelRol, type WidgetId } from '../../core/dashboard/dashboard-por-rol';
import { PendientesWidget } from './widgets/pendientes.widget';
import { KpisWidget } from './widgets/kpis.widget';
import { DistribucionIdentidadWidget } from './widgets/distribucion-identidad.widget';
import { VigilanciaWidget } from './widgets/vigilancia.widget';
import { AgendaHoyWidget } from './widgets/agenda-hoy.widget';
import { CargaEquipoWidget } from './widgets/carga-equipo.widget';
import { AccesosFrecuentesWidget } from './widgets/accesos-frecuentes.widget';
import { AyudaProtocolosWidget } from './widgets/ayuda-protocolos.widget';

/**
 * Panel de inicio del personal, armado por zonas (§3 del contrato):
 *
 * - **Z1** Saludo compacto y fecha.
 * - **Z2** Atención requerida — lo accionable va primero (DSH-P1).
 * - **Z3** Indicadores clave, máximo 4.
 * - **Z4** Vista principal: una visualización o una agenda, según el rol.
 * - **Z5** Accesos frecuentes, máximo 4.
 * - **Z6** Ayuda y protocolos, colapsable.
 *
 * El contenido de cada rol **no se decide aquí**: lo define el registro
 * `DASHBOARD_POR_ROL`, de modo que no hay condicionales por rol dispersos en la
 * plantilla (DSH-12-02). Cada widget obtiene sus propios datos de un servicio,
 * no por `@Input` (DSH-12-03).
 */
@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    PendientesWidget,
    KpisWidget,
    DistribucionIdentidadWidget,
    VigilanciaWidget,
    AgendaHoyWidget,
    CargaEquipoWidget,
    AccesosFrecuentesWidget,
    AyudaProtocolosWidget
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-inicio.component.html',
  styleUrl: './panel-inicio.component.scss'
})
export class PanelInicioComponent {
  private readonly auth = inject(AuthService);

  readonly hoy = new Date();
  readonly datosDemostracion = environment.datosDemostracion;

  /**
   * El rol se resuelve una sola vez, al construirse.
   *
   * `AuthService.currentUser` es una propiedad plana, no una señal, así que un
   * `computed()` sobre ella nunca se recalcularía. Y no hace falta que lo haga:
   * cambiar de rol pasa por `loginAsMock()`, que navega a `/inicio` y vuelve a
   * crear este componente.
   */
  readonly rol = this.auth.getRoleCode();
  readonly esAdmin = this.auth.isAdmin();
  readonly widgets: readonly WidgetId[] = widgetsDelRol(this.rol);

  /**
   * Nombre de pila, para que el saludo no compita con el contenido.
   *
   * Salta el tratamiento profesional: con «Dra. Elena Ramos» el saludo decía
   * «Hola, Dra.». Si el nombre es solo un tratamiento, se devuelve completo.
   */
  readonly nombreCorto = this.calcularNombreCorto();

  private calcularNombreCorto(): string {
    const tratamientos = ['dr', 'dra', 'lic', 'licda', 'psic', 'ing', 'mg', 'esp', 'prof', 'sr', 'sra'];
    const partes = (this.auth.currentUser?.nombre ?? '').trim().split(/\s+/).filter(Boolean);
    const nombre = partes.find(
      (parte) => !tratamientos.includes(parte.replace(/\./g, '').toLowerCase())
    );
    return nombre ?? partes[0] ?? '';
  }

  incluye(widget: WidgetId): boolean {
    return this.widgets.includes(widget);
  }
}
