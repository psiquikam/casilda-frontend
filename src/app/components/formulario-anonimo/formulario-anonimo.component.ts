import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DialogoExitoComponent } from '../dialog-exito/dialog-exito.component';
import { ListasService, MaestroDto } from '../../services/listas.service';
import {
  ReporteCasoService,
  construirReporteCasoRequest,
  interpretarErrorReporte
} from '../../services/reporte-caso.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { ResumenErroresComponent } from '../../core/a11y/resumen-errores.component';
import { DescripcionCampos, ErrorFormulario, recolectarErrores } from '../../core/a11y/errores-formulario';
import {
  documentoEsAlfanumerico,
  fechaNacimientoPasadaValidator,
  limpiarDocumento,
  longitudMaximaDocumento,
  tarjetaIdentidadMenorEdadValidator
} from '../../core/forms/documento-identidad';

/**
 * Modo en que se presenta el formulario multipaso de reporte:
 * - `anonimo`: canal público del home («Reportar VBG de forma anónima»).
 * - `autenticado`: opción «Reportar Caso» de Mis Solicitudes (rol USUARIO). Reutiliza el
 *   mismo flujo y validaciones; solo cambian los textos que hablan de anonimato y la clave
 *   del borrador local. Se declara en `data.modoReporte` de la ruta.
 */
export type ModoReporte = 'anonimo' | 'autenticado';

/** Textos que dependen del modo del formulario (ver `ModoReporte`). */
export interface TextosReporte {
  titulo: string;
  preguntaPerfil: string;
  perfilAfectada: string;
  perfilTercero: string;
  botonEnviar: string;
  claveBorrador: string;
  exitoTitulo: string;
  exitoMensaje: string;
  exitoLabelCodigo: string;
  exitoInstruccion: string;
}

/** Ruta a la que se vuelve al cerrar el diálogo de éxito, según el modo. */
export const RUTA_TRAS_REPORTE: Record<ModoReporte, string> = {
  anonimo: '/home',
  autenticado: '/inicio'
};

/**
 * Campo del DTO de `POST /reportes` → control del formulario y paso del stepper donde se
 * corrige, para llevar a la persona al error que devuelva el servidor (`validationErrors`).
 */
const CAMPOS_SERVIDOR: Record<string, { paso: number; control: string }> = {
  tipoDocumentoId: { paso: 1, control: 'victima.tipoDocumento' },
  numeroDocumento: { paso: 1, control: 'victima.identificacion' },
  fechaNacimiento: { paso: 1, control: 'victima.fechaNacimiento' },
  tipoLugar: { paso: 2, control: 'tipoLugar' },
  campusId: { paso: 2, control: 'sedeCampus' },
  facultad: { paso: 2, control: 'facultad' },
  bloque: { paso: 2, control: 'bloque' },
  espacio: { paso: 2, control: 'espacio' },
  lugarDetalleExterno: { paso: 2, control: 'lugarDetalleExterno' },
  descripcionHechos: { paso: 2, control: 'descripcionHechos' },
  rutaActivacionId: { paso: 3, control: 'rutaActivacion' }
};

export const TEXTOS_REPORTE: Record<ModoReporte, TextosReporte> = {
  anonimo: {
    titulo: 'Reporte anónimo de violencia basada en género',
    preguntaPerfil: '¿Cómo desea realizar su reporte anónimo?',
    perfilAfectada: 'Reporte anónimo sobre una situación que le ocurrió directamente a usted.',
    perfilTercero: 'Reporte anónimo en representación de un tercero o como testigo presencial.',
    botonEnviar: 'Finalizar y enviar reporte anónimo',
    claveBorrador: 'casilda_borrador_anonimo',
    exitoTitulo: '¡Reporte anónimo registrado!',
    exitoMensaje: 'El reporte anónimo ha sido recibido con éxito. Un profesional especializado revisará la información de forma confidencial.',
    exitoLabelCodigo: 'ID ÚNICO DE REPORTE ANÓNIMO',
    exitoInstruccion: 'Conserve este identificador (ID). Para activar una ruta de atención o acompañamiento institucional, inicie sesión en la plataforma e ingrese este ID para vincular el caso.'
  },
  autenticado: {
    titulo: 'Reportar caso de violencia basada en género',
    preguntaPerfil: '¿Cómo desea realizar su reporte?',
    perfilAfectada: 'Reporte sobre una situación que le ocurrió directamente a usted.',
    perfilTercero: 'Reporte en representación de un tercero o como testigo presencial.',
    botonEnviar: 'Finalizar y enviar reporte',
    claveBorrador: 'casilda_borrador_reporte',
    exitoTitulo: '¡Reporte registrado!',
    exitoMensaje: 'El reporte ha sido recibido con éxito. Un profesional especializado revisará la información de forma confidencial.',
    exitoLabelCodigo: 'ID ÚNICO DE REPORTE',
    exitoInstruccion: 'Conserve este identificador (ID). Se podrá consultar el avance del caso desde «Seguimiento de trámite» en Mis solicitudes.'
  }
};

