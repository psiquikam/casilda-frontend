import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MaestroDto } from '../../services/listas.service';

/**
 * Validador personalizado a nivel de FormGroup que verifica que la fecha y hora sean mayor o igual a la actual
 */
export function futureDateTime(formGroup: AbstractControl): ValidationErrors | null {
  if (!(formGroup instanceof FormGroup)) {
    return null;
  }

  const fechaControl = formGroup.get('fechaCita');
  const horaControl = formGroup.get('horaCita');

  if (!fechaControl?.value || !horaControl?.value) {
    return null;
  }

  try {
    // Parsear la fecha seleccionada
    const fechaStr = fechaControl.value;
    const horaStr = horaControl.value;
    
    let selectedDateTime: Date;
    if (typeof fechaStr === 'string') {
      // Formato: YYYY-MM-DD
      const [year, month, day] = fechaStr.split('-').map(Number);
      const [hours, minutes] = horaStr.split(':').map(Number);
      selectedDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    } else {
      // Es un objeto Date
      const [hours, minutes] = horaStr.split(':').map(Number);
      selectedDateTime = new Date(fechaStr);
      selectedDateTime.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();

    if (selectedDateTime < now) {
      return { 'invalidDateTime': { value: `${fechaStr} ${horaStr}` } };
    }
  } catch (e) {
    return null;
  }

  return null;
}

@Component({
  selector: 'app-reprogramar-modal',
  standalone: true,
  templateUrl: './modal-reprogramar-cita.component.html',
  styleUrls: ['./modal-reprogramar-cita.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule
  ]
})
export class ReprogramarCitaModalComponent implements OnInit {
  gestionForm: FormGroup;
  motivos: MaestroDto[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<ReprogramarCitaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { caso: any, accion: 'cancelar' | 'reprogramar' }
  ) {
    this.gestionForm = this.fb.group({
      fechaCita: ['', Validators.required],
      horaCita: ['08:00', Validators.required],
      idMotivoEstadoCita: [null, Validators.required],
      observaciones: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    if (this.data.accion === 'cancelar') {
      this.gestionForm.get('fechaCita')?.clearValidators();
      this.gestionForm.get('fechaCita')?.updateValueAndValidity();
      this.gestionForm.get('horaCita')?.clearValidators();
      this.gestionForm.get('horaCita')?.updateValueAndValidity();
    } else if (this.data.accion === 'reprogramar') {
      // Agregar validador de fecha y hora para reprogramación
      this.gestionForm.setValidators(futureDateTime);
      this.gestionForm.updateValueAndValidity();
    }
    if (this.data.caso && this.data.caso.fecha) {
      this.gestionForm.patchValue({
        fechaCita: this.data.caso.fecha
      });
    }
    this.http.get<MaestroDto[]>(`${environment.apiBaseUrl}/maestros/motivos-estado-cita`).subscribe({
      next: (lista) => { this.motivos = lista; },
      error: () => { this.motivos = []; }
    });
  }

  get titulo(): string {
    return this.data.accion === 'cancelar' ? 'Cancelar Cita' : 'Reprogramar Cita';
  }

  get icono(): string {
    return this.data.accion === 'cancelar' ? 'event_busy' : 'event_repeat';
  }

  get colorBoton(): string {
    return this.data.accion === 'cancelar' ? 'warn' : 'primary';
  }

  private formatFecha(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha;
    return new Date(fecha).toISOString().substring(0, 10);
  }

  guardar() {
    if (this.gestionForm.valid) {
      const val = this.gestionForm.value;
      this.dialogRef.close({
        id: this.data.caso.id,
        accion: this.data.accion,
        formulario: { ...val, fechaCita: this.formatFecha(val.fechaCita) }
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}
