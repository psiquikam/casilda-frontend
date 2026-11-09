import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { ETIQUETA_ESTADO_RECORDATORIO, ETIQUETA_TIPO_SEGUIMIENTO } from '../../../shared/types/alma.types';
import { desdeFechaLocal, fechaFuturaValidator } from '../../dominio/seguimientos';
import { CasoAlma, CasosAlmaService } from '../../services/casos-alma.service';

type Continuar = '' | 'SI' | 'NO';

/**
 * Seguimientos del caso (J-1.5; `RF-ALMA-PSI-004`, `RN-ALMA-05`, `RNF-ALMA-004`).
 *
 * Cada seguimiento registra la nota y la pregunta **«¿Desea continuar con el seguimiento?»**:
 * *Sí* programa el próximo control (fecha futura) y el servidor envía el recordatorio por correo,
 * cuyo estado se muestra; *No* ofrece la CTA de cierre. El contador `X/3` es informativo y **no
 * bloquea** al superar los 3 controles reglamentarios.
 */
@Component({
  selector: 'app-seguimientos',
  imports: [DatePipe, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatRadioModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seguimientos.component.html',
  styleUrl: './seguimientos.component.scss'
})
export class SeguimientosComponent {
  private readonly servicio = inject(CasosAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  readonly caso = input.required<CasoAlma>();
  readonly soloLectura = input(false);
  readonly actualizado = output<CasoAlma>();
  readonly conflicto = output<void>();
  /** La persona no desea continuar: la página ofrece el cierre. */
  readonly solicitarCierre = output<void>();

  protected readonly etiquetaRecordatorio = ETIQUETA_ESTADO_RECORDATORIO;
  protected readonly etiquetaTipo = ETIQUETA_TIPO_SEGUIMIENTO;
  protected readonly enviando = signal(false);
  protected readonly formularioAbierto = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nota: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(3000)]],
    deseaContinuar: ['' as Continuar, Validators.required],
    proximoControl: ['', fechaFuturaValidator()]
  });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly continua = computed(() => this.valores().deseaContinuar === 'SI');
  protected readonly valoresDeseaNo = computed(() => this.valores().deseaContinuar === 'NO');
  protected readonly puedeRegistrar = computed(() => !this.soloLectura() && this.caso().activo);
  protected readonly contador = computed(() => this.caso().controles);
  protected readonly ordenados = computed(() => [...this.caso().seguimientos].sort((a, b) => b.numeroSeguimiento - a.numeroSeguimiento));

  protected abrir(): void {
    this.form.reset({ nota: '', deseaContinuar: '', proximoControl: '' });
    this.formularioAbierto.set(true);
  }

  protected cancelar(): void {
    this.formularioAbierto.set(false);
  }

  protected error(control: 'nota' | 'deseaContinuar' | 'proximoControl', etiqueta: string): string | null {
    const c = this.form.controls[control];
    if (c.errors?.['fechaPasada'] && (c.touched || c.dirty)) return String(c.errors['fechaPasada']);
    return mensajeDeError(c, etiqueta);
  }

  protected registrar(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    const continua = v.deseaContinuar === 'SI';
    const proximoControl = continua ? desdeFechaLocal(v.proximoControl) : null;
    if (continua && !proximoControl) this.form.controls.proximoControl.setErrors({ servidor: 'Programe la fecha y hora del próximo control.' });
    if (this.form.invalid || !this.puedeRegistrar()) return;

    this.enviando.set(true);
    const caso = this.caso();
    this.servicio.registrarSeguimiento(caso.numeroCaso, { version: caso.version, nota: v.nota.trim(), deseaContinuar: continua, proximoControl }).subscribe({
      next: (actualizado) => {
        this.enviando.set(false);
        this.formularioAbierto.set(false);
        const ultimo = actualizado.seguimientos.at(-1);
        if (continua) {
          const recordatorio = ultimo?.recordatorio ? ` ${ETIQUETA_ESTADO_RECORDATORIO[ultimo.recordatorio.estado]}.` : '';
          this.notificacion.exito(`Seguimiento ${actualizado.numeroSeguimientos} registrado. Próximo control programado.${recordatorio}`);
        } else {
          this.notificacion.info(`Seguimiento ${actualizado.numeroSeguimientos} registrado. La persona no desea continuar: puede cerrar el caso.`);
        }
        this.actualizado.emit(actualizado);
        if (!continua) this.solicitarCierre.emit();
      },
      error: (e: ErrorAlma) => {
        this.enviando.set(false);
        const sinCampo = aplicarErroresServidor(this.form, e);
        this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
        if (e.tipo === 'conflicto') this.conflicto.emit();
      }
    });
  }
}
