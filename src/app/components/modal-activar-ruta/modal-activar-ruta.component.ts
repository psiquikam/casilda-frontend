import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface MaestroDto {
  id: number;
  nombre: string;
}

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
  templateUrl: './modal-activar-ruta.component.html',
  styleUrls: ['./modal-activar-ruta.component.scss']
})
export class ModalActivarRutaComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  data = {
    tipo: '',
    cual: '',
  };

  tiposRutaActivacion: MaestroDto[] = [];
  rutasActivacion: MaestroDto[] = [];

  constructor(public dialogRef: MatDialogRef<ModalActivarRutaComponent>) {}

  ngOnInit(): void {
    this.cargarTiposRutaActivacion();
    this.cargarRutasActivacion();
  }

  private cargarTiposRutaActivacion(): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-ruta-activacion`).subscribe({
      next: (lista) => {
        this.tiposRutaActivacion = lista;
      },
      error: () => {
        this.tiposRutaActivacion = [];
      }
    });
  }

  private cargarRutasActivacion(): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/rutas-activacion`).subscribe({
      next: (lista) => {
        this.rutasActivacion = lista;
      },
      error: () => {
        this.rutasActivacion = [];
      }
    });
  }

  onTipoChange(): void {
    this.data.cual = '';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

