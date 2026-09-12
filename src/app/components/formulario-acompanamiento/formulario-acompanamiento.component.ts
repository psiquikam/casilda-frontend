import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ListasService, MaestroDto } from '../../services/listas.service';
import { PersonaSearchDto, SolicitudService } from '../../services/solicitud.service';
import { DialogoExitoComponent } from '../dialog-exito/dialog-exito.component';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';
import { ResumenErroresComponent } from '../../core/a11y/resumen-errores.component';
import { DescripcionCampos, ErrorFormulario, recolectarErrores } from '../../core/a11y/errores-formulario';
import { NotificacionService } from '../../core/a11y/notificacion.service';

@Component({
    selector: 'app-formulario-acompanamiento',
    imports: [
        CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
        MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
        MatButtonModule, MatIconModule, MatSnackBarModule, MatRadioModule,
        MatDialogModule, MatTabsModule, MatProgressSpinnerModule, MatTableModule,
        MatTooltipModule, ResumenErroresComponent
    ],
    templateUrl: './formulario-acompanamiento.component.html',
    styleUrls: ['./formulario-acompanamiento.component.scss']
})
export class FormularioAcompanamientoComponent implements OnInit {
  private readonly notificacion = inject(NotificacionService);
  private fb = inject(FormBuilder);
  private listasService = inject(ListasService);
  private solicitudService = inject(SolicitudService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  acompanamientoForm!: FormGroup;
  tiposSolicitud: MaestroDto[] = [];
  campusLista: MaestroDto[] = [];
  unidadesAdministrativas: MaestroDto[] = [];
  unidadesAcademicas: MaestroDto[] = [];
  tiposDocumento: MaestroDto[] = [];
  identidadesGenero: MaestroDto[] = [];
  cargos: MaestroDto[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  enviando = false;
  buscandoRemitente = false;
  buscandoSolicitante = false;

  constructor() {
    this.listasService.listas$
      .pipe(takeUntilDestroyed())
      .subscribe(data => {
        this.tiposSolicitud = data.tiposSolicitud;
        this.campusLista = data.campus;
        this.unidadesAdministrativas = data.unidadesAdministrativas;
        this.unidadesAcademicas = data.unidadesAcademicas;
        this.tiposDocumento = data.tiposDocumento;
        this.identidadesGenero = data.identidadesGenero;
        this.cargos = data.cargos;
      });
  }

  ngOnInit(): void {
    this.initForm();
    this.setupConditionalValidation();
  }

  initForm(): void {
    this.acompanamientoForm = this.fb.group({
      tipoReporte: ['', Validators.required],
      medioSolicitud: [null, Validators.required],

      remitentePrimerNombre: [''],
      remitenteSegundoNombre: [''],
      remitentePrimerApellido: [''],
      remitenteSegundoApellido: [''],
      remitenteCargo: [null],
      remitenteCampus: [null],
      remitenteUnidadAdministrativa: [null],
      remitenteUnidadAcademica: [null],
      remitenteTipoDocumento: [null],
      remitenteNumeroDocumento: [''],

      tipoDocumento: [null, Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      fechaNacimiento: [null, Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      identidadGenero: [null, Validators.required],
      observacionesTelefono: [''],
      observacionesCorreo: ['']
    });
  }

  setupConditionalValidation(): void {
    this.acompanamientoForm.get('tipoReporte')?.valueChanges.subscribe(tipo => {
      const remitenteFields = [
        'remitentePrimerNombre', 'remitentePrimerApellido',
        'remitenteCargo', 'remitenteCampus', 'remitenteUnidadAdministrativa', 'remitenteUnidadAcademica'
      ];

      remitenteFields.forEach(f => {
        const control = this.acompanamientoForm.get(f);
        if (tipo === 'indirecta') {
          control?.setValidators([Validators.required]);
        } else {
          control?.clearValidators();
          control?.setValue(['remitenteCargo', 'remitenteCampus', 'remitenteUnidadAdministrativa', 'remitenteUnidadAcademica'].includes(f) ? null : '');
        }
        control?.updateValueAndValidity();
      });
    });
  }

  buscarRemitente(event?: Event): void {
    event?.preventDefault();

    const tipoDocumentoId = this.acompanamientoForm.get('remitenteTipoDocumento')?.value;
    const documento = this.acompanamientoForm.get('remitenteNumeroDocumento')?.value?.trim();

    if (!tipoDocumentoId) {
      this.snackBar.open('Selecciona el tipo de documento del remitente.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!documento) {
      this.snackBar.open('Ingresa el número de documento del remitente.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.buscandoRemitente = true;
    this.solicitudService.buscarPersonaPorDocumento(Number(tipoDocumentoId), documento).subscribe({
      next: (res: PersonaSearchDto) => {
        this.buscandoRemitente = false;
        this.acompanamientoForm.patchValue({
          remitentePrimerNombre: res.primerNombre ?? '',
          remitenteSegundoNombre: res.segundoNombre ?? '',
          remitentePrimerApellido: res.primerApellido ?? '',
          remitenteSegundoApellido: res.segundoApellido ?? '',
          remitenteTipoDocumento: res.tipoDocumentoId ?? null
        });
      },
      error: (err) => {
        this.buscandoRemitente = false;
        const mensaje = err?.error?.message || 'No se encontró ningún funcionario con ese documento.';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
      }
    });
  }

  buscarSolicitante(event?: Event): void {
    event?.preventDefault();

    const tipoDocumentoId = this.acompanamientoForm.get('tipoDocumento')?.value;
    const documento = this.acompanamientoForm.get('numeroDocumento')?.value?.trim();

    if (!tipoDocumentoId) {
      this.snackBar.open('Selecciona el tipo de documento del solicitante.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!documento) {
      this.snackBar.open('Ingresa el número de documento del solicitante.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.buscandoSolicitante = true;
    this.solicitudService.buscarPersonaPorDocumento(Number(tipoDocumentoId), documento).subscribe({
      next: (res: PersonaSearchDto) => {
        this.buscandoSolicitante = false;
        this.acompanamientoForm.patchValue({
          tipoDocumento: res.tipoDocumentoId ?? tipoDocumentoId,
          numeroDocumento: res.numeroDocumento ?? documento,
          fechaNacimiento: this.toDateControlValue(res.fechaNacimiento),
          primerNombre: res.primerNombre ?? '',
          segundoNombre: res.segundoNombre ?? '',
          primerApellido: res.primerApellido ?? '',
          segundoApellido: res.segundoApellido ?? ''
        });
        this.correoRegistrados = (res.correos ?? []).map(c => ({
          tipoId: c.tipoId,
          tipo: c.tipo ?? '',
          correo: c.correo,
          descripcion: c.descripcion ?? ''
        }));
        this.telefonosRegistrados = (res.telefonos ?? []).map(t => ({
          tipoId: t.tipoId,
          tipo: t.tipo ?? '',
          telefono: t.telefono,
          descripcion: t.descripcion ?? ''
        }));
      },
      error: (err) => {
        this.buscandoSolicitante = false;
        const mensaje = err?.error?.message || 'No se encontró solicitante con ese documento.';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
      }
    });
  }

  abrirModalCorreo(): void {
    const dialogRef = this.dialog.open(ModalCorreoComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.correoRegistrados = [...this.correoRegistrados, res]; });
  }

  abrirModalTelefono(): void {
    const dialogRef = this.dialog.open(ModalTelefonoComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.telefonosRegistrados = [...this.telefonosRegistrados, res]; });
  }

  eliminarCorreo(i: number) { this.correoRegistrados = this.correoRegistrados.filter((_, idx) => idx !== i); }
  eliminarTelefono(i: number) { this.telefonosRegistrados = this.telefonosRegistrados.filter((_, idx) => idx !== i); }

  private toDateControlValue(value?: string | null): Date | null {
    if (!value) return null;
    return new Date(`${value}T00:00:00`);
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  /** Errores del envío para el resumen enfocable (WCAG 3.3.1); pestaña activa del formulario. */
  erroresEnvio: ErrorFormulario[] = [];
  tabSeleccionada = 0;

  private readonly camposEnvio: DescripcionCampos = {
    tipoReporte: { etiqueta: 'Tipo de solicitud', mensajes: { required: 'Indica si la solicitud es directa o indirecta.' } },
    medioSolicitud: { etiqueta: 'Medio de la solicitud', mensajes: { required: 'Indica si llegó de forma presencial o virtual.' } },
    remitentePrimerNombre: { etiqueta: 'Primer nombre del remitente' },
    remitentePrimerApellido: { etiqueta: 'Primer apellido del remitente' },
    remitenteCargo: { etiqueta: 'Cargo del remitente' },
    remitenteCampus: { etiqueta: 'Campus del remitente' },
    remitenteUnidadAdministrativa: { etiqueta: 'Unidad administrativa del remitente' },
    remitenteUnidadAcademica: { etiqueta: 'Unidad académica del remitente' },
    tipoDocumento: { etiqueta: 'Tipo de documento del solicitante' },
    numeroDocumento: { etiqueta: 'Número de documento del solicitante', mensajes: { pattern: 'Escribe solo números, sin puntos ni espacios.' } },
    fechaNacimiento: { etiqueta: 'Fecha de nacimiento del solicitante' },
    primerNombre: { etiqueta: 'Primer nombre del solicitante' },
    primerApellido: { etiqueta: 'Primer apellido del solicitante' },
    identidadGenero: { etiqueta: 'Identidad de género del solicitante' }
  };

  /** Muestra la pestaña que contiene el campo antes de que el resumen lo enfoque. */
  revelarCampo(id: string): void {
    if (this.acompanamientoForm.get('tipoReporte')?.value !== 'indirecta') return;
    this.tabSeleccionada = id.startsWith('acomp-remitente') ? 0 : 1;
  }

  enviarSolicitud(): void {
    if (this.acompanamientoForm.invalid) {
      this.acompanamientoForm.markAllAsTouched();
      // Nueva referencia en cada intento para que el resumen recupere el foco.
      this.erroresEnvio = recolectarErrores(this.acompanamientoForm, this.camposEnvio, 'acomp');
      return;
    }
    this.erroresEnvio = [];

    const fv = this.acompanamientoForm.value;
    const tipoReporte = fv.tipoReporte as 'directa' | 'indirecta';

    // tipoSolicitudId: 1 = Solicitud Directa, 2 = Solicitud Indirecta
    const tipoSolicitudId = tipoReporte === 'directa' ? 1 : 2;

    // medioSolicitudId: 1 = Presencial, 2 = Virtual
    const medioSolicitudId = fv.medioSolicitud === 'presencial' ? 1 : 2;

    // Mapear todos los correos y teléfonos registrados en los modales
    const correos = this.correoRegistrados
      .filter(c => c.correo)
      .map(c => ({
        tipoId: c.tipoId as number,
        correo: String(c.correo).trim()
      }));

    const telefonos = this.telefonosRegistrados
      .filter(t => t.telefono)
      .map(t => ({
        tipoId: t.tipoId as number,
        telefono: String(t.telefono).trim()
      }));

    const payload = {
      tipoSolicitudId,
      medioSolicitudId,
      observacionesTelefono: fv.observacionesTelefono || null,
      observacionesCorreo: fv.observacionesCorreo || null,
      datosSolicitante: {
        primerNombre: fv.primerNombre,
        segundoNombre: fv.segundoNombre || null,
        primerApellido: fv.primerApellido,
        segundoApellido: fv.segundoApellido || null,
        tipoDocumentoId: fv.tipoDocumento,
        numeroDocumento: fv.numeroDocumento,
        fechaNacimiento: this.formatDate(fv.fechaNacimiento)!,
        identidadGeneroId: fv.identidadGenero,
        correos,
        telefonos
      },
      datosRemitente: tipoReporte === 'indirecta' ? {
        primerNombre: fv.remitentePrimerNombre,
        segundoNombre: fv.remitenteSegundoNombre || null,
        primerApellido: fv.remitentePrimerApellido,
        segundoApellido: fv.remitenteSegundoApellido || null,
        tipoDocumentoId: fv.remitenteTipoDocumento ?? null,
        numeroDocumento: fv.remitenteNumeroDocumento || null,
        cargoId: fv.remitenteCargo,
        campusId: fv.remitenteCampus,
        unidadAdministrativaId: fv.remitenteUnidadAdministrativa,
        unidadAcademicaId: fv.remitenteUnidadAcademica
      } : null
    };

    this.enviando = true;
    this.solicitudService.crearAcompanamiento(payload).subscribe({
      next: (response) => {
        this.enviando = false;
        this.dialog.open(DialogoExitoComponent, {
          width: '400px',
          data: {
            titulo: '¡Solicitud Creada!',
            mensaje: 'Tu requerimiento ha sido registrado en el sistema.',
          }
        });
        this.acompanamientoForm.reset();
        this.correoRegistrados = [];
        this.telefonosRegistrados = [];
      },
      error: (error) => {
        this.enviando = false;
        this.notificacion.error('No fue posible enviar la solicitud. Tus datos siguen en el formulario; intenta de nuevo.', error);
        const msg = error?.error?.message || 'Error al enviar la solicitud. Intente de nuevo.';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Desea limpiar todos los campos del formulario?')) {
      this.acompanamientoForm.reset();
      this.correoRegistrados = [];
      this.telefonosRegistrados = [];
    }
  }
}
