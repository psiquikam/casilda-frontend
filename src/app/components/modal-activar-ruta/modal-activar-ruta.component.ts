import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal-telefono',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './modal-activar-ruta.component.html',
  styleUrls: ['./modal-activar-ruta.component.scss']
})
export class ModalActivarRutaComponent {

  data = {
    tipo: '',
    cual: '',
  };

  opcionesRuta: Record<string, string[]> = {
    Ruta1: [
      'UAD 3 y 4 (Unidad de asuntos disciplinarios)',
      'URC (Unidad de resolución de conflictos)',
      'Defensa técnica',
      'Línea Alma',
      'Seguridad a personas y bienes (vigilancia)',
      'Ruta de atención por amenaza',
      'Medidas de protección (académicas)',
      'Medidas de protección (laborales)',
      'No acepta/No toma ninguna decisión en esta sesión',
      'No aplica',
      'Otras',
    ],
    Ruta2: [
      'Unidad de Fiscalía',
      'Código Fucsia (ACV)',
      'Línea 123 - Mujer - Medellín',
      'Línea 123 - Mujer - Área Metropolitana',
      'Línea 155 - Nacional',
      'Línea 122 - Fiscalía',
      'Dupla psicojurídica - Secretaría Mujeres Medellín',
      'No acepta/No toma ninguna decisión en esta sesión',
    ],
  };

  get opcionesCuales(): string[] {
    return this.opcionesRuta[this.data.tipo] ?? [];
  }

  onTipoChange(): void {
    this.data.cual = '';
  }

  constructor(public dialogRef: MatDialogRef<ModalActivarRutaComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
