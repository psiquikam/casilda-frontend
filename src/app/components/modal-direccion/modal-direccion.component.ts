import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal-direccion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
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
  barrios = [
    'Aranjuez', 'Belén', 'Boston', 'Buenos Aires', 'Castilla', 'El Centro',
    'El Poblado', 'El Salvador', 'Estadio', 'Floresta', 'Guayabal', 'La América',
    'La Candelaria', 'La Floresta', 'Laureles', 'Los Ángeles', 'Manrique',
    'Moravia', 'Niquitao', 'Pedregal', 'Robledo', 'San Javier', 'Santa Cruz',
    'Trinidad', 'Villahermosa', 'Villa del Prado', 'Zamora'
  ];

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

  get direccionPreview(): string {
    const v = this.direccionForm.value;
    const partes: string[] = [];
    if (v.viaPrincipal && v.numeroVia) {
      let via = `${v.viaPrincipal} ${v.numeroVia}`;
      if (v.letraVia) via += ` ${v.letraVia}`;
      if (v.numeroCruce) via += ` #${v.numeroCruce}`;
      if (v.placa) via += `-${v.placa}`;
      partes.push(via);
    }
    if (v.barrio) partes.push(`Barrio ${v.barrio}`);
    if (v.complemento) partes.push(v.complemento);
    if (v.municipio) partes.push(v.municipio);
    if (v.departamento) partes.push(v.departamento);
    return partes.length ? partes.join(', ') : 'La dirección aparecerá aquí...';
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