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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContactoTelefonicoDto } from '../../services/solicitud.service';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { DialogoService } from '../../core/a11y/dialogo.service';
import { AsignacionesService, SolicitudAsignada } from '../../services/asignaciones.service';
import { futureDateTime } from '../modal-reprogramar-cita/modal-reprogramar-cita.component';

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
    MatDatepickerModule,
    MatNativeDateModule
],
    templateUrl: './modal-gestion-contacto.component.html',
    styleUrls: ['./modal-gestion-contacto.component.scss']
})
export class ModalGestionComponent implements OnInit {
  private readonly notificacion = inject(NotificacionService);
  private readonly dialogo = inject(DialogoService);

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
    return today;
  })();

  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalGestionComponent>,
    private asignacionesService: AsignacionesService,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.contactoForm = this.fb.group({
      fecha: [this.getToday(), Validators.required],
      hora: [this.getHoraActual(), Validators.required],
      jornada: [{ value: '', disabled: true }],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.pattern(/\S/)]],
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

  private actualizarValidadoresCita(): void {
    if (this.mostrarCamposCita) {
      this.contactoForm.get('fechaCita')?.setValidators([Validators.required]);
      this.contactoForm.get('horaCita')?.setValidators([Validators.required]);
      this.contactoForm.setValidators(control => futureDateTime(control, true));
    } else {
      this.contactoForm.get('fechaCita')?.clearValidators();
      this.contactoForm.get('horaCita')?.clearValidators();
      this.contactoForm.clearValidators();
      this.contactoForm.patchValue({ fechaCita: '', horaCita: '' });
    }
    this.contactoForm.get('fechaCita')?.updateValueAndValidity();
    this.contactoForm.get('horaCita')?.updateValueAndValidity();
  }

  private formatFecha(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha;
    const date = new Date(fecha);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
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
        this.dialogRef.close(true);
        if (contacto.citaCreada) {
          this.dialogo.aviso({
            titulo: 'Cita agendada',
            icono: 'check_circle',
            mensaje: `La cita se registró para el ${contacto.fechaCita ?? this.formatFecha(val.fechaCita)}.`
          });
        }
      },
      error: (err) => {
        this.notificacion.error('No fue posible registrar el intento de contacto. Intente de nuevo.', err);
        this.guardando = false;
      }
    });
  }

  private getToday(): string {
    return this.formatFecha(new Date());
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
