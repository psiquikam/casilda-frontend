import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reprogramar-modal',
  standalone: true,
  templateUrl: './modal-reprogramar-cita.component.html',
  styleUrls: ['./modal-reprogramar-cita.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule
  ]
})
export class ReprogramarCitaModalComponent implements OnInit {
  gestionForm: FormGroup;

  listaMotivos = [
    'Inasistencia injustificada',
    'Cambio de agenda de la dupla o la profesional',
    'Circunstancias externas',
    'Solicitud de persona a atender',
    'NA'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReprogramarCitaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { caso: any, accion: 'cancelar' | 'reprogramar' }
  ) {
    // Inicializamos el formulario
    this.gestionForm = this.fb.group({
      fechaCita: ['', Validators.required],
      horaCita: ['08:00', Validators.required], // Hora por defecto
      motivo: ['', Validators.required],
      observaciones: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Si el caso ya tiene fecha (está programada), la cargamos automáticamente
    if (this.data.caso && this.data.caso.fecha) {
      this.gestionForm.patchValue({
        fechaCita: this.data.caso.fecha
      });
    }
  }

  // Getters para cambiar dinámicamente la UI
  get titulo(): string {
    return this.data.accion === 'cancelar' ? 'Cancelar Cita' : 'Reprogramar Cita';
  }

  get icono(): string {
    return this.data.accion === 'cancelar' ? 'event_busy' : 'event_repeat';
  }

  get colorBoton(): string {
    return this.data.accion === 'cancelar' ? 'warn' : 'primary';
  }

  guardar() {
    if (this.gestionForm.valid) {
      this.dialogRef.close({
        id: this.data.caso.id,
        accion: this.data.accion,
        formulario: this.gestionForm.value
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}