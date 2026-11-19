import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthService, ROLES_UAD } from '../../../services/auth.service';
import { EquipoUad } from '../../contratos/uad-api.types';
import { ETIQUETA_EQUIPO } from '../../dominio/etiquetas';
import { UadSimulacionService } from '../../infraestructura/mock/uad-mock-store';

/**
 * Franja «Datos de demostración» del módulo UAD y controles del adaptador mock. Solo se pinta si el
 * `UadSimulacionService` está provisto, es decir, con `environment.uad.adaptador = 'mock'`.
 *
 * El selector de equipo solo aparece para quien no tiene rol de equipo UAD (p. ej. ADMIN): con el
 * backend real el equipo lo deriva el servidor y **nunca** se acepta desde el cliente.
 */
@Component({
  selector: 'app-uad-panel-simulacion',
  imports: [FormsModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (simulacion) {
      <section class="simulacion casilda-alerta casilda-alerta--precaucion" aria-labelledby="uad-sim-titulo">
        <mat-icon aria-hidden="true">science</mat-icon>
        <div class="simulacion__cuerpo">
          <p id="uad-sim-titulo" class="simulacion__titulo">
            <strong>Datos de demostración.</strong> Los servicios de la UAD están simulados: nada se guarda en el servidor
            ni se envía por correo. Los nombres, documentos y contactos son ficticios.
          </p>
          <div class="simulacion__controles">
            @if (muestraSelectorEquipo) {
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Equipo simulado</mat-label>
                <mat-select [ngModel]="simulacion.equipoSimulado()" (ngModelChange)="cambiarEquipo($event)" name="equipoSimulado">
                  @for (e of equipos; track e) {
                    <mat-option [value]="e">{{ etiquetaEquipo[e] }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
            <button type="button" class="boton boton--secundario" (click)="simulacion.fallarSiguiente.set(500)">
              Simular fallo del servidor en la próxima consulta
            </button>
            <ng-content />
          </div>
        </div>
      </section>
    }
  `,
  styles: `
    .simulacion { align-items: flex-start; }
    .simulacion__cuerpo { display: flex; flex-direction: column; gap: var(--space-2); }
    .simulacion__titulo { margin: 0; }
    .simulacion__controles { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
    .simulacion__controles mat-form-field { min-width: 180px; }
  `
})
export class PanelSimulacionComponent {
  protected readonly simulacion = inject(UadSimulacionService, { optional: true });
  private readonly auth = inject(AuthService);

  /** Se emite al cambiar el equipo simulado: la página recarga sus datos. */
  readonly equipoCambiado = output<EquipoUad>();

  protected readonly equipos: readonly EquipoUad[] = ['EQUIPO_3', 'EQUIPO_4'];
  protected readonly etiquetaEquipo = ETIQUETA_EQUIPO;
  protected readonly muestraSelectorEquipo = !ROLES_UAD.some((r) => this.auth.hasRole(r));

  protected cambiarEquipo(equipo: EquipoUad): void {
    this.simulacion?.equipoSimulado.set(equipo);
    this.equipoCambiado.emit(equipo);
  }
}
