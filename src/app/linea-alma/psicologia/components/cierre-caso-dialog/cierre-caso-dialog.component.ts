import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CatalogosAlmaService } from '../../../shared/catalogos/catalogos-alma.service';
import { mensajeDeError } from '../../../shared/http/errores-servidor';
import { ItemCatalogo } from '../../../shared/types/alma.types';

export interface CierreCasoDialogData {
  numeroCaso: string;
  /** Si la sesión puede exportar el PDF (`alma.pdf.exportar`), se ofrece generarlo al cerrar. */
  puedeExportarPdf: boolean;
}

export interface CierreCasoResultado {
  motivo: string;
  observacion: string | null;
  generarPdf: boolean;
}

/**
 * Modal de cierre del caso (J-1.6, `RF-ALMA-PSI-005`): motivo **predefinido** del catálogo
 * `motivos-cierre-psicologia`, observación y opción de generar el PDF. Devuelve el resultado al
 * expediente, que ejecuta el cierre; tras cerrarlo el caso queda de solo lectura.
 */
@Component({
  selector: 'app-cierre-caso-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="cierre__titulo">Cerrar el caso {{ data.numeroCaso }}</h2>
    <form [formGroup]="form" (ngSubmit)="confirmar()" novalidate>
      <mat-dialog-content class="cierre__contenido">
        <p>Al cerrar, el expediente queda de solo lectura. Si la persona vuelve a comunicarse se registra una contención después del cierre, sin reabrirlo.</p>

        @if (errorCatalogo()) {
          <div class="casilda-alerta casilda-alerta--peligro" role="alert">
            <mat-icon aria-hidden="true">error_outline</mat-icon>
            <div>
              <p>No pudimos cargar los motivos de cierre.</p>
              <button type="button" class="boton boton--secundario" (click)="cargarMotivos()">Intentar de nuevo</button>
            </div>
          </div>
        }

        <mat-form-field appearance="outline" class="cierre__campo">
          <mat-label>Motivo de cierre</mat-label>
          <mat-select id="cierre-motivo" formControlName="motivo">
            @for (m of motivos(); track m.codigo) {
              <mat-option [value]="m.codigo">{{ m.etiqueta }}</mat-option>
            }
          </mat-select>
          @if (error('motivo', 'El motivo'); as e) { <mat-error>{{ e }}</mat-error> }
        </mat-form-field>

        <mat-form-field appearance="outline" class="cierre__campo">
          <mat-label>Observación</mat-label>
          <textarea matInput id="cierre-observacion" formControlName="observacion" rows="3" autocomplete="off"></textarea>
          <mat-hint>{{ form.controls.motivo.value === 'OTRO' ? 'Obligatoria cuando el motivo es «Otro».' : 'Opcional.' }}</mat-hint>
          @if (error('observacion', 'La observación'); as e) { <mat-error>{{ e }}</mat-error> }
        </mat-form-field>

        @if (data.puedeExportarPdf) {
          <mat-checkbox formControlName="generarPdf">Descargar el PDF del historial al cerrar</mat-checkbox>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" class="boton boton--secundario" mat-dialog-close>Cancelar</button>
        <button type="submit" class="boton boton--emergencia">
          <mat-icon aria-hidden="true">lock</mat-icon>
          Cerrar el caso
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .cierre__titulo { font-size: var(--font-size-xl); }
    .cierre__contenido { display: flex; flex-direction: column; gap: var(--space-2); }
    .cierre__contenido p { margin: 0 0 var(--space-2); }
    .cierre__campo { width: 100%; }
  `
})
export class CierreCasoDialogComponent implements OnInit {
  private readonly dialogRef = inject<MatDialogRef<CierreCasoDialogComponent, CierreCasoResultado | undefined>>(MatDialogRef);
  private readonly catalogos = inject(CatalogosAlmaService);
  private readonly fb = inject(FormBuilder);
  protected readonly data = inject<CierreCasoDialogData>(MAT_DIALOG_DATA);

  protected readonly motivos = signal<ItemCatalogo[]>([]);
  protected readonly errorCatalogo = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    motivo: ['', Validators.required],
    observacion: ['', Validators.maxLength(2000)],
    generarPdf: [false]
  });

  ngOnInit(): void {
    this.cargarMotivos();
  }

  protected cargarMotivos(): void {
    this.errorCatalogo.set(false);
    this.catalogos.obtener('motivos-cierre-psicologia').subscribe({
      next: (items) => this.motivos.set(items),
      error: () => {
        this.catalogos.invalidar('motivos-cierre-psicologia');
        this.errorCatalogo.set(true);
      }
    });
  }

  protected error(control: 'motivo' | 'observacion', etiqueta: string): string | null {
    return mensajeDeError(this.form.controls[control], etiqueta);
  }

  protected confirmar(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    if (v.motivo === 'OTRO' && v.observacion.trim().length < 10) {
      this.form.controls.observacion.setErrors({ servidor: 'Describa el motivo de cierre (mínimo 10 caracteres).' });
    }
    if (this.form.invalid) return;
    this.dialogRef.close({ motivo: v.motivo, observacion: v.observacion.trim() || null, generarPdf: this.data.puedeExportarPdf && v.generarPdf });
  }
}
