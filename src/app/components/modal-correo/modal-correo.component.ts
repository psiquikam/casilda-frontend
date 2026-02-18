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
  selector: 'app-modal-correo',
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
  templateUrl: './modal-correo.component.html',
  styleUrls: ['./modal-correo.component.scss']
})
export class ModalCorreoComponent {

  data = {
    tipo: '',
    correo: '',
    descripcion: '',
  };

  constructor(public dialogRef: MatDialogRef<ModalCorreoComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
