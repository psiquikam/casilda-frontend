import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-hechos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './modal-hechos.component.html',
  styleUrls: ['./modal-hechos.component.scss']
})
export class ModalHechosComponent {

  data = {
    fecha: '',
    modo: '',
    lugar: '',
    descripcion: ''
  };

  constructor(public dialogRef: MatDialogRef<ModalHechosComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
