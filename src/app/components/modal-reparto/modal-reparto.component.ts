import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SolicitudService, ProfesionalDto } from '../../services/solicitud.service';

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
    MatIconModule
  ]
})
export class RepartoModalComponent implements OnInit {
  repartoForm: FormGroup;
  profesionalesAsignados: any[] = [];

  tiposAsignacion = ['Prioritaria', 'Ordinaria', 'Seguimiento'];
  servicios = ['Psicología', 'Asesoría Jurídica', 'Trabajo Social', 'Dupla Psicosocial'];

  opcionesAsignacion: { id: number; nombre: string; cargo: string; esGrupo?: boolean }[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RepartoModalComponent>,
    private solicitudService: SolicitudService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.repartoForm = this.fb.group({
      tipoAsignacion: ['', Validators.required],
      fechaReparto: [new Date().toISOString().substring(0, 10)],
      servicio: ['', Validators.required],
      seleccionTemp: [''],
      observaciones: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.solicitudService.listarProfesionales().subscribe({
      next: (profesionales) => {
        this.opcionesAsignacion = profesionales.map(p => ({
          id: p.id,
          nombre: p.nombre,
          cargo: p.cargo
        }));
      },
      error: (err) => console.error('Error al cargar profesionales:', err)
    });
  }

  agregarAsignacion() {
    const idSeleccionado = this.repartoForm.get('seleccionTemp')?.value;
    if (!idSeleccionado) return;

    const opcion = this.opcionesAsignacion.find(o => o.id === idSeleccionado);
    if (opcion) {
      this.insertarSinDuplicados({ id: opcion.id, nombre: opcion.nombre });
    }
  }

  private insertarSinDuplicados(persona: any) {
    const existe = this.profesionalesAsignados.some(p => p.id === persona.id);
    if (!existe) {
      this.profesionalesAsignados.push(persona);
    }
  }

  guardar() {
    if (this.repartoForm.valid && this.profesionalesAsignados.length > 0) {
      const { seleccionTemp, ...datosForm } = this.repartoForm.value;
      this.dialogRef.close({
        ...datosForm,
        idsProfesionales: this.profesionalesAsignados.map(p => p.id),
        nombresProfesionales: this.profesionalesAsignados.map(p => p.nombre).join(' & '),
        idCaso: this.data.id
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}
