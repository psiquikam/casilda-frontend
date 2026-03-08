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

interface TipoTelefonoDto {
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
  templateUrl: './modal-telefono.component.html',
  styleUrls: ['./modal-telefono.component.scss']
})
export class ModalTelefonoComponent implements OnInit {

  private http = inject(HttpClient);

  tiposTelefono: TipoTelefonoDto[] = [];

  data = {
    tipoId: null as number | null,
    telefono: '',
    descripcion: ''
  };

  constructor(public dialogRef: MatDialogRef<ModalTelefonoComponent>) {}

  ngOnInit(): void {
    this.http.get<TipoTelefonoDto[]>(`${environment.apiBaseUrl}/maestros/tipos-telefono`).subscribe({
      next: (tipos) => this.tiposTelefono = tipos,
      error: (err) => console.error('Error al cargar tipos de teléfono:', err)
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
