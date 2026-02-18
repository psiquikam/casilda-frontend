import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-discapacidad',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Agregar Discapacidad</h2>
    <mat-dialog-content>
      <div style="display: flex; flex-direction: column; gap: 15px; padding-top: 10px;">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de discapacidad</mat-label>
          <mat-select [(ngModel)]="data.tipo">
            <mat-option value="Física">Física</mat-option>
            <mat-option value="Auditiva">Auditiva</mat-option>
            <mat-option value="Visual">Visual</mat-option>
            <mat-option value="Psicosocial">Psicosocial</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descripción / Detalle</mat-label>
          <input matInput [(ngModel)]="data.descripcion">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="data">Agregar</button>
    </mat-dialog-actions>
  `
})
export class ModalDiscapacidadComponent {
  data = { tipo: '', descripcion: '' };
  constructor(public dialogRef: MatDialogRef<ModalDiscapacidadComponent>) {}
  onNoClick(): void { this.dialogRef.close(); }
}