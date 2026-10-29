import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';

export function fechaNacimientoPasadaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fecha = new Date(control.value);
  if (isNaN(fecha.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha >= hoy) {
    return { fechaFutura: true };
  }
  return null;
}

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
import { PersonaSearchDto, SolicitudService, SolicitudAcompanamientoRequest } from '../../services/solicitud.service';
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
  private router = inject(Router);
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
  vinculosUniversidad: MaestroDto[] = [];
  vinculosAgresorVictima: MaestroDto[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  enviando = false;
  buscandoRemitente = false;
  buscandoSolicitante = false;

  readonly rolesUdeaVictimario: string[] = [
    'Estudiante',
    'Docente',
    'Personal Administrativo',
    'Personal no docente',
    'Personal Directivo',
    'Contratista / Proveedor'
  ];

  readonly REGEX_NUMEROS_IDENTIFICACION = /^[0-9]{5,15}$/;
  readonly REGEX_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  readonly maxFechaNacimiento: Date = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  })();

  get form(): FormGroup {
    return this.acompanamientoForm;
  }

  archivosEvidencia: { nombre: string; tamano: string; file: File }[] = [];

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

    this.listasService.obtenerMaestro('vinculos-udea')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (vinculos) => { this.vinculosUniversidad = vinculos; },
        error: () => { this.vinculosUniversidad = []; }
      });

    this.listasService.obtenerMaestro('vinculos-agresor-victima')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (vinculos) => { this.vinculosAgresorVictima = vinculos; },
        error: () => { this.vinculosAgresorVictima = []; }
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
      fechaNacimiento: [null, fechaNacimientoPasadaValidator],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      identidadGenero: [null, Validators.required],
      vinculoUniversidad: [null],
      correos: [[], Validators.required],
      telefonos: [[], Validators.required],
      observacionesTelefono: [''],
      observacionesCorreo: [''],

      // Paso 3: Hechos (El Caso)
      tipoLugar: [null],
      sedeCampus: [''],
      facultad: [''],
      bloque: [''],
      espacio: [''],
      lugarDetalleExterno: [''],
      descripcionHechos: ['', Validators.required],

      // Paso 4: Presunto agresor (Victimario)
      agresorIdentificacion: ['', [Validators.pattern(this.REGEX_NUMEROS_IDENTIFICACION)]],
      agresorPrimerNombre: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      agresorSegundoNombre: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      agresorPrimerApellido: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      agresorSegundoApellido: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      agresorVinculoUniversidad: [''],
      agresorOtroVinculoUniversidad: [''],
      agresorVinculoVictima: [''],
      agresorOtroVinculoVictima: [''],
      agresorCorreo: [''],
      agresorRemitirUad: ['no']
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

    this.acompanamientoForm.get('agresorVinculoUniversidad')?.valueChanges.subscribe(() => {
      if (!this.esVictimarioUdea) {
        this.acompanamientoForm.get('agresorRemitirUad')?.setValue('no');
      }
    });
  }

  buscarRemitente(event?: Event): void {
    event?.preventDefault();

    const tipoDocumentoId = this.acompanamientoForm.get('remitenteTipoDocumento')?.value;
    const documento = this.acompanamientoForm.get('remitenteNumeroDocumento')?.value?.trim();

    if (!tipoDocumentoId) {
      this.snackBar.open('Seleccione el tipo de documento del remitente.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!documento) {
      this.snackBar.open('Ingrese el número de documento del remitente.', 'Cerrar', { duration: 3000 });
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
      this.snackBar.open('Seleccione el tipo de documento del solicitante.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!documento) {
      this.snackBar.open('Ingrese el número de documento del solicitante.', 'Cerrar', { duration: 3000 });
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
        this.actualizarContactosEnFormulario();
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
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.correoRegistrados = [...this.correoRegistrados, res];
        this.actualizarContactosEnFormulario();
      }
    });
  }

  abrirModalTelefono(): void {
    const dialogRef = this.dialog.open(ModalTelefonoComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.telefonosRegistrados = [...this.telefonosRegistrados, res];
        this.actualizarContactosEnFormulario();
      }
    });
  }

  eliminarCorreo(i: number): void {
    this.correoRegistrados = this.correoRegistrados.filter((_, idx) => idx !== i);
    this.actualizarContactosEnFormulario();
  }

  eliminarTelefono(i: number): void {
    this.telefonosRegistrados = this.telefonosRegistrados.filter((_, idx) => idx !== i);
    this.actualizarContactosEnFormulario();
  }

  private actualizarContactosEnFormulario(): void {
    this.acompanamientoForm.patchValue({
      correos: this.correoRegistrados,
      telefonos: this.telefonosRegistrados
    });
    this.acompanamientoForm.get('correos')?.updateValueAndValidity();
    this.acompanamientoForm.get('telefonos')?.updateValueAndValidity();
  }

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

  onArchivosSeleccionados(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (const file of Array.from(input.files)) {
        const tamanoFormateado = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        this.archivosEvidencia.push({
          nombre: file.name,
          tamano: tamanoFormateado,
          file
        });
      }
      input.value = '';
    }
  }

  eliminarArchivo(index: number): void {
    this.archivosEvidencia.splice(index, 1);
  }

  get esVictimarioUdea(): boolean {
    const vinculoId = Number(this.acompanamientoForm?.get('agresorVinculoUniversidad')?.value);
    const vinculo = this.vinculosUniversidad.find(item => item.id === vinculoId)?.nombre;
    if (!vinculo) {
      return false;
    }
    return this.rolesUdeaVictimario.some(r => vinculo.toLowerCase().includes(r.toLowerCase())) ||
           vinculo.includes('Estudiante') ||
           vinculo.includes('Docente') ||
           vinculo.includes('Personal no docente') ||
           vinculo.includes('Personal Administrativo') ||
           vinculo.includes('Personal Directivo') ||
           vinculo.includes('Contratista');
  }

  get esOtroVinculoAgresorUniversidad(): boolean {
    const vinculoId = Number(this.acompanamientoForm?.get('agresorVinculoUniversidad')?.value);
    return this.vinculosUniversidad.find(item => item.id === vinculoId)?.nombre.trim().toLowerCase() === 'otro';
  }

  get esOtroVinculoAgresorVictima(): boolean {
    const vinculoId = Number(this.acompanamientoForm?.get('agresorVinculoVictima')?.value);
    return this.vinculosAgresorVictima.find(item => item.id === vinculoId)?.nombre.trim().toLowerCase() === 'otro';
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
    numeroDocumento: { etiqueta: 'Número de documento del solicitante', mensajes: { pattern: 'Ingrese únicamente números, sin puntos ni espacios.' } },
    fechaNacimiento: { etiqueta: 'Fecha de nacimiento del solicitante' },
    primerNombre: { etiqueta: 'Primer nombre del solicitante' },
    primerApellido: { etiqueta: 'Primer apellido del solicitante' },
    identidadGenero: { etiqueta: 'Identidad de género del solicitante' },
    correos: { etiqueta: 'Correo electrónico del solicitante', mensajes: { required: 'Agregue al menos un correo electrónico.' } },
    telefonos: { etiqueta: 'Teléfono del solicitante', mensajes: { required: 'Agregue al menos un teléfono.' } },
    descripcionHechos: { etiqueta: 'Descripción de los hechos', mensajes: { required: 'Describa los hechos para continuar.' } },
    agresorIdentificacion: { etiqueta: 'Identificación del presunto agresor', mensajes: { pattern: 'Solo números (entre 5 y 15 dígitos).' } },
    agresorPrimerNombre: { etiqueta: 'Primer nombre del presunto agresor', mensajes: { pattern: 'Solo debe contener letras.' } },
    agresorSegundoNombre: { etiqueta: 'Segundo nombre del presunto agresor', mensajes: { pattern: 'Solo debe contener letras.' } },
    agresorPrimerApellido: { etiqueta: 'Primer apellido del presunto agresor', mensajes: { pattern: 'Solo debe contener letras.' } },
    agresorSegundoApellido: { etiqueta: 'Segundo apellido del presunto agresor', mensajes: { pattern: 'Solo debe contener letras.' } }
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

    const nombreAgresorCompleto = [
      fv.agresorPrimerNombre,
      fv.agresorSegundoNombre,
      fv.agresorPrimerApellido,
      fv.agresorSegundoApellido
    ].filter(Boolean).join(' ').trim();

    const vinculoAgresorUniversidad = this.vinculosUniversidad.find(
      vinculo => vinculo.id === Number(fv.agresorVinculoUniversidad)
    );
    const vinculoAgresorVictima = this.vinculosAgresorVictima.find(
      vinculo => vinculo.id === Number(fv.agresorVinculoVictima)
    );
    const agresorVinculoUdeaNombre = this.esOtroVinculoAgresorUniversidad
      ? fv.agresorOtroVinculoUniversidad?.trim() || vinculoAgresorUniversidad?.nombre || null
      : vinculoAgresorUniversidad?.nombre || null;
    const agresorVinculoVictimaNombre = this.esOtroVinculoAgresorVictima
      ? fv.agresorOtroVinculoVictima?.trim() || vinculoAgresorVictima?.nombre || null
      : vinculoAgresorVictima?.nombre || null;
    const hayDatosAgresor = Boolean(
      fv.agresorIdentificacion?.trim() ||
      nombreAgresorCompleto ||
      fv.agresorVinculoUniversidad ||
      fv.agresorVinculoVictima ||
      fv.agresorCorreo?.trim()
    );

    const lugarCompleto = fv.tipoLugar === 'interno'
      ? [fv.sedeCampus, fv.facultad, fv.bloque, fv.espacio].filter(Boolean).join(' - ') || null
      : fv.tipoLugar === 'externo'
        ? fv.lugarDetalleExterno?.trim() || null
        : null;

    const datosCaso = {
      tipoLugar: fv.tipoLugar,
      sedeCampus: fv.sedeCampus,
      facultad: fv.facultad,
      bloque: fv.bloque,
      espacio: fv.espacio,
      lugarDetalleExterno: fv.lugarDetalleExterno,
      lugarOcurrencia: lugarCompleto,
      descripcionHechos: fv.descripcionHechos || 'No se registró descripción detallada.',
      vinculoUniversidadId: fv.vinculoUniversidad,
      agresorIdentificacion: fv.agresorIdentificacion,
      agresorNombre: nombreAgresorCompleto || null,
      agresorVinculoUdeaId: fv.agresorVinculoUniversidad || null,
      agresorVinculoUdea: agresorVinculoUdeaNombre,
      agresorOtroVinculoUdea: this.esOtroVinculoAgresorUniversidad ? fv.agresorOtroVinculoUniversidad?.trim() || null : null,
      agresorVinculoVictimaId: fv.agresorVinculoVictima || null,
      agresorVinculoVictima: agresorVinculoVictimaNombre,
      agresorOtroVinculoVictima: this.esOtroVinculoAgresorVictima ? fv.agresorOtroVinculoVictima?.trim() || null : null,
      agresorCorreo: fv.agresorCorreo,
      agresorRemitirUad: hayDatosAgresor ? fv.agresorRemitirUad : null,
      evidenciasResumen: this.archivosEvidencia.length ? `${this.archivosEvidencia.length} archivo(s) adjunto(s)` : 'Sin archivos adjuntos'
    };

    const payload: SolicitudAcompanamientoRequest = {
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
        fechaNacimiento: this.formatDate(fv.fechaNacimiento),
        identidadGeneroId: fv.identidadGenero,
        vinculoUniversidadId: fv.vinculoUniversidad ?? null,
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
      } : null,
      descripcionHechos: fv.descripcionHechos || null,
      lugarOcurrencia: lugarCompleto,
      agresorIdentificacion: fv.agresorIdentificacion || null,
      agresorNombre: nombreAgresorCompleto || null,
      agresorVinculoUdeaId: fv.agresorVinculoUniversidad || null,
      agresorVinculoUdea: agresorVinculoUdeaNombre,
      agresorOtroVinculoUdea: this.esOtroVinculoAgresorUniversidad ? fv.agresorOtroVinculoUniversidad?.trim() || null : null,
      agresorVinculoVictimaId: fv.agresorVinculoVictima || null,
      agresorVinculoVictima: agresorVinculoVictimaNombre,
      agresorOtroVinculoVictima: this.esOtroVinculoAgresorVictima ? fv.agresorOtroVinculoVictima?.trim() || null : null,
      agresorCorreo: fv.agresorCorreo?.trim() || null,
      agresorRemitirUad: hayDatosAgresor ? fv.agresorRemitirUad || null : null,
      evidenciasResumen: this.archivosEvidencia.length ? `${this.archivosEvidencia.length} archivo(s) adjunto(s)` : null,
      datosCaso
    };

    this.enviando = true;
    const archivos = this.archivosEvidencia.map((evidencia) => evidencia.file);
    this.solicitudService.crearAcompanamiento(payload).pipe(
      switchMap((resp) => {
        if (!resp?.id || archivos.length === 0) {
          return of({ resp, errorEvidencias: null });
        }
        return this.solicitudService.subirEvidencias(resp.id, archivos).pipe(
          map(() => ({ resp, errorEvidencias: null })),
          catchError((errorEvidencias) => of({ resp, errorEvidencias }))
        );
      })
    ).subscribe({
      next: ({ resp, errorEvidencias }) => {
        this.enviando = false;
        try {
          if (resp?.id) {
            localStorage.setItem(`casilda_caso_${resp.id}`, JSON.stringify(datosCaso));
          }
          if (resp?.codigo) {
            localStorage.setItem(`casilda_caso_${resp.codigo}`, JSON.stringify(datosCaso));
          }
          if (fv.numeroDocumento) {
            localStorage.setItem(`casilda_doc_${fv.numeroDocumento}`, JSON.stringify(datosCaso));
          }
        } catch {
          // Si el almacenamiento local no está disponible, continuar sin error
        }

        if (errorEvidencias) {
          this.notificacion.error(
            'La solicitud se creó, pero no fue posible adjuntar las evidencias. Puede agregarlas al editar la solicitud.',
            errorEvidencias
          );
        }

        const dialogRef = this.dialog.open(DialogoExitoComponent, {
          width: '400px',
          data: {
            titulo: '¡Solicitud creada!',
            mensaje: errorEvidencias
              ? 'El requerimiento fue registrado, pero las evidencias no pudieron adjuntarse.'
              : 'El requerimiento ha sido registrado en el sistema.',
          }
        });
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/consulta']);
        });
        this.acompanamientoForm.reset({
          tipoLugar: null,
          correos: [],
          telefonos: [],
          agresorRemitirUad: 'no'
        });
        this.correoRegistrados = [];
        this.telefonosRegistrados = [];
        this.archivosEvidencia = [];
      },
      error: (error) => {
        this.enviando = false;
        this.notificacion.error('No fue posible enviar la solicitud. Los datos siguen en el formulario; intente de nuevo.', error);
        const msg = error?.error?.message || 'Error al enviar la solicitud. Intente de nuevo.';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Desea limpiar todos los campos del formulario?')) {
      this.acompanamientoForm.reset({
        tipoLugar: null,
        correos: [],
        telefonos: [],
        agresorRemitirUad: 'no'
      });
      this.correoRegistrados = [];
      this.telefonosRegistrados = [];
      this.archivosEvidencia = [];
    }
  }
}
