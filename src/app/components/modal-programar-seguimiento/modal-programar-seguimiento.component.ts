import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ProgramarSeguimientoDialogData {
  codigo: string;
  nombre: string;
}

export interface ProgramarSeguimientoDialogResult {
  fechaCita: string;
  horaCita: string;
}

@Component({
  selector: 'app-modal-programar-seguimiento',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Agendar cita de seguimiento</h2>
    <form [formGroup]="form" (ngSubmit)="confirmar()">
      <mat-dialog-content>
        <p>{{ data.nombre }} · {{ data.codigo }}</p>
        <mat-form-field appearance="outline">
          <mat-label>Fecha de la cita</mat-label>
          <input matInput type="date" formControlName="fechaCita" [min]="fechaMinima">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Hora de la cita</mat-label>
          <input matInput type="time" formControlName="horaCita">
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          Agendar seguimiento
        </button>
      </mat-dialog-actions>
    </form>
  `
})
export class ModalProgramarSeguimientoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ModalProgramarSeguimientoComponent>);
  readonly data = inject<ProgramarSeguimientoDialogData>(MAT_DIALOG_DATA);
  readonly fechaMinima = this.fechaLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
  readonly form = this.fb.nonNullable.group({
    fechaCita: [this.fechaMinima, Validators.required],
    horaCita: ['09:00', Validators.required]
  });

  confirmar(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  private fechaLocal(fecha: Date): string {
    const ano = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
