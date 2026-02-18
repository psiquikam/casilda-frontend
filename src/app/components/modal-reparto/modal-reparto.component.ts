import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-reparto-modal',
  standalone: true,
  templateUrl: './modal-reparto.component.html',
  styleUrls: ['./modal-reparto.component.scss'], 
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

export class RepartoModalComponent {

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RepartoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  tiposAsignacion = ['Prioritaria', 'Ordinaria', 'Seguimiento'];
  servicios = ['Psicología', 'Asesoría Jurídica', 'Trabajo Social', 'Dupla Psicosocial'];
  profesionales = [
    { id: 1, nombre: 'Dra. Elena Gómez' },
    { id: 2, nombre: 'Dr. Ricardo Luna' }
  ];

  repartoForm = this.fb.group({
    tipoAsignacion: ['', Validators.required],
    fechaReparto: [new Date().toLocaleDateString()],
    servicio: ['', Validators.required],
    asignadoA: ['', Validators.required],
    observaciones: ['', [Validators.required, Validators.minLength(10)]]
  });

  guardar() {
    if (this.repartoForm.valid) {
      this.dialogRef.close({
        caso: this.data,
        form: this.repartoForm.value
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}
