import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { SolicitudService, GrupoProfesionalDto } from '../../services/solicitud.service';
import { MaestroDto } from '../../services/listas.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reparto-modal',
  standalone: true,
  templateUrl: './modal-reparto.component.html',
  styleUrls: ['./modal-reparto.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class RepartoModalComponent implements OnInit {
  repartoForm: FormGroup;
  gruposProfesionales: GrupoProfesionalDto[] = [];

  tiposAsignacion: MaestroDto[] = [];
  tiposServicio: MaestroDto[] = [];

  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<RepartoModalComponent>,
    private solicitudService: SolicitudService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.repartoForm = this.fb.group({
      idTipoAsignacion: [null, Validators.required],
      fechaReparto: [new Date().toISOString().substring(0, 10)],
      idTipoServicio: [null, Validators.required],
      grupoProfesionalId: [null, Validators.required],
      observaciones: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    forkJoin({
      tiposAsignacion: this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-asignacion`),
      tiposServicio: this.http.get<MaestroDto[]>(`${this.maestrosUrl}/tipos-servicio`),
      grupos: this.solicitudService.listarGruposProfesionales()
    }).subscribe({
      next: ({ tiposAsignacion, tiposServicio, grupos }) => {
        this.tiposAsignacion = tiposAsignacion;
        this.tiposServicio = tiposServicio;
        this.gruposProfesionales = grupos;
      },
      error: (err) => console.error('Error al cargar datos del formulario:', err)
    });
  }

  guardar() {
    if (this.repartoForm.valid) {
      this.dialogRef.close({
        ...this.repartoForm.value,
        idCaso: this.data.id
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}

