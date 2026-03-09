import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { SolicitudService, ContactoTelefonicoDto } from '../../services/solicitud.service';
import { environment } from '../../../environments/environment';

/** Resultado que permite concertar cita en primera llamada */
const RESULTADO_EXITOSO = 'Contesta y se concerta cita';

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
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './modal-gestion-contacto.component.html',
  styleUrls: ['./modal-gestion-contacto.component.scss']
})
export class ModalGestionComponent implements OnInit {

  contactoForm!: FormGroup;
  guardando = false;
  cargandoHistorial = false;

  historialContactos: ContactoTelefonicoDto[] = [];
  columnasHistorial: string[] = ['fecha', 'resultado', 'observacion'];

  resultados: string[] = [];

  mostrarCamposCita = false;

  /** Máximo de llamadas antes de asignación unilateral de cita */
  maxLlamadas = 2;

  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;
  private readonly parametrosUrl = `${environment.apiBaseUrl}/parametros`;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalGestionComponent>,
    private solicitudService: SolicitudService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.contactoForm = this.fb.group({
      fecha: [{ value: this.getToday(), disabled: true }, Validators.required],
      hora: [{ value: this.getHoraActual(), disabled: true }, Validators.required],
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

    // Cargar datos desde el backend
    this.cargarMaxLlamadas();
    this.cargarResultados();
    this.cargarHistorial();
  }

  /** Calcula si se deben mostrar los campos de cita según el resultado y el número de llamada */
  private recalcularMostrarCamposCita(resultado: string): void {
    const numeroDeLlamada = this.historialContactos.length + 1;
    const esConcertada = resultado === RESULTADO_EXITOSO;
    const esUnilateral = numeroDeLlamada >= this.maxLlamadas;
    this.mostrarCamposCita = esConcertada || esUnilateral;
    this.actualizarValidadoresCita();
  }

  cargarMaxLlamadas(): void {
    this.http.get<number>(`${this.parametrosUrl}/max-llamadas-contacto`).subscribe({
      next: (valor) => {
        this.maxLlamadas = valor;
        // Recalcular por si ya hay resultado seleccionado
        const resultado = this.contactoForm.get('resultado')?.value;
        if (resultado) this.recalcularMostrarCamposCita(resultado);
      },
      error: () => { this.maxLlamadas = 2; }
    });
  }

  cargarResultados(): void {
    this.http.get<{ id: number; nombre: string }[]>(`${this.maestrosUrl}/resultados-contacto-telefonico`).subscribe({
      next: (lista) => { this.resultados = lista.map(r => r.nombre); },
      error: () => { this.resultados = []; }
    });
  }

  cargarHistorial(): void {
    if (!this.data?.id) return;
    this.cargandoHistorial = true;
    this.solicitudService.listarContactos(this.data.id).subscribe({
      next: (contactos) => { this.historialContactos = contactos; this.cargandoHistorial = false; },
      error: () => { this.cargandoHistorial = false; }
    });
  }

  private actualizarValidadoresCita(): void {
    if (this.mostrarCamposCita) {
      this.contactoForm.get('fechaCita')?.setValidators([Validators.required]);
      this.contactoForm.get('horaCita')?.setValidators([Validators.required]);
    } else {
      this.contactoForm.get('fechaCita')?.clearValidators();
      this.contactoForm.get('horaCita')?.clearValidators();
      this.contactoForm.patchValue({ fechaCita: '', horaCita: '' });
    }
    this.contactoForm.get('fechaCita')?.updateValueAndValidity();
    this.contactoForm.get('horaCita')?.updateValueAndValidity();
  }

  registrarIntento(): void {
    if (this.contactoForm.invalid) return;

    const val = this.contactoForm.getRawValue();
    this.guardando = true;

    this.solicitudService.registrarContacto(this.data.id, {
      fecha: val.fecha,
      hora: val.hora,
      resultado: val.resultado,
      observacion: val.observacion,
      fechaCita: val.fechaCita || undefined,
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
        console.error('Error al registrar contacto:', err);
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

  private calcularJornada(hora: string): string {
    const h = Number(hora.split(':')[0]);
    return h < 12 ? 'Mañana' : 'Tarde';
  }
}
