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
      tipo: '',
      telefono: ''
    };

  constructor(public dialogRef: MatDialogRef<ModalTelefonoComponent>) {}

  ngOnInit(): void {
    this.http.get<TipoTelefonoDto[]>(`${environment.apiBaseUrl}/maestros/tipos-telefono`).subscribe({
      next: (tipos) => this.tiposTelefono = tipos,
      error: (err) => console.error('Error al cargar tipos de teléfono:', err)
    });
  }

  onTipoChange(id: number): void {
    const found = this.tiposTelefono.find((t) => t.id === id);
    this.data.tipo = found ? found.nombre : '';
  }

  soloDigitosTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, 10);
    if (input.value !== limpio) {
      input.value = limpio;
    }
    this.data.telefono = limpio;
  }

  get canSubmit(): boolean {
    return this.data.tipoId !== null &&
      this.data.telefono.trim().length === 10;
  }

  guardar(): void {
    if (!this.canSubmit) {
      return;
    }

    this.dialogRef.close({
      ...this.data,
      telefono: this.data.telefono.trim()
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
