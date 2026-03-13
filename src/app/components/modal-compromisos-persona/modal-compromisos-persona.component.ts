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
  templateUrl: './modal-compromisos-persona.component.html',
  styleUrls: ['./modal-compromisos-persona.component.scss']
})
export class ModalCompromisosPersonaComponent {

  catalogoCompromisos: string[] = [
    'Compromiso 1',
    'Compromiso 2',
    'Compromiso 3',
    'Compromiso 4',
    'Compromiso 5',
  ];

  data = {
    compromisos: '',
    fecha: null as Date | null
  };

  constructor(public dialogRef: MatDialogRef<ModalCompromisosPersonaComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}