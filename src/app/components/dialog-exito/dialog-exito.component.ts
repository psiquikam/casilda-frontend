import { Component, Inject } from '@angular/core';

import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-exito-dialog',
    imports: [MatDialogModule, MatButtonModule, MatIconModule],
    template: `
    <div class="dialog-container">
      <mat-icon class="success-icon">check_circle</mat-icon>
      <h2 mat-dialog-title>{{ data.titulo }}</h2>

      <mat-dialog-content>
        <p>{{ data.mensaje }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="center">
        <button mat-raised-button color="primary" (click)="cerrar()">Entendido</button>
      </mat-dialog-actions>
    </div>
  `,
    styleUrls: ['./dialog-exito.component.scss']
})
export class DialogoExitoComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogoExitoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { titulo: string, mensaje: string, codigo: string }
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}
