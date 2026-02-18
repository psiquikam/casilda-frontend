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
  templateUrl: './modal-remision.component.html',
  styleUrls: ['./modal-remision.component.scss']
})
export class ModalRemisionComponent {

  data = {
    tipo: '',
    cual: '',
    fecha: '',
  };

  constructor(public dialogRef: MatDialogRef<ModalRemisionComponent>) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
