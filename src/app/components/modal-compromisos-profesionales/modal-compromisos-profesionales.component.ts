import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { GrupoProfesionalDto, SolicitudService } from '../../services/solicitud.service';

@Component({
    selector: 'app-modal-compromisos-profesionales',
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
    templateUrl: './modal-compromisos-profesionales.component.html',
    styleUrls: ['./modal-compromisos-profesionales.component.scss']
})
export class ModalCompromisosProfesionalesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly solicitudService = inject(SolicitudService);
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  tiposCompromiso: MaestroDto[] = [];
  gruposProfesionales: GrupoProfesionalDto[] = [];
  cargandoCompromisos = false;
  cargandoProfesionales = false;

  data = {
    idtipocompromiso: null as number | null,
    idgrupoprofesional: null as number | null,
    compromisos: '',
    profesional: '',
    fecha: null as Date | null
  };

  constructor(public dialogRef: MatDialogRef<ModalCompromisosProfesionalesComponent>) { }

  ngOnInit(): void {
    this.cargarTiposCompromiso();
    this.cargarGruposProfesionales();
  }

  seleccionarCompromiso(idTipoCompromiso: number | null): void {
    const compromisoSeleccionado = this.tiposCompromiso.find((tipo) => tipo.id === idTipoCompromiso);
    this.data.idtipocompromiso = idTipoCompromiso;
    this.data.compromisos = compromisoSeleccionado?.nombre ?? '';
  }

  seleccionarProfesional(idGrupoProfesional: number | null): void {
    const profesionalSeleccionado = this.gruposProfesionales.find((grupo) => grupo.id === idGrupoProfesional);
    this.data.idgrupoprofesional = idGrupoProfesional;
    this.data.profesional = profesionalSeleccionado?.nombre ?? '';
  }

  guardar(): void {
    if (this.data.idtipocompromiso == null || this.data.idgrupoprofesional == null || !this.data.fecha) {
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

  private cargarGruposProfesionales(): void {
    this.cargandoProfesionales = true;
    this.solicitudService.listarGruposProfesionales().subscribe({
      next: (gruposProfesionales) => {
        this.gruposProfesionales = gruposProfesionales;
        this.cargandoProfesionales = false;
      },
      error: () => {
        this.gruposProfesionales = [];
        this.cargandoProfesionales = false;
      }
    });
  }
}