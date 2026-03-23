import { Component, OnInit, inject } from '@angular/core';
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
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface MaestroDto {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modal-remision',
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
  templateUrl: './modal-remision.component.html',
  styleUrls: ['./modal-remision.component.scss']
})
export class ModalRemisionComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  data = {
    tipo: '',
    cual: '',
    fecha: null as Date | null
  };

  tiposRemision: MaestroDto[] = [];

  constructor(public dialogRef: MatDialogRef<ModalRemisionComponent>) {}

  ngOnInit(): void {
    this.cargarTiposRemision();
  }

  private cargarTiposRemision(): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-remision`).subscribe({
      next: (lista) => {
        this.tiposRemision = lista;
      },
      error: () => {
        this.tiposRemision = [];
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}