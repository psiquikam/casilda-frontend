import { Component, OnInit, inject } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/a11y/notificacion.service';

interface TipoCorreoDto {
  id: number;
  nombre: string;
}

@Component({
    selector: 'app-modal-correo',
    imports: [
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
  private readonly notificacion = inject(NotificacionService);

  private http = inject(HttpClient);

  tiposCorreo: TipoCorreoDto[] = [];

  data = {
    tipoId: null as number | null,
    tipo: '',
    correo: ''
  };

  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: (control) => Boolean(
      control?.invalid && (control.dirty || control.touched || this.data.correo)
    )
  };

  constructor(public dialogRef: MatDialogRef<ModalCorreoComponent>) { }

  ngOnInit(): void {
    this.http.get<TipoCorreoDto[]>(`${environment.apiBaseUrl}/maestros/tipos-correo`).subscribe({
      next: (tipos) => this.tiposCorreo = tipos,
      error: (err) => this.notificacion.error('No fue posible cargar los tipos de correo. Cierre el diálogo e intente de nuevo.', err)
    });
  }

  onTipoChange(id: number): void {
    const found = this.tiposCorreo.find(t => t.id === id);
    this.data.tipo = found ? found.nombre : '';
  }

  get esInstitucional(): boolean {
    return (this.data.tipo || '').toLowerCase().includes('institucional');
  }

  get patronCorreo(): string {
    return this.esInstitucional
      ? '^[a-zA-Z0-9._%+-]+@udea\\.edu\\.co$'
      : '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  }

  isValidEmail(email: string): boolean {
    const trimmed = (email || '').trim();
    if (this.esInstitucional) {
      return /^[a-zA-Z0-9._%+-]+@udea\.edu\.co$/i.test(trimmed);
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed);
  }

  get canSubmit(): boolean {
    return this.data.tipoId !== null &&
      this.isValidEmail(this.data.correo);
  }

  guardar(): void {
    if (!this.canSubmit) {
      return;
    }

    this.dialogRef.close({
      ...this.data,
      correo: this.data.correo.trim()
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
