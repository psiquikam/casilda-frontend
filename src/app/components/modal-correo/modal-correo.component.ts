import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface TipoCorreoDto {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modal-correo',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './modal-correo.component.html',
  styleUrls: ['./modal-correo.component.scss']
})
export class ModalCorreoComponent implements OnInit {

  private http = inject(HttpClient);

  tiposCorreo: TipoCorreoDto[] = [];

  data = {
    tipoId: null as number | null,
    tipo: '',
    correo: '',
    descripcion: '',
  };

  constructor(public dialogRef: MatDialogRef<ModalCorreoComponent>) { }

  ngOnInit(): void {
    this.http.get<TipoCorreoDto[]>(`${environment.apiBaseUrl}/maestros/tipos-correo`).subscribe({
      next: (tipos) => this.tiposCorreo = tipos,
      error: (err) => console.error('Error al cargar tipos de correo:', err)
    });
  }

  onTipoChange(id: number): void {
    const found = this.tiposCorreo.find(t => t.id === id);
    this.data.tipo = found ? found.nombre : '';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
