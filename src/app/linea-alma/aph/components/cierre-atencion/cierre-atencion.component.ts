import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { filter, switchMap } from 'rxjs';
import { DialogoService } from '../../../../core/a11y/dialogo.service';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { CatalogosAlmaService } from '../../../shared/catalogos/catalogos-alma.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { ItemCatalogo } from '../../../shared/types/alma.types';
import { AtencionAph, AtencionesAphService } from '../../services/atenciones-aph.service';

/**
 * Cierre de la atención APH (H-1.7, `RF-ALMA-APH-005`): cuando la persona no acepta Psicología
 * y no quedan rutas externas en curso. El motivo sale del catálogo `motivos-cierre-aph`.
 */
@Component({
  selector: 'app-cierre-atencion',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="cierre" [formGroup]="form" (ngSubmit)="cerrar()" novalidate aria-labelledby="cierre-titulo">
      <h3 id="cierre-titulo" class="cierre__titulo">Cerrar la atención</h3>
      @if (bloqueo(); as motivo) {
        <p class="casilda-alerta casilda-alerta--precaucion" role="status">
          <mat-icon aria-hidden="true">info</mat-icon>
          <span>{{ motivo }}</span>
        </p>
      }
      <mat-form-field appearance="outline">
        <mat-label>Motivo de cierre</mat-label>
        <mat-select id="cierre-motivo" formControlName="motivo">
          @for (m of motivos(); track m.codigo) {
            <mat-option [value]="m.codigo">{{ m.etiqueta }}</mat-option>
          }
        </mat-select>
        @if (error('motivo', 'el motivo de cierre'); as e) { <mat-error>{{ e }}</mat-error> }
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Observación (opcional)</mat-label>
        <textarea matInput id="cierre-observacion" formControlName="observacion" rows="3" autocomplete="off"></textarea>
      </mat-form-field>
      <div>
        <button type="submit" class="boton boton--primario" [disabled]="enviando() || !!bloqueo()">Cerrar atención</button>
      </div>
    </form>
  `,
  styles: `
    .cierre { display: flex; flex-direction: column; gap: var(--space-2); }
    .cierre__titulo { margin: 0 0 var(--space-2); font-size: var(--font-size-xl); }
  `
})
export class CierreAtencionComponent implements OnInit {
  private readonly servicio = inject(AtencionesAphService);
  private readonly catalogos = inject(CatalogosAlmaService);
  private readonly dialogo = inject(DialogoService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  readonly atencion = input.required<AtencionAph>();
  /** Motivo por el que hoy no se puede cerrar (p. ej. rutas externas en curso); deshabilita el botón. */
  readonly bloqueo = input<string | null>(null);
  readonly cerrada = output<AtencionAph>();
  readonly conflicto = output<void>();

  protected readonly motivos = signal<ItemCatalogo[]>([]);
  protected readonly enviando = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    motivo: ['', Validators.required],
    observacion: ['', Validators.maxLength(1000)]
  });

  ngOnInit(): void {
    this.catalogos.obtener('motivos-cierre-aph').subscribe({
      next: (items) => this.motivos.set(items),
      error: (e: ErrorAlma) => this.notificacion.error('No pudimos cargar los motivos de cierre. Intente de nuevo en un momento.', e)
    });
  }

  protected error(control: 'motivo' | 'observacion', etiqueta: string): string | null {
    return mensajeDeError(this.form.controls[control], etiqueta);
  }

  protected cerrar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.bloqueo()) return;
    const { motivo, observacion } = this.form.getRawValue();
    this.dialogo
      .confirmar({
        titulo: 'Cerrar la atención',
        subtitulo: this.atencion().idAtencion,
        mensaje: 'Después del cierre ya no se podrán modificar los datos de esta atención. ¿Desea cerrarla?',
        textoConfirmar: 'Cerrar atención',
        iconoConfirmar: 'check',
        textoCancelar: 'Volver'
      })
      .pipe(
        filter((confirmado) => confirmado),
        switchMap(() => {
          this.enviando.set(true);
          return this.servicio.cerrar(this.atencion().idAtencion, {
            version: this.atencion().version,
            motivo,
            observacion: observacion.trim() || null
          });
        })
      )
      .subscribe({
        next: (atencion) => {
          this.enviando.set(false);
          this.notificacion.exito('La atención quedó cerrada.');
          this.cerrada.emit(atencion);
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
