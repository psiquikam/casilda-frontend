import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SolicitudService, GrupoProfesionalDto } from '../../services/solicitud.service';

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
  gruposProfesionales: GrupoProfesionalDto[] = [];

  tiposAsignacion = ['Prioritaria', 'Ordinaria', 'Seguimiento'];
  servicios = ['Psicología', 'Asesoría Jurídica', 'Trabajo Social', 'Dupla Psicosocial'];

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
      grupoProfesionalId: [null, Validators.required],
      observaciones: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.solicitudService.listarGruposProfesionales().subscribe({
      next: (grupos) => {
        this.gruposProfesionales = grupos;
      },
      error: (err) => console.error('Error al cargar grupos profesionales:', err)
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
