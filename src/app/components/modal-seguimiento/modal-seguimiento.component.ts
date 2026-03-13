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
  selector: 'app-modal-remisiones',
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
  templateUrl: './modal-seguimiento.component.html',
  styleUrls: ['./modal-seguimiento.component.scss']
})
export class ModalSeguimientosComponent {

  catalogoSeguimiento: string[] = ['Presencial', 'Telefónico', 'Virtual', 'Visita Domiciliaria'];
  catalogoAcciones: string[] = ['Acción 1', 'Acción 2', 'Acción 3'];
  catalogoActividades: string[] = ['Actividad A', 'Actividad B', 'Actividad C'];
  catalogoEstados: string[] = ['En Proceso', 'Cerrado', 'Pendiente'];
  catalogoMotivos: string[] = ['Motivo 1', 'Motivo 2', 'Motivo 3'];

  data = {
    tipoSeguimiento: '',
    fecha: null as Date | null,
    accion: '',
    actividad: '',
    descripcion: '',
    estadoSeguimiento: '',
    motivoEstado: '',
    archivo: null as File | null
  };

  constructor(public dialogRef: MatDialogRef<ModalSeguimientosComponent>) { }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) { this.data.archivo = file; }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}