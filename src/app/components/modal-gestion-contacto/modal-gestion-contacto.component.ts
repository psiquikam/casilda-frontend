import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
    'Exitoso',
    'No contesta',
    'Buzón de voz',
    'Número equivocado',
    'Solicita llamar luego'
  ];

  jornadas = ['Mañana', 'Tarde'];

  tiposCita = ['Presencial', 'Virtual', 'Telefónica'];

  mostrarCamposCita = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalGestionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {

    this.contactoForm = this.fb.group({
      fecha: [this.getToday(), Validators.required],
      hora: [this.getHoraActual(), Validators.required],
      jornada: [{ value: '', disabled: true }, Validators.required],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.minLength(5)]],
      fechaCita: [''],
      horaCita: [''],
      tipoCita: ['']
    });

    const horaInicial = this.contactoForm.get('hora')?.value;
    this.contactoForm.patchValue({
      jornada: this.calcularJornada(horaInicial)
    });

    this.contactoForm.get('hora')?.valueChanges.subscribe(hora => {
      if (hora) {
        const jornada = this.calcularJornada(hora);
        this.contactoForm.patchValue({ jornada }, { emitEvent: false });
      }
    });

    this.contactoForm.get('resultado')?.valueChanges.subscribe((value) => {

      const fallidosPrevios = this.historialContactos.filter(h => h.resultado !== 'Exitoso').length;

      const totalFallidos = value !== 'Exitoso'
        ? fallidosPrevios + 1
        : fallidosPrevios;

      this.mostrarCamposCita = value === 'Exitoso' || totalFallidos >= 2;

      if (this.mostrarCamposCita) {
        this.contactoForm.get('fechaCita')?.setValidators([Validators.required]);
        this.contactoForm.get('horaCita')?.setValidators([Validators.required]);
        this.contactoForm.get('tipoCita')?.setValidators([Validators.required]);
      } else {
        this.contactoForm.get('fechaCita')?.clearValidators();
        this.contactoForm.get('horaCita')?.clearValidators();
        this.contactoForm.get('tipoCita')?.clearValidators();

        this.contactoForm.patchValue({
          fechaCita: '',
          horaCita: '',
          tipoCita: ''
        });
      }

      this.contactoForm.get('fechaCita')?.updateValueAndValidity();
      this.contactoForm.get('horaCita')?.updateValueAndValidity();
      this.contactoForm.get('tipoCita')?.updateValueAndValidity();
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

    this.evaluarCita();
  }

  private evaluarCita(): void {
    const resultado = this.contactoForm.get('resultado')?.value;

    const fallidos = this.historialContactos.filter(h => h.resultado !== 'Exitoso').length;

    const activar = resultado === 'Exitoso' || fallidos >= 2;

    this.mostrarCamposCita = activar;

    if (activar) {
      this.contactoForm.get('fechaCita')?.setValidators([Validators.required]);
      this.contactoForm.get('horaCita')?.setValidators([Validators.required]);
      this.contactoForm.get('tipoCita')?.setValidators([Validators.required]);
    } else {
      this.contactoForm.get('fechaCita')?.clearValidators();
      this.contactoForm.get('horaCita')?.clearValidators();
      this.contactoForm.get('tipoCita')?.clearValidators();

      this.contactoForm.patchValue({
        fechaCita: '',
        horaCita: '',
        tipoCita: ''
      });
    }

    this.contactoForm.get('fechaCita')?.updateValueAndValidity();
    this.contactoForm.get('horaCita')?.updateValueAndValidity();
    this.contactoForm.get('tipoCita')?.updateValueAndValidity();
  }

  registrarIntento(): void {
    if (this.contactoForm.invalid) return;

    const val = this.contactoForm.getRawValue();

    const nuevo = {
      fecha: val.fecha,
      hora: this.formatearHora(val.hora),
      jornada: val.jornada,
      resultado: val.resultado,
      observacion: val.observacion
    };

    this.historialContactos = [nuevo, ...this.historialContactos];

    this.dialogRef.close(nuevo);
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

  private getHoraActual(): string {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private calcularJornada(hora: string): string {
    const h = Number(hora.split(':')[0]);
    return h < 12 ? 'Mañana' : 'Tarde';
  }
}