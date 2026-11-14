import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { CatalogosAlmaService, etiquetaDe } from '../../../shared/catalogos/catalogos-alma.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { ETIQUETA_PROTOCOLO_INTENTO, ItemCatalogo, MAX_INTENTOS_CONTACTO } from '../../../shared/types/alma.types';
import { advertenciasIntento, cierraPorNoContacto, puedeRegistrarIntento, requiereJustificacion } from '../../dominio/protocolo-intentos';
import { aFechaLocal, desdeFechaLocal } from '../../dominio/seguimientos';
import { NovedadPsicologia, NovedadesPsicologiaService } from '../../services/novedades-psicologia.service';

/**
 * Protocolo de intentos de contacto (J-1.3, `RF-ALMA-PSI-002`, `RN-ALMA-03`).
 *
 * Hasta 9 intentos con fecha, hora, resultado (catálogo), protocolo y **nota independiente**.
 * Contador `n/9`; desde el 4.º se exige justificación; advertencia suave si repite día u horario
 * del intento anterior (la validación dura la hace el Backend, Q11). Con el 9.º sin éxito el
 * servidor cierra por «No contacto» y la UI lo refleja. El historial es de solo agregar. La
 * CTA «Contacto efectivo» abre el primer contacto (J-1.4).
 */
@Component({
  selector: 'app-intentos-contacto',
  imports: [DatePipe, ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './intentos-contacto.component.html',
  styleUrl: './intentos-contacto.component.scss'
})
export class IntentosContactoComponent implements OnInit {
  private readonly servicio = inject(NovedadesPsicologiaService);
  private readonly catalogos = inject(CatalogosAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  readonly novedad = input.required<NovedadPsicologia>();
  readonly soloLectura = input(false);
  /** Se emite con la novedad actualizada tras registrar un intento. */
  readonly actualizada = output<NovedadPsicologia>();
  readonly conflicto = output<void>();
  /** La persona contestó: pasar al primer contacto efectivo. */
  readonly contactoEfectivo = output<void>();

  protected readonly maximo = MAX_INTENTOS_CONTACTO;
  protected readonly etiquetaProtocolo = ETIQUETA_PROTOCOLO_INTENTO;
  protected readonly resultados = signal<ItemCatalogo[]>([]);
  protected readonly errorCatalogo = signal(false);
  protected readonly enviando = signal(false);
  protected readonly formularioAbierto = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    fechaHora: [aFechaLocal(new Date().toISOString()), Validators.required],
    resultado: ['', Validators.required],
    nota: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    justificacion: ['', Validators.maxLength(1000)]
  });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly resumen = computed(() => this.novedad().intentosResumen);
  protected readonly bloqueo = computed(() => puedeRegistrarIntento(this.novedad().estado, this.novedad().tomadaPorMi, this.novedad().intentos));
  protected readonly puedeRegistrar = computed(() => !this.soloLectura() && this.bloqueo().permitido);
  protected readonly siguiente = computed(() => this.resumen().siguiente);
  protected readonly exigeJustificacion = computed(() => !!this.siguiente() && requiereJustificacion(this.siguiente()!));
  protected readonly esElUltimo = computed(() => !!this.siguiente() && cierraPorNoContacto(this.siguiente()!));
  protected readonly advertencias = computed(() => {
    const iso = desdeFechaLocal(this.valores().fechaHora);
    return iso ? advertenciasIntento(iso, this.novedad().intentos) : [];
  });
  protected readonly intentosOrdenados = computed(() => [...this.novedad().intentos].sort((a, b) => b.numeroIntento - a.numeroIntento));

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  protected cargarCatalogo(): void {
    this.errorCatalogo.set(false);
    this.catalogos.obtener('resultados-intento').subscribe({
      next: (items) => this.resultados.set(items),
      error: () => {
        this.catalogos.invalidar('resultados-intento');
        this.errorCatalogo.set(true);
      }
    });
  }

  protected etiquetaResultado(codigo: string): string {
    return etiquetaDe(this.resultados(), codigo);
  }

  protected abrir(): void {
    this.form.reset({ fechaHora: aFechaLocal(new Date().toISOString()), resultado: '', nota: '', justificacion: '' });
    this.formularioAbierto.set(true);
  }

  protected cancelar(): void {
    this.formularioAbierto.set(false);
  }

  protected error(control: 'fechaHora' | 'resultado' | 'nota' | 'justificacion', etiqueta: string): string | null {
    return mensajeDeError(this.form.controls[control], etiqueta);
  }

  protected registrar(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    const fechaHora = desdeFechaLocal(v.fechaHora);
    if (!fechaHora) this.form.controls.fechaHora.setErrors({ servidor: 'Indique una fecha y hora válidas.' });
    if (this.exigeJustificacion() && v.justificacion.trim().length < 10) {
      this.form.controls.justificacion.setErrors({ servidor: 'A partir del cuarto intento la justificación es obligatoria (mínimo 10 caracteres).' });
    }
    if (this.form.invalid || !fechaHora || !this.puedeRegistrar()) return;

    this.enviando.set(true);
    const novedad = this.novedad();
    this.servicio
      .registrarIntento(novedad.idAtencion, {
        version: novedad.version,
        fechaHora,
        resultado: v.resultado,
        nota: v.nota.trim(),
        justificacion: this.exigeJustificacion() ? v.justificacion.trim() : null
      })
      .subscribe({
        next: (actualizada) => {
          this.enviando.set(false);
          this.formularioAbierto.set(false);
          if (actualizada.cerradaPorNoContacto) {
            this.notificacion.info('Se agotaron los 9 intentos. El sistema cerró la novedad por «No contacto».');
          } else {
            this.notificacion.exito(`Intento ${actualizada.intentosResumen.realizados}/${MAX_INTENTOS_CONTACTO} registrado.`);
          }
          this.actualizada.emit(actualizada);
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
