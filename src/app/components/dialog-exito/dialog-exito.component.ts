import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DialogoExitoData {
  titulo?: string;
  mensaje?: string;
  codigo?: string;
  labelCodigo?: string;
  instruccion?: string;
}

@Component({
  selector: 'app-exito-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './dialog-exito.component.html',
  styleUrls: ['./dialog-exito.component.scss']
})
export class DialogoExitoComponent {
  copiado = false;

  constructor(
    public dialogRef: MatDialogRef<DialogoExitoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogoExitoData
  ) {}

  copiarCodigo(): void {
    if (this.data?.codigo && typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(this.data.codigo);
      this.copiado = true;
      setTimeout(() => {
        this.copiado = false;
      }, 2500);
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
