import { Component, inject, OnInit } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/a11y/notificacion.service';

export interface MaestroDto {
  id: number;
  nombre: string;
}

@Component({
    selector: 'app-modal-discapacidad',
    imports: [
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
  private readonly notificacion = inject(NotificacionService);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;
  private readonly nombreCatalogo = 'Clasificación funcional';

  data = {
    tipo: '',
    subTipo: '',
    descripcion: '',
    idSubTipoDiscapacidad: null as number | null
  };

  selectedSubTipoId: number | null = null;

  onSubTipoChange(subTipoId: number | null): void {
    const subTipoSeleccionado = this.subTiposDiscapacidad.find((s) => s.id === subTipoId);
    this.selectedSubTipoId = subTipoSeleccionado?.id ?? null;
    this.data.subTipo = subTipoSeleccionado?.nombre ?? '';
    this.data.idSubTipoDiscapacidad = this.selectedSubTipoId;
  }

  subTiposDiscapacidad: MaestroDto[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalDiscapacidadComponent>
  ) {}

  ngOnInit(): void {
    this.cargarDiscapacidades();
  }

  private cargarDiscapacidades(): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipo-discapacidad`).subscribe({
      next: (lista) => {
        const catalogo = lista.find((tipo) => tipo.nombre === this.nombreCatalogo);
        if (!catalogo) {
          this.notificacion.error('El catálogo de discapacidad aún no está configurado.');
          return;
        }
        this.data.tipo = catalogo.nombre;
        this.http.get<MaestroDto[]>(`${this.maestrosUrl}/subtipo-discapacidad/${catalogo.id}`).subscribe({
          next: (opciones) => {
            this.subTiposDiscapacidad = opciones;
            if (!opciones.length) {
              this.notificacion.error('El catálogo de discapacidad no tiene opciones disponibles.');
            }
          },
          error: (error) => this.notificacion.error('No fue posible cargar las discapacidades.', error)
        });
      },
      error: (error) => this.notificacion.error('No fue posible cargar el catálogo de discapacidad.', error)
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
