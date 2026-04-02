import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-medidas-proteccion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './modal-medidas-proteccion.component.html',
  styleUrls: ['./modal-medidas-proteccion.component.scss']
})
export class ModalMedidasProteccionComponent {

  data = {
    tipoMedida: '',
    subtipoMedida: '',
    responsable: '',
    descripcion: '',
    fechaRegistro: new Date().toLocaleDateString('es-CO'),
  };

  tiposMedida = [
    'Medida de protección académica',
    'Medida de protección laboral',
    'Medida de protección personal',
    'Medida cautelar',
    'Otra',
  ];

  subtiposMap: Record<string, string[]> = {
    'Medida de protección académica': [
      'Cambio de grupo',
      'Cambio de horario',
      'Cambio de docente',
      'Traslado de programa',
    ],
    'Medida de protección laboral': [
      'Cambio de área',
      'Cambio de jornada',
      'Comisión de servicio',
    ],
    'Medida de protección personal': [
      'Acompañamiento institucional',
      'Restricción de acceso',
    ],
    'Medida cautelar': [
      'Orden de alejamiento',
      'Prohibición de acercamiento',
    ],
    'Otra': ['Otra'],
  };

  responsables = [
    'Bienestar Universitario',
    'Dirección de Personal',
    'Decanatura',
    'Unidad de Género',
    'Dirección de Docencia',
    'Otra dependencia',
  ];

  get subtiposMedida(): string[] {
    return this.subtiposMap[this.data.tipoMedida] ?? [];
  }

  onTipoChange(): void {
    this.data.subtipoMedida = '';
  }

  constructor(public dialogRef: MatDialogRef<ModalMedidasProteccionComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
