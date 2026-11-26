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
import { MaestroDto } from '../../services/listas.service';
import { RegistroVbgDatosService } from '../../services/registro-vbg-datos.service';

/**
 * Validador personalizado a nivel de FormGroup que verifica que la fecha y hora sean mayor o igual a la actual
 */
export function futureDateTime(formGroup: AbstractControl, permitirMinutoActual = false): ValidationErrors | null {
  if (!(formGroup instanceof FormGroup)) {
    return null;
  }

  const fechaControl = formGroup.get('fechaCita');
  const horaControl = formGroup.get('horaCita');

  if (!fechaControl?.value || !horaControl?.value) {
    return null;
  }

  const fechaStr = fechaControl.value;
  const horaStr = horaControl.value;
  const horaMatch = typeof horaStr === 'string' ? horaStr.match(/^(\d{2}):(\d{2})$/) : null;
  if (!horaMatch) {
    return { invalidDateTime: { value: `${fechaStr} ${horaStr}` } };
  }

  const hours = Number(horaMatch[1]);
  const minutes = Number(horaMatch[2]);
  if (hours > 23 || minutes > 59) {
    return { invalidDateTime: { value: `${fechaStr} ${horaStr}` } };
  }

  let year: number;
  let month: number;
  let day: number;
  if (fechaStr instanceof Date) {
    year = fechaStr.getFullYear();
    month = fechaStr.getMonth() + 1;
    day = fechaStr.getDate();
  } else if (typeof fechaStr === 'string') {
    const isoDate = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const localDate = fechaStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (isoDate) {
      year = Number(isoDate[1]);
      month = Number(isoDate[2]);
      day = Number(isoDate[3]);
    } else if (localDate) {
      year = Number(localDate[3]);
      month = Number(localDate[2]);
      day = Number(localDate[1]);
    } else {
      return { invalidDateTime: { value: `${fechaStr} ${horaStr}` } };
    }
  } else {
    return { invalidDateTime: { value: `${fechaStr} ${horaStr}` } };
  }

  const selectedDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const limite = permitirMinutoActual ? Math.floor(Date.now() / 60000) * 60000 : Date.now();
  if (selectedDateTime.getFullYear() !== year
      || selectedDateTime.getMonth() !== month - 1
      || selectedDateTime.getDate() !== day
      || (permitirMinutoActual ? selectedDateTime.getTime() < limite : selectedDateTime.getTime() <= limite)) {
    return { invalidDateTime: { value: `${fechaStr} ${horaStr}` } };
  }

  return null;
}

@Component({
    selector: 'app-reprogramar-modal',
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
    private readonly registroVbgDatos: RegistroVbgDatosService,
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
      const fechaCita = this.parseFechaCita(this.data.caso.fecha);
      this.gestionForm.patchValue({
        fechaCita
      });
    }
    this.registroVbgDatos.listarMotivosEstadoCita().subscribe({
      next: (lista) => { this.motivos = lista; },
      error: () => { this.motivos = []; }
    });
  }

  get titulo(): string {
    return this.data.accion === 'cancelar' ? 'Cancelar cita' : 'Reprogramar cita';
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

  private parseFechaCita(fecha: unknown): Date | null {
    if (fecha instanceof Date) return fecha;
    if (typeof fecha !== 'string') return null;

    const isoDate = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const localDate = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    const match = isoDate
      ? [isoDate[0], isoDate[1], isoDate[2], isoDate[3]]
      : localDate
        ? [localDate[0], localDate[3], localDate[2], localDate[1]]
        : null;
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year
      && parsedDate.getMonth() === month - 1
      && parsedDate.getDate() === day
      ? parsedDate
      : null;
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
