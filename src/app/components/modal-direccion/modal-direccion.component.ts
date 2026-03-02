import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-modal-direccion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  templateUrl: './modal-direccion.component.html',
  styleUrls: ['./modal-direccion.component.scss']
})
export class ModalDireccionComponent {
  direccionForm: FormGroup;

  departamentos = [
    'Antioquia',
    'Cundinamarca',
    'Valle del Cauca',
    'Atlántico',
    'Santander'
  ];

  municipios = [
    'Medellín',
    'Envigado',
    'Bogotá',
    'Cali',
    'Barranquilla',
    'Bucaramanga'
  ];
  vias = ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal', 'Circular'];
  ciudades = ['Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Bucaramanga'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalDireccionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.direccionForm = this.fb.group({
      departamento: ['Antioquia', Validators.required],
      municipio: ['Medellín', Validators.required],
      viaPrincipal: ['', Validators.required],
      numeroVia: ['', Validators.required],
      letraVia: [''],
      numeroCruce: ['', Validators.required],
      placa: ['', Validators.required],
      barrio: ['', Validators.required],
      complemento: ['']
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  guardar(): void {
    if (this.direccionForm.valid) {
      this.dialogRef.close(this.direccionForm.value);
    }
  }
}