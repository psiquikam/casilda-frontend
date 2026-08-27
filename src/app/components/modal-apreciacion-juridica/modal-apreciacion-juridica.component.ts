import { Component, OnInit, inject } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface MaestroDto {
  id: number;
  nombre: string;
}

@Component({
    selector: 'app-modal-apreciacion-juridica',
    imports: [
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
export class ModalApreciacionJuridicaComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  data = {
    idTipoApreciacion: null as number | null,
    tipo: '',
    descripcion: ''
  };

  tiposApreciacion: MaestroDto[] = [];

  onTipoChange(id: number): void {
    const selected = this.tiposApreciacion.find(t => t.id === id);
    if (selected) {
      this.data.tipo = selected.nombre;
    }
  }

  constructor(public dialogRef: MatDialogRef<ModalApreciacionJuridicaComponent>) { }

  ngOnInit(): void {
    this.cargarTiposApreciacion();
  }

  private cargarTiposApreciacion(): void {
    // ID 1 corresponds to 'Jurídica' from the database
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-apreciacion/1`).subscribe({
      next: (lista) => {
        this.tiposApreciacion = lista;
      },
      error: () => {
        this.tiposApreciacion = [];
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}