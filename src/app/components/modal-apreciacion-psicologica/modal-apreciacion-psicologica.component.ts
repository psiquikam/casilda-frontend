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
  selector: 'app-modal-apreciacion-psicologica',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './modal-apreciacion-psicologica.component.html',
  styleUrls: ['./modal-apreciacion-psicologica.component.scss']
})
export class ModalApreciacionPsicologicaComponent {
  data = {
    tipo: '',
    descripcion: ''
  };

  listaTipos = ['Clínica', 'Familiar', 'Educativa', 'Social', 'Otra'];

  constructor(public dialogRef: MatDialogRef<ModalApreciacionPsicologicaComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}