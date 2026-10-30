import { Component, Inject, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContactoTelefonicoDto } from '../../services/solicitud.service';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { AsignacionesService, SolicitudAsignada } from '../../services/asignaciones.service';

/** Resultado que permite concertar cita en primera llamada */
const RESULTADO_EXITOSO = 'Contesta y se concerta cita';
/** Resultado fijo cuando la persona desiste del acompañamiento */
const RESULTADO_DESISTIMIENTO = 'Desistimiento';

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
    MatProgressSpinnerModule,
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
  cargandoHistorial = false;

  historialContactos: ContactoTelefonicoDto[] = [];
  columnasHistorial: string[] = ['fecha', 'resultado', 'observacion'];

  resultados: string[] = [];

  mostrarCamposCita = false;
  esDesistimiento = false;
  readonly resultadoDesistimiento = RESULTADO_DESISTIMIENTO;

  minCitaDate: Date = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  })();

  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalGestionComponent>,
    private asignacionesService: AsignacionesService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.contactoForm = this.fb.group({
      fecha: [this.getToday(), Validators.required],
      hora: [this.getHoraActual(), Validators.required],
      jornada: [{ value: '', disabled: true }],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.minLength(5)]],
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

    this.esDesistimiento = this.data?.modo === 'desistimiento';
    if (this.esDesistimiento) {
      this.contactoForm.patchValue({ resultado: RESULTADO_DESISTIMIENTO });
    }
    this.cargarResultados();
    this.cargarHistorial();
  }

  /** La fecha y hora de cita solo se habilitan cuando se concierta cita en la llamada. */
  private recalcularMostrarCamposCita(resultado: string): void {
    this.mostrarCamposCita = resultado === RESULTADO_EXITOSO;
    this.actualizarValidadoresCita();
  }

  cargarResultados(): void {
    this.http.get<{ id: number; nombre: string }[]>(`${this.maestrosUrl}/resultados-contacto-telefonico`).subscribe({
      next: (lista) => { this.resultados = lista.map(r => r.nombre); },
      error: () => { this.resultados = []; }
    });
  }

  cargarHistorial(): void {
    const solicitud = this.data?.solicitudAsignada as SolicitudAsignada | undefined;
    if (!solicitud) return;
    this.cargandoHistorial = true;
    this.asignacionesService.listarContactos(solicitud).subscribe({
      next: (contactos) => {
        this.historialContactos = contactos.map((c) => {
          const { fecha, hora } = this.separarFechaHora(c.fecha);
          return { ...c, fecha, hora };
        });
        this.cargandoHistorial = false;
      },
      error: () => { this.cargandoHistorial = false; }
    });
  }

  private dateGreaterThanTodayValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? null : { dateNotGreaterThanToday: true };
  }

  private actualizarValidadoresCita(): void {
    if (this.mostrarCamposCita) {
      this.contactoForm.get('fechaCita')?.setValidators([Validators.required, this.dateGreaterThanTodayValidator.bind(this)]);
      this.contactoForm.get('horaCita')?.setValidators([Validators.required]);
    } else {
      this.contactoForm.get('fechaCita')?.clearValidators();
      this.contactoForm.get('horaCita')?.clearValidators();
      this.contactoForm.patchValue({ fechaCita: '', horaCita: '' });
    }
    this.contactoForm.get('fechaCita')?.updateValueAndValidity();
    this.contactoForm.get('horaCita')?.updateValueAndValidity();
  }

  private formatFecha(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha;
    return new Date(fecha).toISOString().substring(0, 10);
  }

  registrarIntento(): void {
    if (this.contactoForm.invalid) return;

    const solicitud = this.data?.solicitudAsignada as SolicitudAsignada | undefined;
    if (!solicitud) {
      this.notificacion.error('No fue posible identificar la solicitud que se desea gestionar.');
      return;
    }

    const val = this.contactoForm.getRawValue();
    this.guardando = true;

    this.asignacionesService.registrarContacto(solicitud, {
      fecha: this.combinarFechaHoraParaBackend(val.fecha, val.hora),
      resultado: val.resultado,
      observacion: val.observacion,
      fechaCita: val.fechaCita ? this.formatFecha(val.fechaCita) : undefined,
      horaCita: val.horaCita || undefined
    }).subscribe({
      next: (contacto) => {
        this.guardando = false;
        if (contacto.citaCreada) {
          this.snackBar.open(
            `✅ Cita registrada para el ${contacto.fechaCita ?? val.fechaCita}.`,
            'Cerrar',
            { duration: 5000, panelClass: ['snack-success'] }
          );
        }
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notificacion.error('No fue posible registrar el intento de contacto. Intente de nuevo.', err);
        this.guardando = false;
      }
    });
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
