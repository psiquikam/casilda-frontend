import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-modal-compromisos-persona',
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
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './modal-compromisos-profesionales.component.html',
  styleUrls: ['./modal-compromisos-profesionales.component.scss']
})
export class ModalCompromisosProfesionalesComponent {

  catalogoCompromisos: string[] = [
    'Compromiso 1',
    'Compromiso 2',
    'Compromiso 3',
    'Compromiso 4',
    'Compromiso 5',
  ];

  catalogoProfesionales: string[] = [
    'Profesional 1',
    'Profesional 2',
    'Profesional 3',
    'Profesional 4',
    'Profesional 5',
  ];

  data = {
    compromisos: '',
    profesional: '',
    fecha: null as Date | null
  };

  constructor(public dialogRef: MatDialogRef<ModalCompromisosProfesionalesComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}