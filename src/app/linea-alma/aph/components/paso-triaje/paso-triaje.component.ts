import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { PanelDerivacionesComponent } from '../../../shared/components/panel-derivaciones/panel-derivaciones.component';
import {
  ETIQUETA_TRIAJE,
  HORAS_LIMITE_PRIMER_CONTACTO,
  TRIAJES,
  Triaje
} from '../../../shared/types/alma.types';
import { AtencionAph, AtencionesAphService } from '../../services/atenciones-aph.service';

type Opcion = Triaje | 'OMITIR';

/**
 * Triaje y omisión por peligro inminente (H-1.3, `RF-ALMA-APH-002`, `RN-ALMA-01`).
 *
 * **El front no calcula ni sugiere el triaje**: el algoritmo es externo al sistema y APH
 * selecciona a mano `ALTO / MEDIO / BAJO`. Se muestra, solo como ayuda, el tiempo máximo en el
 * que Psicología debe hacer el primer contacto (12 / 24 / 48 h). La opción «Peligro inminente»
 * permite omitir el triaje **exigiendo justificación narrativa** y ofrece activar de inmediato
 * SPyB o la Línea 123 con el `PanelDerivaciones`.
 */
@Component({
  selector: 'app-paso-triaje',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatRadioModule, PanelDerivacionesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paso-triaje.component.html',
  styleUrl: './paso-triaje.component.scss'
})
export class PasoTriajeComponent {
  private readonly servicio = inject(AtencionesAphService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  readonly atencion = input.required<AtencionAph>();
  readonly soloLectura = input(false);
  /** Se emite con la atención actualizada (o recargada tras un conflicto de versión). */
  readonly actualizada = output<AtencionAph>();
  readonly conflicto = output<void>();

  protected readonly triajes = TRIAJES;
  protected readonly etiquetas = ETIQUETA_TRIAJE;
  protected readonly horas = HORAS_LIMITE_PRIMER_CONTACTO;
  protected readonly enviando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    opcion: ['' as Opcion | '', Validators.required],
    justificacion: ['']
  });
  private readonly opcionActual = signal<Opcion | ''>('');
  protected readonly omitiendo = computed(() => this.opcionActual() === 'OMITIR');
  protected readonly peligroRegistrado = computed(() => !!this.atencion().omisionTriaje);

  constructor() {
    // Rehidrata el formulario con lo ya guardado cuando cambia la atención (retomar borrador).
    effect(() => {
      const a = this.atencion();
      const opcion: Opcion | '' = a.omisionTriaje ? 'OMITIR' : (a.triaje ?? '');
      this.form.reset({ opcion, justificacion: a.omisionTriaje?.justificacion ?? '' }, { emitEvent: false });
      this.opcionActual.set(opcion);
    });
    this.form.controls.opcion.valueChanges.pipe(takeUntilDestroyed()).subscribe((valor) => {
      this.opcionActual.set(valor);
      const justificacion = this.form.controls.justificacion;
      justificacion.setValidators(valor === 'OMITIR' ? [Validators.required, Validators.minLength(10), Validators.maxLength(1000)] : []);
      justificacion.updateValueAndValidity();
    });
  }

  protected error(control: 'opcion' | 'justificacion', etiqueta: string): string | null {
    return mensajeDeError(this.form.controls[control], etiqueta);
  }

  protected guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { opcion, justificacion } = this.form.getRawValue();
    const base = { version: this.atencion().version };
    const cuerpo =
      opcion === 'OMITIR'
        ? { ...base, peligroInminente: true, justificacionOmision: justificacion.trim() }
        : { ...base, triaje: opcion as Triaje };

    this.enviando.set(true);
    this.servicio.registrarTriaje(this.atencion().idAtencion, cuerpo).subscribe({
      next: (atencion) => {
        this.enviando.set(false);
        this.notificacion.exito(opcion === 'OMITIR' ? 'Se registró la omisión del triaje.' : 'Triaje registrado.');
        this.actualizada.emit(atencion);
      },
      error: (e: ErrorAlma) => {
        this.enviando.set(false);
        if (e.tipo === 'conflicto') this.conflicto.emit();
        const sinCampo = aplicarErroresServidor(this.form, e);
        this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
      }
    });
  }
}
