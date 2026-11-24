import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import {
  construirPersona,
  crearGrupoCaracterizacion,
  valoresCaracterizacion
} from '../../../shared/components/caracterizacion-form/caracterizacion-campos';
import { CaracterizacionFormComponent } from '../../../shared/components/caracterizacion-form/caracterizacion-form.component';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor } from '../../../shared/http/errores-servidor';
import { NovedadPsicologia, NovedadesPsicologiaService } from '../../services/novedades-psicologia.service';

/**
 * «Datos de la persona» — entre los intentos de contacto y las rutas y derivaciones de la novedad.
 *
 * Llega precargado con lo que capturaron APH u otro actor de la ruta y se puede **actualizar**, salvo
 * nombres, apellidos y documento (identifican a la persona). Reutiliza `CaracterizacionForm` (F4).
 */
@Component({
  selector: 'app-datos-persona',
  imports: [ReactiveFormsModule, CaracterizacionFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="datos" aria-labelledby="datos-persona-titulo">
      <h2 id="datos-persona-titulo" class="datos__titulo">Datos de la persona</h2>
      <p class="datos__ayuda">
        Vienen de lo que ya se registró. Puede completarlos o corregirlos; el nombre y el documento no se cambian aquí.
      </p>
      <app-caracterizacion-form [grupo]="grupo" prefijoId="datos-persona" />
      @if (!soloLectura()) {
        <div class="datos__acciones">
          <button type="button" class="boton boton--secundario" [disabled]="guardando() || grupo.pristine" (click)="guardar()">
            {{ guardando() ? 'Guardando…' : 'Guardar datos de la persona' }}
          </button>
        </div>
      }
    </section>
  `,
  styles: `
    .datos { display: flex; flex-direction: column; gap: var(--space-3); }
    .datos__titulo { margin: 0; }
    .datos__ayuda { margin: 0; color: var(--color-text-secondary); }
    .datos__acciones { display: flex; gap: var(--space-3); }
  `
})
export class DatosPersonaComponent {
  private readonly servicio = inject(NovedadesPsicologiaService);
  private readonly notificacion = inject(NotificacionService);

  readonly novedad = input.required<NovedadPsicologia>();
  readonly soloLectura = input(false);
  readonly actualizada = output<NovedadPsicologia>();
  readonly conflicto = output<void>();

  protected readonly grupo = crearGrupoCaracterizacion();
  protected readonly guardando = signal(false);

  constructor() {
    effect(() => {
      // Una novedad nueva (o recargada tras guardar) vuelve a poblar el formulario.
      this.grupo.reset(valoresCaracterizacion(this.novedad().persona));
      this.bloquearNombre();
    });
    effect(() => {
      if (this.soloLectura()) this.grupo.disable({ emitEvent: false });
      else {
        this.grupo.enable({ emitEvent: false });
        this.bloquearNombre();
      }
    });
  }

  /** Nombres y apellidos los registró APH y Psicología no los cambia. */
  private bloquearNombre(): void {
    for (const control of ['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'] as const) {
      this.grupo.controls[control].disable({ emitEvent: false });
    }
  }

  protected guardar(): void {
    this.grupo.markAllAsTouched();
    if (this.grupo.invalid) return;
    const { nombres: _n, apellidos: _a, ...persona } = construirPersona(this.grupo.getRawValue());
    this.guardando.set(true);
    this.servicio.actualizarPersona(this.novedad().idAtencion, this.novedad().version, persona).subscribe({
      next: (novedad) => {
        this.guardando.set(false);
        this.notificacion.exito('Datos de la persona actualizados.');
        this.actualizada.emit(novedad);
      },
      error: (e: ErrorAlma) => {
        this.guardando.set(false);
        if (e.tipo === 'conflicto') this.conflicto.emit();
        const sinCampo = aplicarErroresServidor(this.grupo, e);
        this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
      }
    });
  }
}
