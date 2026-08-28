import { Component, OnInit, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../environments/environment';
import { MaestroDto } from '../../services/listas.service';

@Component({
    selector: 'app-modal-compromisos-persona',
    imports: [
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
    templateUrl: './modal-compromisos-persona.component.html',
    styleUrls: ['./modal-compromisos-persona.component.scss']
})
export class ModalCompromisosPersonaComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  tiposCompromiso: MaestroDto[] = [];
  cargandoCompromisos = false;

  data = {
    idtipocompromiso: null as number | null,
    compromisos: '',
    fecha: null as Date | null
  };

  constructor(public dialogRef: MatDialogRef<ModalCompromisosPersonaComponent>) { }

  ngOnInit(): void {
    this.cargarTiposCompromiso();
  }

  seleccionarCompromiso(idTipoCompromiso: number | null): void {
    const compromisoSeleccionado = this.tiposCompromiso.find((tipo) => tipo.id === idTipoCompromiso);
    this.data.idtipocompromiso = idTipoCompromiso;
    this.data.compromisos = compromisoSeleccionado?.nombre ?? '';
  }

  guardar(): void {
    if (this.data.idtipocompromiso == null || !this.data.fecha) {
      return;
    }

    this.dialogRef.close({ ...this.data });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  private cargarTiposCompromiso(): void {
    this.cargandoCompromisos = true;
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-compromiso`).subscribe({
      next: (tiposCompromiso) => {
        this.tiposCompromiso = tiposCompromiso;
        this.cargandoCompromisos = false;
      },
      error: () => {
        this.tiposCompromiso = [];
        this.cargandoCompromisos = false;
      }
    });
  }
}