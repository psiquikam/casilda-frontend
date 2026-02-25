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
  selector: 'app-modal-apreciacion-juridica',
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
  templateUrl: './modal-apreciacion-juridica.component.html',
  styleUrls: ['./modal-apreciacion-juridica.component.scss']
})
export class ModalApreciacionJuridicaComponent {
  data = {
    tipo: '',
    descripcion: ''
  };

  listaTipos = ['Penal', 'Civil', 'Laboral', 'Administrativa', 'Derechos Humanos'];

  constructor(public dialogRef: MatDialogRef<ModalApreciacionJuridicaComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}