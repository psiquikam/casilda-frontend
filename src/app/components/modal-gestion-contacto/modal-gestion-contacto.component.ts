import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal-gestion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule
  ],
  templateUrl: './modal-gestion-contacto.component.html',
  styleUrls: ['./modal-gestion-contacto.component.scss']
})
export class ModalGestionComponent implements OnInit {

  contactoForm!: FormGroup;

  historialContactos: any[] = [];
  columnasHistorial: string[] = ['fecha', 'resultado', 'observacion'];

  resultados = [
    'Exitoso (Cita agendada)',
    'No contesta',
    'Buzón de voz',
    'Número equivocado',
    'Solicita llamar luego'
  ];

  jornadas = ['Mañana', 'Tarde'];

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {

    this.contactoForm = this.fb.group({
      fecha: [this.getToday(), Validators.required],
      hora: ['08:00', Validators.required],
      jornada: ['', Validators.required],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.minLength(5)]]
    });

    this.historialContactos = [
      {
        fecha: '2026-02-10',
        hora: '10:00 AM',
        jornada: 'Mañana',
        resultado: 'No contesta',
        observacion: 'Se intentó contacto sin éxito.'
      }
    ];
  }

  registrarIntento(): void {
    if (this.contactoForm.invalid) return;

    const val = this.contactoForm.value;

    const nuevo = {
      fecha: val.fecha,
      hora: this.formatearHora(val.hora),
      jornada: val.jornada,
      resultado: val.resultado,
      observacion: val.observacion
    };

    this.historialContactos = [nuevo, ...this.historialContactos];

    this.contactoForm.patchValue({
      jornada: '',
      resultado: '',
      observacion: ''
    });
  }

  private formatearHora(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  private getToday(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
