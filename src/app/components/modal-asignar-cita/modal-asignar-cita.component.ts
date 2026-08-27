import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-reparto-modal',
    templateUrl: './modal-asignar-cita.component.html',
    styleUrls: ['./modal-asignar-cita.component.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule
    ]
})
export class AsignarCitaModalComponent {

  citaForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AsignarCitaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.citaForm = this.fb.group({
      fechaCita: [null, Validators.required],
      horaCita: ['', Validators.required]
    });
  }

  private formatFecha(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha;
    return new Date(fecha).toISOString().substring(0, 10);
  }

  guardar() {
    if (this.citaForm.valid) {
      const val = this.citaForm.value;
      this.dialogRef.close({
        caso: this.data,
        cita: { ...val, fechaCita: this.formatFecha(val.fechaCita) }
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}
