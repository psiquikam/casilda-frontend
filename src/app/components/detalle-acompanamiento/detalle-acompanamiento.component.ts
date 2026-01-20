import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-detalle-acompanamiento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ],
  templateUrl: './detalle-acompanamiento.component.html',
  styleUrls: ['./detalle-acompanamiento.component.scss']
})
export class DetalleAcompanamientoComponent implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  idCaso: string = '';
  contactoForm!: FormGroup;

  historialContactos = [
    {
      fecha: '2025-12-18',
      hora: '09:00 AM',
      jornada: 'Mañana',
      resultado: 'No contesta',
      observacion: 'Se marcó al celular termina en 40'
    },
    {
      fecha: '2025-12-18',
      hora: '02:30 PM',
      jornada: 'Tarde',
      resultado: 'Buzón de voz',
      observacion: 'Se deja mensaje de voz'
    }
  ];

  displayedColumns: string[] = [
    'fecha',
    'jornada',
    'resultado',
    'observacion'
  ];

  resultados = [
    'Exitoso (Cita agendada)',
    'No contesta',
    'Buzón de voz',
    'Número equivocado',
    'Solicita llamar luego'
  ];

  jornadas = ['Mañana', 'Tarde'];

  ngOnInit(): void {
    this.idCaso = this.route.snapshot.paramMap.get('id') || 'ACO-TEMP';

    this.contactoForm = this.fb.group({
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      hora: ['08:00', Validators.required],
      jornada: ['', Validators.required],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  registrarIntento(): void {
    if (this.contactoForm.invalid) {
      return;
    }

    const value = this.contactoForm.value;

    const nuevoRegistro = {
      fecha: value.fecha,
      hora: this.formatearHora(value.hora),
      jornada: value.jornada,
      resultado: value.resultado,
      observacion: value.observacion
    };

    this.historialContactos = [
      nuevoRegistro,
      ...this.historialContactos
    ];

    this.contactoForm.reset({
      fecha: new Date().toISOString().substring(0, 10),
      hora: '08:00',
      jornada: '',
      resultado: '',
      observacion: ''
    });
  }

  private formatearHora(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hora12 = h % 12 || 12;
    return `${hora12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
}
