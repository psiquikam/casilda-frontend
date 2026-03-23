import { Component, inject, OnInit } from '@angular/core';
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
  selector: 'app-modal-discapacidad',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './modal-discapacidad.component.html',
  styleUrls: ['./modal-discapacidad.component.scss']
})
export class ModalDiscapacidadComponent implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  data = {
    tipo: '',
    subTipo: '',
    descripcion: ''
  };

  selectedTipoId: number | null = null;

  tiposDiscapacidad: MaestroDto[] = [];
  subTiposDiscapacidad: MaestroDto[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalDiscapacidadComponent>
  ) {}

  ngOnInit(): void {
    this.cargarTiposDiscapacidad();
  }

  private cargarTiposDiscapacidad(): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipo-discapacidad`).subscribe({
      next: (lista) => {
        this.tiposDiscapacidad = lista;
      },
      error: () => {
        this.tiposDiscapacidad = [];
      }
    });
  }

  onTipoChange(tipoId: number | null): void {
    this.selectedTipoId = tipoId;
    this.data.subTipo = '';

    const tipoSeleccionado = this.tiposDiscapacidad.find((t) => t.id === tipoId);
    this.data.tipo = tipoSeleccionado?.nombre ?? '';

    if (!tipoId) {
      this.subTiposDiscapacidad = [];
      return;
    }

    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/subtipo-discapacidad/${tipoId}`).subscribe({
      next: (lista) => {
        this.subTiposDiscapacidad = lista;
      },
      error: () => {
        this.subTiposDiscapacidad = [];
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
