import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reparto-modal',
  standalone: true,
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
    MatIconModule
  ]
})
export class AsignarCitaModalComponent {

  citaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AsignarCitaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.citaForm = this.fb.group({
      fechaCita: ['', Validators.required],
      horaCita: ['', Validators.required]
    });
  }

  guardar() {
    if (this.citaForm.valid) {
      this.dialogRef.close({
        caso: this.data,
        cita: this.citaForm.value
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}