@Component({
  selector: 'app-formulario-anonimo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatCheckboxModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ResumenErroresComponent
  ],
  templateUrl: './formulario-anonimo.component.html',
  styleUrls: ['./formulario-anonimo.component.scss']
})
export class FormularioAnonimoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly notificacion = inject(NotificacionService);
  private readonly listasService = inject(ListasService);
  private readonly reporteCasoService = inject(ReporteCasoService);
  private readonly router = inject(Router);
  // Opcional: el componente también se instancia sin router (pruebas unitarias).
  private readonly route = inject(ActivatedRoute, { optional: true });

  /** Modo declarado en `data.modoReporte` de la ruta; por defecto, reporte anónimo. */
  readonly modo: ModoReporte = this.route?.snapshot?.data?.['modoReporte'] === 'autenticado' ? 'autenticado' : 'anonimo';
  readonly textos: TextosReporte = TEXTOS_REPORTE[this.modo];

  tipoUsuario: 'anonimo' | 'anonimo_tercero' = 'anonimo';

  /** Petición de creación en curso: evita reportes duplicados por clics repetidos. */
  enviando = false;
  /** Código CAS confirmado por el servidor. Desde ese momento el formulario es de solo lectura. */
  codigoReporte: string | null = null;

  get reporteEnviado(): boolean {
    return this.codigoReporte !== null;
  }
  formConsentimiento: FormGroup;
  formPerfil: FormGroup;
  formRelato: FormGroup;
  formVictimario: FormGroup;
  formEvidencias: FormGroup;

  /** Errores del paso «El Caso» para el resumen enfocable (WCAG 3.3.1). */
  erroresRelato: ErrorFormulario[] = [];

  private readonly camposRelato: DescripcionCampos = {
    descripcionHechos: { etiqueta: 'Descripción de los hechos', mensajes: { required: 'Describa los hechos para continuar.' } }
  };

  tiposDocumento: MaestroDto[] = [];
  campusLista: MaestroDto[] = [];
  rutasActivacion: MaestroDto[] = [];

  readonly maxFechaNacimiento: Date = (() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 1);
    fecha.setHours(23, 59, 59, 999);
    return fecha;
  })();

  readonly tiposVbg: MaestroDto[] = [
    { id: 1, nombre: 'Violencia psicológica' },
    { id: 2, nombre: 'Violencia física' },
    { id: 3, nombre: 'Violencia sexual' },
    { id: 4, nombre: 'Violencia institucional' },
    { id: 5, nombre: 'Violencia económica o patrimonial' },
    { id: 6, nombre: 'Violencia digital / informática' },
    { id: 7, nombre: 'Discriminación o violencia por prejuicio' },
    { id: 8, nombre: 'Otro tipo de violencia' }
  ];

  readonly listaPsicologica: MaestroDto[] = [
    { id: 1, nombre: 'Abuso de poder y/o confianza' },
    { id: 2, nombre: 'Aislamiento forzado' },
    { id: 3, nombre: 'Constreñimiento ilegal' },
    { id: 4, nombre: 'Difusión de contenido íntimo' },
    { id: 5, nombre: 'Injurias por vías de hecho o calumnia' },
    { id: 6, nombre: 'Intimidación y amenazas' },
    { id: 7, nombre: 'Lenguaje misógino, sexista o discursos de odio' }
  ];

  readonly listaFisica: MaestroDto[] = [
    { id: 1, nombre: 'Feminicidio (Tentativa o comisión)' },
    { id: 2, nombre: 'Lesiones personales' },
    { id: 3, nombre: 'Violencia de pareja/expareja' },
    { id: 4, nombre: 'Violencia interpersonal' },
    { id: 5, nombre: 'Violencia intrafamiliar' }
  ];

  readonly listaSexual: MaestroDto[] = [
    { id: 1, nombre: 'Acceso carnal violento' },
    { id: 2, nombre: 'Acto sexual violento' },
    { id: 3, nombre: 'Acoso sexual' },
    { id: 4, nombre: 'Explotación sexual (inducción a la prostitución, proxenetismo con menor de edad, constreñimiento a la prostitución, trata de personas)' },
    { id: 5, nombre: 'Violencia facilitada por nuevas tecnologías' },
    { id: 6, nombre: 'Violencia sexual correctiva' }
  ];

  readonly listaInstitucional: MaestroDto[] = [
    { id: 1, nombre: 'Omisión al deber de debida diligencia' },
    { id: 2, nombre: 'Omision del deber de denuncia' },
    { id: 3, nombre: 'Revictimización' }
  ];

  readonly listaPatrimonial: MaestroDto[] = [
    { id: 1, nombre: 'Control económico' },
    { id: 2, nombre: 'Daño en bien ajeno' },
    { id: 3, nombre: 'Hurto' },
    { id: 4, nombre: 'Inasistencia alimentaria' }
  ];

  readonly listaInformatica: MaestroDto[] = [
    { id: 1, nombre: 'Uso, explotación y trata mediante amenazas / extorsión' },
    { id: 2, nombre: 'Grooming' },
    { id: 3, nombre: 'Creación de contenido sin consentimiento' },
    { id: 4, nombre: 'Sexting sin consentimiento' },
    { id: 5, nombre: 'Violación de datos personales' }
  ];

  readonly listaPrejuicio: MaestroDto[] = [
    { id: 1, nombre: 'Discriminación por género u orientación sexual o identidad de género' }
  ];

  readonly listaFormasOcurrencia: string[] = [
    'Presencial',
    'Virtual',
    'Mixta'
  ];

  readonly listaDetalleMisional: string[] = [
    'Misional docencia',
    'Misional investigación',
    'Misional extensión',
    'Actividades institucionales',
    'En representación de la U',
    'En bienes inmuebles'
  ];

  readonly listaVinculosUniversidad: string[] = [
    'Estudiante (pregrado, posgrado, tecnología, técnica)',
    'Docente (vinculado, ocasional, cátedra, cátedra 50)',
    'Personal no docente',
    'Personal directivo',
    'Egresado(a)',
    'Contratista / proveedor',
    'Persona externa (sin vínculo UdeA)',
    'Se desconoce / no sabe',
    'Otro'
  ];

  readonly listaVinculosVictima: string[] = [
    'Pareja / expareja',
    'Familiar',
    'Compañeros de estudio',
    'Docente',
    'Otro'
  ];

  psicologicaSel: number[] = [];
  fisicaSel: number[] = [];
  sexualSel: number[] = [];
  institucionalSel: number[] = [];
  economicaSel: number[] = [];
  informaticaSel: number[] = [];
  prejuicioSel: number[] = [];

  readonly rolesUdeaVictimario: string[] = [
    'Estudiante',
    'Docente',
    'Personal administrativo',
    'Personal no docente',
    'Personal directivo',
    'Contratista / proveedor'
  ];

  readonly campusOptions: string[] = [
    'Campus Apartadó (Seccional Urabá)',
    'Campus Carepa (Seccional Urabá)',
    'Campus Turbo (Seccional Urabá)',
    'Campus Ciudad Universitaria (Medellín)',
    'Campus Robledo (Medellín)',
    'Campus Edificio San Ignacio (Medellín)',
    'Campus Facultad de Medicina (Área de la Salud)',
    'Campus Facultad de Enfermería (Área de la Salud)',
    'Campus Facultad de Odontología (Área de la Salud)',
    'Campus Facultad Nacional de Salud Pública (Área de la Salud)',
    'Campus El Carmen de Viboral (Seccional Oriente)',
    'Campus Caucasia (Seccional Bajo Cauca)',
    'Campus Puerto Berrío (Seccional Magdalena Medio)',
    'Campus Andes (Seccional Suroeste)',
    'Campus Yarumal (Sede Norte)',
    'Campus Santa Fe de Antioquia (Sede Occidente)',
    'Campus Sonsón (Sede Sonsón)',
    'Campus Segovia (Sede Nordeste)',
    'Campus Amalfi (Sede Nordeste)',
    'Otro campus o sede universitaria'
  ];

  readonly REGEX_NUMEROS_IDENTIFICACION = /^[0-9]{5,20}$/;
  readonly REGEX_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  readonly REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  readonly REGEX_TELEFONO = /^[0-9]{7,12}$/;

  get formVictima(): FormGroup {
    return this.formPerfil.get('victima') as FormGroup;
  }

  get tieneCorreoVictimaAfectada(): boolean {
    const perfil = this.formPerfil?.get('perfil')?.value;
    const deseaDatosVictima = this.formPerfil?.get('deseaDatosVictima')?.value;
    const correoCtrl = this.formVictima?.get('correo');
    const valor = correoCtrl?.value?.trim();

    return perfil === 'anonimo' &&
           deseaDatosVictima === 'si' &&
           !!valor &&
           !!correoCtrl?.valid;
  }

  get esVictimarioUdea(): boolean {
    const vinculo = this.formVictimario?.get('vinculoUniversidad')?.value;
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

  get contactoRequeridoInvalido(): boolean {
    return !!(this.formPerfil?.hasError('contactInfoRequired') && 
      this.formPerfil.get('deseaContacto')?.value === 'si');
  }

  constructor() {
    this.formConsentimiento = this.fb.group({
      aceptaPolitica: [false, Validators.requiredTrue]
    });

    this.formPerfil = this.fb.group({
      perfil: ['anonimo', Validators.required],
      deseaDatosVictima: ['no', Validators.required],
      victima: this.fb.group({
        tipoDocumento: [null, tarjetaIdentidadMenorEdadValidator(
          () => this.formPerfil?.get('victima.fechaNacimiento')?.value,
          () => this.tiposDocumento
        )],
        identificacion: ['', [Validators.maxLength(20), Validators.pattern('^[0-9A-Za-z]*$')]],
        fechaNacimiento: [null, fechaNacimientoPasadaValidator],
        primerNombre: [''],
        segundoNombre: ['', [Validators.pattern(this.REGEX_LETRAS)]],
        primerApellido: [''],
        segundoApellido: ['', [Validators.pattern(this.REGEX_LETRAS)]],
        correo: ['', [Validators.email, Validators.pattern(this.REGEX_EMAIL)]],
        genero: [''],
        cargo: ['']
      }),
      deseaContacto: ['no', Validators.required],
      correoContacto: ['', [Validators.email, Validators.pattern(this.REGEX_EMAIL)]],
      whatsappContacto: ['', [Validators.pattern(this.REGEX_TELEFONO)]]
    }, {
      validators: (group) => this.validarMedioContacto(group as FormGroup)
    });

    this.formPerfil.get('perfil')?.valueChanges.subscribe(val => {
      this.tipoUsuario = val;
      this.formPerfil.updateValueAndValidity();
    });

    this.formPerfil.get('deseaDatosVictima')?.valueChanges.subscribe(val => {
      const primerNombreCtrl = this.formVictima.get('primerNombre');
      const primerApellidoCtrl = this.formVictima.get('primerApellido');
      const cargoCtrl = this.formVictima.get('cargo');
      if (val === 'si') {
        primerNombreCtrl?.setValidators([
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
          Validators.pattern(this.REGEX_LETRAS)
        ]);
        primerApellidoCtrl?.setValidators([
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
          Validators.pattern(this.REGEX_LETRAS)
        ]);
        cargoCtrl?.setValidators([Validators.required]);
        const correoVictima = this.formVictima.get('correo')?.value;
        const correoVictimaValido = this.formVictima.get('correo')?.valid;
        if (correoVictima && correoVictimaValido && this.formPerfil.get('perfil')?.value === 'anonimo') {
          this.formPerfil.get('correoContacto')?.setValue(correoVictima, { emitEvent: false });
        }
      } else {
        primerNombreCtrl?.clearValidators();
        primerApellidoCtrl?.clearValidators();
        cargoCtrl?.clearValidators();
      }
      primerNombreCtrl?.updateValueAndValidity();
      primerApellidoCtrl?.updateValueAndValidity();
      cargoCtrl?.updateValueAndValidity();
      this.formPerfil.updateValueAndValidity();
    });

    this.formVictima.get('correo')?.valueChanges.subscribe(val => {
      if (this.formPerfil.get('perfil')?.value === 'anonimo') {
        const correoValido = this.formVictima.get('correo')?.valid;
        if (val && correoValido) {
          this.formPerfil.get('correoContacto')?.setValue(val, { emitEvent: false });
        } else if (!val) {
          this.formPerfil.get('correoContacto')?.setValue('', { emitEvent: false });
        }
        this.formPerfil.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.formPerfil.get('deseaContacto')?.valueChanges.subscribe(val => {
      if (val === 'no') {
        this.formPerfil.get('correoContacto')?.setValue('', { emitEvent: false });
        this.formPerfil.get('whatsappContacto')?.setValue('', { emitEvent: false });
      } else if (val === 'si') {
        const correoVictima = this.formVictima.get('correo')?.value;
        const correoVictimaValido = this.formVictima.get('correo')?.valid;
        if (correoVictima && correoVictimaValido && this.formPerfil.get('perfil')?.value === 'anonimo') {
          this.formPerfil.get('correoContacto')?.setValue(correoVictima, { emitEvent: false });
        }
      }
      this.formPerfil.updateValueAndValidity();
    });

    this.formRelato = this.fb.group({
      tipoLugar: [null],
      sedeCampus: [''],
      facultad: [''],
      bloque: [''],
      espacio: [''],
      lugarDetalleExterno: [''],
      descripcionHechos: ['', Validators.required],
      // Controles heredados conservados solo para compatibilidad de borradores locales.
      // Ya no participan en la UI ni en la validez del paso «El caso».
      formaOcurrencia: [''],
      relacionMisional: ['NO'],
      detalleMisional: [''],
      fecha: [''],
      hora: [''],
      violenciaPsicologica: ['NO'],
      violenciaFisica: ['NO'],
      violenciaSexual: ['NO'],
      violenciaInstitucional: ['NO'],
      violenciaEconomica: ['NO'],
      violenciaInformatica: ['NO'],
      violenciaPrejuicio: ['NO'],
      tipoVbg: [[]],
      descripcion: ['', [this.validarDescripcionOpcional]]
    });
    this.configurarSincronizacionViolencia();

    this.formVictimario = this.fb.group({
      identificacion: ['', [Validators.pattern(this.REGEX_NUMEROS_IDENTIFICACION)]],
      primerNombre: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      segundoNombre: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      primerApellido: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      segundoApellido: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      vinculoUniversidad: [''],
      otroVinculoUniversidad: [''],
      vinculoVictima: [''],
      otroVinculoVictima: [''],
      remitirUad: ['no'],
      correo: [''],
      rutaActivacion: [null, Validators.required]
    });

    this.formVictimario.get('vinculoUniversidad')?.valueChanges.subscribe(() => {
      if (!this.esVictimarioUdea) {
        this.formVictimario.get('remitirUad')?.setValue('no');
      }
    });

    this.formEvidencias = this.fb.group({
      archivos: [null]
    });

    this.formVictima.get('tipoDocumento')?.valueChanges.subscribe(() => {
      this.actualizarValidadorDocumentoVictima();
    });
    this.formVictima.get('fechaNacimiento')?.valueChanges.subscribe(() => {
      this.formVictima.get('tipoDocumento')?.updateValueAndValidity({ emitEvent: false });
    });

    this.listasService.listas$
      .pipe(takeUntilDestroyed())
      .subscribe((listas) => {
        this.tiposDocumento = listas.tiposDocumento;
        this.campusLista = listas.campus;
        this.actualizarValidadorDocumentoVictima();
        this.formVictima.get('tipoDocumento')?.updateValueAndValidity({ emitEvent: false });
      });

    this.listasService.obtenerMaestro('rutas-activacion')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (rutas) => { this.rutasActivacion = rutas; },
        error: () => { this.rutasActivacion = []; }
      });
  }

  get maxLongitudDocumentoVictima(): number {
    return longitudMaximaDocumento(this.formVictima?.get('tipoDocumento')?.value, this.tiposDocumento);
  }

  formatoDocumentoVictima(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tipo = this.formVictima.get('tipoDocumento')?.value;
    const limpio = limpiarDocumento(input.value, tipo, this.tiposDocumento);
    input.value = limpio;
    this.formVictima.get('identificacion')?.setValue(limpio, { emitEvent: false });
  }

  private actualizarValidadorDocumentoVictima(): void {
    const tipo = this.formVictima?.get('tipoDocumento')?.value;
    const identificacion = this.formVictima?.get('identificacion');
    if (!identificacion) return;

    identificacion.setValidators([
      Validators.maxLength(longitudMaximaDocumento(tipo, this.tiposDocumento)),
      Validators.pattern(documentoEsAlfanumerico(tipo, this.tiposDocumento) ? '^[0-9A-Za-z]*$' : '^[0-9]*$')
    ]);
    const limpio = limpiarDocumento(String(identificacion.value ?? ''), tipo, this.tiposDocumento);
    if (limpio !== identificacion.value) identificacion.setValue(limpio, { emitEvent: false });
    identificacion.updateValueAndValidity({ emitEvent: false });
  }

  private validarMedioContacto(group: FormGroup): ValidationErrors | null {
    const deseaContacto = group.get('deseaContacto')?.value;
    if (deseaContacto === 'si') {
      const perfil = group.get('perfil')?.value;
      const deseaDatosVictima = group.get('deseaDatosVictima')?.value;
      const correoVictimaCtrl = group.get('victima.correo');
      const correoVictimaValido = (perfil === 'anonimo' && deseaDatosVictima === 'si' && correoVictimaCtrl?.valid)
        ? correoVictimaCtrl?.value?.trim()
        : '';
      
      const correoContactoCtrl = group.get('correoContacto');
      const correoContactoValido = (correoContactoCtrl?.valid && correoContactoCtrl?.value?.trim()) ? correoContactoCtrl.value.trim() : '';

      const correo = correoContactoValido || correoVictimaValido;

      const whatsappCtrl = group.get('whatsappContacto');
      const whatsappValido = (whatsappCtrl?.valid && whatsappCtrl?.value?.trim()) ? whatsappCtrl.value.trim() : '';

      if (!correo && !whatsappValido) {
        return { contactInfoRequired: true };
      }
    }
    return null;
  }

  get tieneViolenciaSeleccionada(): boolean {
    const hayChips = this.psicologicaSel.length > 0 ||
                     this.fisicaSel.length > 0 ||
                     this.sexualSel.length > 0 ||
                     this.institucionalSel.length > 0 ||
                     this.economicaSel.length > 0 ||
                     this.informaticaSel.length > 0 ||
                     this.prejuicioSel.length > 0;

    const tipos = [
      'violenciaPsicologica',
      'violenciaFisica',
      'violenciaSexual',
      'violenciaInstitucional',
      'violenciaEconomica',
      'violenciaInformatica',
      'violenciaPrejuicio'
    ];
    return hayChips || tipos.some(t => this.formRelato?.get(t)?.value === 'SI') || 
           ((this.formRelato?.get('tipoVbg')?.value?.length ?? 0) > 0);
  }

  intentoAvanzarRelato = false;

  get mostrarErrorTipoVbg(): boolean {
    if (this.tieneViolenciaSeleccionada) {
      return false;
    }
    return this.intentoAvanzarRelato;
  }

  avanzarPasoRelato(stepper: MatStepper): void {
    this.formRelato.markAllAsTouched();
    if (this.formRelato.valid) {
      this.erroresRelato = [];
      stepper.next();
    } else {
      // Nueva referencia en cada intento para que el resumen recupere el foco.
      this.erroresRelato = recolectarErrores(this.formRelato, this.camposRelato, 'relato');
    }
  }

  private validarDescripcionOpcional = (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val || typeof val !== 'string' || val.trim().length === 0) {
      return null;
    }
    return val.trim().length >= 20
      ? null
      : { minlength: { requiredLength: 20, actualLength: val.trim().length } };
  };

  private getArrayByName(arrayName: string): number[] | null {
    switch (arrayName) {
      case 'psicologicaSel': return this.psicologicaSel;
      case 'fisicaSel': return this.fisicaSel;
      case 'sexualSel': return this.sexualSel;
      case 'institucionalSel': return this.institucionalSel;
      case 'economicaSel': return this.economicaSel;
      case 'informaticaSel': return this.informaticaSel;
      case 'prejuicioSel': return this.prejuicioSel;
      default: return null;
    }
  }

  isModalidadSeleccionada(id: number, arrayName: string): boolean {
    const lista = this.getArrayByName(arrayName);
    return Array.isArray(lista) && lista.includes(id);
  }

  toggleModalidad(id: number, arrayName: string): void {
    const lista = this.getArrayByName(arrayName);
    if (!Array.isArray(lista)) return;
    const idx = lista.indexOf(id);
    if (idx >= 0) {
      lista.splice(idx, 1);
    } else {
      lista.push(id);
    }
    this.actualizarEstadosViolenciaDesdeChips();
  }

  onCheckboxChange(event: { checked?: boolean }, valor: number, arrayName: string): void {
    const lista = this.getArrayByName(arrayName);
    if (!Array.isArray(lista)) return;
    if (event.checked) {
      if (!lista.includes(valor)) {
        lista.push(valor);
      }
    } else {
      const idx = lista.indexOf(valor);
      if (idx >= 0) lista.splice(idx, 1);
    }
    this.actualizarEstadosViolenciaDesdeChips();
  }

  guardarBorrador(): void {
    try {
      const borrador = {
        perfil: this.formPerfil.value,
        relato: this.formRelato.value,
        victimario: this.formVictimario.value,
        psicologicaSel: this.psicologicaSel,
        fisicaSel: this.fisicaSel,
        sexualSel: this.sexualSel,
        institucionalSel: this.institucionalSel,
        economicaSel: this.economicaSel,
        informaticaSel: this.informaticaSel,
        prejuicioSel: this.prejuicioSel,
        guardadoEl: new Date().toISOString()
      };
      localStorage.setItem(this.textos.claveBorrador, JSON.stringify(borrador));
      this.notificacion.exito('Borrador guardado. El avance se conserva únicamente en este navegador.');
    } catch {
      // Manejo preventivo si localStorage no estuviese accesible
    }
  }

  private clearArrayByName(sel: string): void {
    switch (sel) {
      case 'psicologicaSel': this.psicologicaSel = []; break;
      case 'fisicaSel': this.fisicaSel = []; break;
      case 'sexualSel': this.sexualSel = []; break;
      case 'institucionalSel': this.institucionalSel = []; break;
      case 'economicaSel': this.economicaSel = []; break;
      case 'informaticaSel': this.informaticaSel = []; break;
      case 'prejuicioSel': this.prejuicioSel = []; break;
    }
  }

  private configurarSincronizacionViolencia(): void {
    const mapeo = [
      { control: 'violenciaPsicologica', sel: 'psicologicaSel', label: 'Violencia psicológica' },
      { control: 'violenciaFisica', sel: 'fisicaSel', label: 'Violencia física' },
      { control: 'violenciaSexual', sel: 'sexualSel', label: 'Violencia sexual' },
      { control: 'violenciaInstitucional', sel: 'institucionalSel', label: 'Violencia institucional' },
      { control: 'violenciaEconomica', sel: 'economicaSel', label: 'Violencia económica o patrimonial' },
      { control: 'violenciaInformatica', sel: 'informaticaSel', label: 'Violencia digital / informática' },
      { control: 'violenciaPrejuicio', sel: 'prejuicioSel', label: 'Discriminación o violencia por prejuicio' },
    ];

    mapeo.forEach(m => {
      this.formRelato.get(m.control)?.valueChanges.subscribe(val => {
        if (val !== 'SI') {
          this.clearArrayByName(m.sel);
        }
        this.actualizarTipoVbgDesdeRadios();
      });
    });

    this.formRelato.get('tipoVbg')?.valueChanges.subscribe(val => {
      if (Array.isArray(val)) {
        this.sincronizarRadiosDesdeTipoVbg(val);
      }
    });
  }

  private actualizarEstadosViolenciaDesdeChips(): void {
    const categorias = [
      { control: 'violenciaPsicologica', sel: this.psicologicaSel, label: 'Violencia psicológica' },
      { control: 'violenciaFisica', sel: this.fisicaSel, label: 'Violencia física' },
      { control: 'violenciaSexual', sel: this.sexualSel, label: 'Violencia sexual' },
      { control: 'violenciaInstitucional', sel: this.institucionalSel, label: 'Violencia institucional' },
      { control: 'violenciaEconomica', sel: this.economicaSel, label: 'Violencia económica o patrimonial' },
      { control: 'violenciaInformatica', sel: this.informaticaSel, label: 'Violencia digital / informática' },
      { control: 'violenciaPrejuicio', sel: this.prejuicioSel, label: 'Discriminación o violencia por prejuicio' },
    ];

    const tiposActivos: string[] = [];
    categorias.forEach(cat => {
      const tieneItems = cat.sel.length > 0;
      this.formRelato.get(cat.control)?.setValue(tieneItems ? 'SI' : 'NO', { emitEvent: false });
      if (tieneItems) {
        tiposActivos.push(cat.label);
      }
    });

    const tipoVbgCtrl = this.formRelato.get('tipoVbg');
    if (tipoVbgCtrl) {
      tipoVbgCtrl.setValue(tiposActivos, { emitEvent: false });
      if (tiposActivos.length > 0) {
        tipoVbgCtrl.setErrors(null);
      } else {
        tipoVbgCtrl.setErrors({ required: true });
      }
      tipoVbgCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private actualizarTipoVbgDesdeRadios(): void {
    const tiposActivos: string[] = [];
    if (this.formRelato.get('violenciaPsicologica')?.value === 'SI') tiposActivos.push('Violencia psicológica');
    if (this.formRelato.get('violenciaFisica')?.value === 'SI') tiposActivos.push('Violencia física');
    if (this.formRelato.get('violenciaSexual')?.value === 'SI') tiposActivos.push('Violencia sexual');
    if (this.formRelato.get('violenciaInstitucional')?.value === 'SI') tiposActivos.push('Violencia institucional');
    if (this.formRelato.get('violenciaEconomica')?.value === 'SI') tiposActivos.push('Violencia económica o patrimonial');
    if (this.formRelato.get('violenciaInformatica')?.value === 'SI') tiposActivos.push('Violencia digital / informática');
    if (this.formRelato.get('violenciaPrejuicio')?.value === 'SI') tiposActivos.push('Discriminación o violencia por prejuicio');

    const control = this.formRelato.get('tipoVbg');
    if (control) {
      control.setValue(tiposActivos, { emitEvent: false });
      if (tiposActivos.length > 0) {
        control.setErrors(null);
      } else {
        control.setErrors({ required: true });
      }
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private sincronizarRadiosDesdeTipoVbg(val: string[]): void {
    const mapa = [
      { control: 'violenciaPsicologica', label: 'Violencia psicológica' },
      { control: 'violenciaFisica', label: 'Violencia física' },
      { control: 'violenciaSexual', label: 'Violencia sexual' },
      { control: 'violenciaInstitucional', label: 'Violencia institucional' },
      { control: 'violenciaEconomica', label: 'Violencia económica o patrimonial' },
      { control: 'violenciaInformatica', label: 'Violencia digital / informática' },
      { control: 'violenciaPrejuicio', label: 'Discriminación o violencia por prejuicio' },
    ];

    mapa.forEach(m => {
      const ctrl = this.formRelato.get(m.control);
      const debeSerSi = val.includes(m.label);
      if (debeSerSi && ctrl?.value !== 'SI') {
        ctrl?.setValue('SI', { emitEvent: false });
      } else if (!debeSerSi && ctrl?.value === 'SI') {
        ctrl?.setValue('NO', { emitEvent: false });
      }
    });
  }

  setFechaRapida(valor: string): void {
    if (valor === 'Hoy') {
      const d = new Date();
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      this.formRelato.get('fecha')?.setValue(`${dia}/${mes}/${anio}`);
    } else {
      this.formRelato.get('fecha')?.setValue(valor);
    }
    this.formRelato.get('fecha')?.markAsDirty();
  }

  setHoraRapida(valor: string): void {
    this.formRelato.get('hora')?.setValue(valor);
    this.formRelato.get('hora')?.markAsDirty();
  }

  /**
   * Envía el reporte a `POST /reportes`. El código CAS lo genera y persiste el servidor;
   * el diálogo de éxito solo se abre con un `201`. Tras el envío el formulario queda
   * bloqueado y, al cerrar el diálogo, se vuelve al inicio.
   */
  enviarReporte(stepper?: MatStepper): void {
    if (this.enviando) return;
    if (this.reporteEnviado) {
      this.abrirDialogoExito();
      return;
    }

    const formularios = [this.formConsentimiento, this.formPerfil, this.formRelato, this.formVictimario];
    const pasoInvalido = formularios.findIndex((form) => form.invalid);
    if (pasoInvalido >= 0) {
      formularios[pasoInvalido].markAllAsTouched();
      if (stepper) stepper.selectedIndex = pasoInvalido;
      this.notificacion.error('Faltan datos obligatorios. Revise el paso señalado antes de enviar el reporte.');
      return;
    }

    const dto = construirReporteCasoRequest({
      deseaDatosVictima: this.formPerfil.get('deseaDatosVictima')?.value,
      victima: this.formVictima.getRawValue(),
      relato: this.formRelato.getRawValue(),
      rutaActivacion: this.formVictimario.get('rutaActivacion')?.value
    });

    this.enviando = true;
    this.reporteCasoService.crear(dto).subscribe({
      next: (respuesta) => {
        this.enviando = false;
        this.codigoReporte = respuesta.codigo;
        this.bloquearFormulario();
        this.eliminarBorrador();
        this.abrirDialogoExito();
      },
      error: (error: unknown) => {
        this.enviando = false;
        const detalle = interpretarErrorReporte(error);
        this.aplicarErroresServidor(detalle.campos, stepper);
        const mensajesCampos = Object.values(detalle.campos);
        this.notificacion.error(
          mensajesCampos.length ? `${detalle.mensaje} ${mensajesCampos.join(' ')}` : detalle.mensaje,
          error
        );
      }
    });
  }

  private abrirDialogoExito(): void {
    const dialogo = this.dialog.open(DialogoExitoComponent, {
      data: {
        titulo: this.textos.exitoTitulo,
        mensaje: this.textos.exitoMensaje,
        codigo: this.codigoReporte ?? undefined,
        labelCodigo: this.textos.exitoLabelCodigo,
        instruccion: this.textos.exitoInstruccion
      },
      width: '480px',
      disableClose: true
    });

    dialogo.afterClosed().subscribe({
      next: () => { void this.router.navigateByUrl(RUTA_TRAS_REPORTE[this.modo]); },
      error: () => { void this.router.navigateByUrl(RUTA_TRAS_REPORTE[this.modo]); }
    });
  }

  /** Deja el reporte enviado en solo lectura para que no parezca editable ni reenviable. */
  private bloquearFormulario(): void {
    [this.formConsentimiento, this.formPerfil, this.formRelato, this.formVictimario, this.formEvidencias]
      .forEach((form) => form.disable({ emitEvent: false }));
  }

  /** El borrador local solo se borra tras un `201` (contrato §11.4). */
  private eliminarBorrador(): void {
    try {
      localStorage.removeItem(this.textos.claveBorrador);
    } catch {
      // localStorage puede no estar disponible (modo privado o bloqueado).
    }
  }

  /** Marca en su control cada error de `validationErrors` y lleva al primer paso afectado. */
  private aplicarErroresServidor(campos: Record<string, string>, stepper?: MatStepper): void {
    const formularioPorPaso: Record<number, FormGroup> = {
      1: this.formPerfil,
      2: this.formRelato,
      3: this.formVictimario
    };
    let primerPaso: number | null = null;

    for (const [campo, mensaje] of Object.entries(campos)) {
      const destino = CAMPOS_SERVIDOR[campo];
      if (!destino) continue;
      const control = formularioPorPaso[destino.paso].get(destino.control);
      if (!control) continue;
      control.setErrors({ ...(control.errors ?? {}), servidor: mensaje });
      control.markAsTouched();
      primerPaso = primerPaso === null ? destino.paso : Math.min(primerPaso, destino.paso);
    }

    if (primerPaso !== null && stepper) {
      stepper.selectedIndex = primerPaso;
    }
  }

  enviarQueja(): void {
    this.enviarReporte();
  }
}
