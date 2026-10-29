import { Component, Inject, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContactoMockService } from '../../services/contacto-mock.service';
import { ContactoTelefonicoDto, ContactoTelefonicoRequestDto } from '../../services/solicitud.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';

/** Resultados simulados mientras se desarrolla la integración con el backend. */
const RESULTADO_NO_CONTESTA = 'No contesta';
const RESULTADO_EXITOSO = 'Contesta y se concerta cita';
const RESULTADOS_CONTACTO = [
  RESULTADO_NO_CONTESTA,
  RESULTADO_EXITOSO,
  'Contesta, solicita nueva llamada',
  'No desea continuar con el acompañamiento'
];

@Component({
    selector: 'app-modal-gestion',
    imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule
],
    templateUrl: './modal-gestion-contacto.component.html',
    styleUrls: ['./modal-gestion-contacto.component.scss']
})
export class ModalGestionComponent implements OnInit {
  private readonly notificacion = inject(NotificacionService);

  contactoForm!: FormGroup;
  guardando = false;
  errorHistorial = false;

  historialContactos: ContactoTelefonicoDto[] = [];
  columnasHistorial: string[] = ['fecha', 'resultado', 'observacion'];

  resultados = RESULTADOS_CONTACTO;

  mostrarCamposCita = false;

  minCitaDate: Date = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  })();

  /** Máximo de llamadas antes de asignación unilateral de cita */
  maxLlamadas = 2;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalGestionComponent>,
    private contactoMock: ContactoMockService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.contactoForm = this.fb.group({
      fecha: [{ value: this.getToday(), disabled: true }, Validators.required],
      hora: [{ value: this.getHoraActual(), disabled: true }, Validators.required],
      jornada: [{ value: '', disabled: true }],
      resultado: ['', Validators.required],
      observacion: [''],
      fechaCita: [''],
      horaCita: ['']
    });

    const horaInicial = this.contactoForm.get('hora')?.value;
    this.contactoForm.patchValue({ jornada: this.calcularJornada(horaInicial) });

    this.contactoForm.get('hora')?.valueChanges.subscribe(hora => {
      if (hora) {
        this.contactoForm.patchValue({ jornada: this.calcularJornada(hora) }, { emitEvent: false });
      }
    });

    this.contactoForm.get('resultado')?.valueChanges.subscribe((value) => {
      this.recalcularMostrarCamposCita(value);
    });

    this.actualizarValidadoresContacto('');
    this.cargarHistorial();
  }

  /** Calcula si se deben mostrar los campos de cita según el resultado y el número de llamada */
  private recalcularMostrarCamposCita(resultado: string): void {
    const numeroDeLlamada = this.historialContactos.length + 1;
    const noContesta = resultado === RESULTADO_NO_CONTESTA;
    const esConcertada = resultado === RESULTADO_EXITOSO;
    const esUnilateral = !noContesta && numeroDeLlamada >= this.maxLlamadas;
    this.mostrarCamposCita = !noContesta && (esConcertada || esUnilateral);
    this.actualizarValidadoresContacto(resultado);
  }

  cargarHistorial(): void {
    if (!Number.isInteger(this.data?.id) || this.data.id <= 0) {
      this.errorHistorial = true;
      this.notificacion.error('No se pudo identificar la solicitud para cargar su historial.');
      return;
    }

    try {
      this.historialContactos = this.contactoMock.listarContactos(this.data.id)
        .map((contacto) => {
          const { fecha, hora } = this.separarFechaHora(contacto.fecha);
          return { ...contacto, fecha, hora };
        });
      this.errorHistorial = false;
      this.recalcularMostrarCamposCita(this.contactoForm.get('resultado')?.value);
    } catch (error) {
      this.historialContactos = [];
      this.errorHistorial = true;
      this.notificacion.error('No fue posible cargar el historial de contacto.', error);
    }
  }

  private actualizarValidadoresContacto(resultado: string): void {
    const observacion = this.contactoForm.get('observacion');
    const fechaCita = this.contactoForm.get('fechaCita');
    const horaCita = this.contactoForm.get('horaCita');

    if (resultado === RESULTADO_NO_CONTESTA) {
      observacion?.clearValidators();
      fechaCita?.clearValidators();
      horaCita?.clearValidators();
      this.contactoForm.patchValue({ fechaCita: '', horaCita: '' });
    } else {
      observacion?.setValidators([Validators.required, Validators.minLength(5)]);
      if (this.mostrarCamposCita) {
        fechaCita?.setValidators([Validators.required, this.dateGreaterThanTodayValidator.bind(this)]);
        horaCita?.setValidators([Validators.required]);
      } else {
        fechaCita?.clearValidators();
        horaCita?.clearValidators();
        this.contactoForm.patchValue({ fechaCita: '', horaCita: '' });
      }
    }

    observacion?.updateValueAndValidity({ emitEvent: false });
    fechaCita?.updateValueAndValidity({ emitEvent: false });
    horaCita?.updateValueAndValidity({ emitEvent: false });
  }

  private dateGreaterThanTodayValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? null : { dateNotGreaterThanToday: true };
  }

  private formatFecha(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha;
    return new Date(fecha).toISOString().substring(0, 10);
  }

  registrarIntento(): void {
    if (this.contactoForm.invalid || this.guardando) return;

    const val = this.contactoForm.getRawValue();
    this.guardando = true;

    const datos: ContactoTelefonicoRequestDto = {
      fecha: this.combinarFechaHoraParaBackend(val.fecha, val.hora),
      resultado: val.resultado,
      observacion: val.observacion || '',
      fechaCita: val.fechaCita ? this.formatFecha(val.fechaCita) : undefined,
      horaCita: val.horaCita || undefined
    };

    try {
      const contacto = this.contactoMock.registrarContacto(this.data.id, datos);
      if (contacto.citaCreada) {
        this.snackBar.open(
          `Cita registrada para el ${contacto.fechaCita ?? val.fechaCita}.`,
          'Cerrar',
          { duration: 5000, panelClass: ['snack-success'] }
        );
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.notificacion.error('No fue posible registrar el intento de contacto.', error);
    } finally {
      this.guardando = false;
    }
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

  private combinarFechaHoraParaBackend(fecha: string, hora: string): string {
    if (!fecha) return '';
    const horaNormalizada = hora && hora.trim() ? hora.trim() : '00:00';
    return `${fecha}T${horaNormalizada}:00`;
  }

  private separarFechaHora(fechaRaw: string): { fecha: string; hora: string } {
    if (!fechaRaw) {
      return { fecha: '', hora: '' };
    }

    const iso = fechaRaw.replace(' ', 'T');
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
      const day = parsed.getDate().toString().padStart(2, '0');
      const fecha = `${year}-${month}-${day}`;
      const hora = `${parsed.getHours().toString().padStart(2, '0')}:${parsed.getMinutes().toString().padStart(2, '0')}`;
      return { fecha, hora };
    }

    if (fechaRaw.includes('T')) {
      const [f, t] = fechaRaw.split('T');
      return { fecha: f ?? '', hora: (t ?? '').substring(0, 5) };
    }

    return { fecha: fechaRaw.substring(0, 10), hora: '' };
  }

  private calcularJornada(hora: string): string {
    const h = Number(hora.split(':')[0]);
    return h < 12 ? 'Mañana' : 'Tarde';
  }
}
