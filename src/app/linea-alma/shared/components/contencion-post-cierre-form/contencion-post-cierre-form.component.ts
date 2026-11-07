import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ContencionesAlmaService } from '../../../aph/services/contenciones-alma.service';
import { ErrorAlma } from '../../http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../http/errores-servidor';
import { ContencionPostCierreDto } from '../../types/alma-dto';

/**
 * `ContencionPostCierreForm` — nota de contención para una persona cuyo caso ya está cerrado y
 * que vuelve a comunicarse (RF-ALMA-APH-005). **Frontera F6**: lo reutiliza Psicología (J-1.7).
 *
 * La interfaz deja explícito que esta atención **no reabre el caso ni suma seguimientos**: se
 * guarda como `POST_CIERRE` en la línea de tiempo. El padre aporta la atención `ALMA-…` nueva
 * (una llamada posterior siempre genera una, RN-ALMA-06) y el caso cerrado.
 */
@Component({
  selector: 'app-contencion-post-cierre-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="cpc" [formGroup]="form" (ngSubmit)="guardar()" novalidate aria-labelledby="cpc-titulo">
      <h3 id="cpc-titulo" class="cpc__titulo">Contención después del cierre</h3>
      <p class="casilda-alerta">
        <mat-icon aria-hidden="true">info</mat-icon>
        <span>
          La persona tiene el caso <strong>{{ numeroCaso() }}</strong> cerrado. Esta nota queda en su historial como
          «después del cierre»: <strong>no reabre el caso y no suma seguimientos</strong>.
        </span>
      </p>

      @if (registrada(); as r) {
        <p class="cpc__ok" role="status">
          <mat-icon aria-hidden="true">check_circle</mat-icon>
          Contención registrada. Quedó en la línea de tiempo como «después del cierre».
        </p>
      } @else {
        <mat-form-field appearance="outline">
          <mat-label>Nota de contención</mat-label>
          <textarea matInput id="cpc-nota" formControlName="nota" rows="4" autocomplete="off"></textarea>
          <mat-hint>Qué se conversó y cómo quedó la persona al terminar. Mínimo 10 caracteres.</mat-hint>
          @if (error(); as e) { <mat-error>{{ e }}</mat-error> }
        </mat-form-field>
        <div>
          <button type="submit" class="boton boton--primario" [disabled]="enviando() || deshabilitado()">Registrar contención</button>
        </div>
      }
    </form>
  `,
  styles: `
    .cpc { display: flex; flex-direction: column; gap: var(--space-3); }
    .cpc__titulo { margin: 0; font-size: var(--font-size-xl); }
    .cpc__ok { display: flex; align-items: center; gap: var(--space-2); margin: 0; color: var(--color-primary); font-weight: 600; }
  `
})
export class ContencionPostCierreFormComponent {
  private readonly servicio = inject(ContencionesAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  /** Atención `ALMA-…` sobre la que se registra. */
  readonly idAtencion = input.required<string>();
  /** Caso cerrado de la persona (viene de la consulta previa, F2). */
  readonly numeroCaso = input.required<string>();
  readonly deshabilitado = input(false);
  readonly registrada = signal<ContencionPostCierreDto | null>(null);
  readonly contencionRegistrada = output<ContencionPostCierreDto>();

  protected readonly enviando = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    nota: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]]
  });

  protected error(): string | null {
    return mensajeDeError(this.form.controls.nota, 'La nota');
  }

  protected guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.enviando.set(true);
    this.servicio
      .crear({ idAtencion: this.idAtencion(), numeroCaso: this.numeroCaso(), nota: this.form.controls.nota.value.trim() })
      .subscribe({
        next: (contencion) => {
          this.enviando.set(false);
          this.registrada.set(contencion);
          this.notificacion.exito('Contención registrada.');
          this.contencionRegistrada.emit(contencion);
        },
        error: (e: ErrorAlma) => {
          this.enviando.set(false);
          const sinCampo = aplicarErroresServidor(this.form, e);
          this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
        }
      });
  }
}
