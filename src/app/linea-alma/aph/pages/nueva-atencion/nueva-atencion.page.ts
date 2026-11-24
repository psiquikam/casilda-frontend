import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStep, MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DescripcionCampos, ErrorFormulario, recolectarErrores } from '../../../../core/a11y/errores-formulario';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ResumenErroresComponent } from '../../../../core/a11y/resumen-errores.component';
import { limpiarDocumento, longitudMaximaDocumento } from '../../../../core/forms/documento-identidad';
import { ConCambiosPendientes } from '../../../../core/navegacion/cambios-sin-guardar.guard';
import { AuthService } from '../../../../services/auth.service';
import {
  CAMPOS_CARACTERIZACION,
  construirPersona,
  crearGrupoCaracterizacion,
  separarNombre,
  unirNombre,
  valoresCaracterizacion
} from '../../../shared/components/caracterizacion-form/caracterizacion-campos';
import { CaracterizacionFormComponent } from '../../../shared/components/caracterizacion-form/caracterizacion-form.component';
import { REGEX_LETRAS, REGEX_TELEFONO } from '../../../../seguridad-personas-bienes/shared/spyb-validadores';
import { EtiquetaCampoComponent } from '../../../shared/components/etiqueta-campo/etiqueta-campo.component';
import { SpybSoloLetrasDirective } from '../../../../seguridad-personas-bienes/shared/spyb-restricciones.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContencionPostCierreFormComponent } from '../../../shared/components/contencion-post-cierre-form/contencion-post-cierre-form.component';
import { EvidenciasAdjuntasComponent } from '../../../shared/components/evidencias-adjuntas/evidencias-adjuntas.component';
import { PanelDerivacionesComponent } from '../../../shared/components/panel-derivaciones/panel-derivaciones.component';
import { CatalogosAlmaService } from '../../../shared/catalogos/catalogos-alma.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { AtencionAphGuardarDto, SolicitanteDto } from '../../../shared/types/alma-dto';
import {
  CanalIngreso,
  ETIQUETA_CANAL_INGRESO,
  ETIQUETA_LUGAR_OCURRENCIA,
  ItemCatalogo,
  LUGARES_OCURRENCIA,
  LugarOcurrencia,
  PARENTESCO_OTRO
} from '../../../shared/types/alma.types';
import { AlertaSeguimientoComponent } from '../../components/alerta-seguimiento/alerta-seguimiento.component';
import { PasoDerivacionComponent } from '../../components/paso-derivacion/paso-derivacion.component';
import { PasoTriajeComponent } from '../../components/paso-triaje/paso-triaje.component';
import { AtencionAph, AtencionesAphService } from '../../services/atenciones-aph.service';
import { ConsultaPersonaVista, PersonasAlmaService } from '../../services/personas-alma.service';

/** Canales que APH puede elegir al registrar una solicitud: llamada o WhatsApp. Las remisiones llegan por la bandeja. */
const CANALES_DIRECTOS: readonly CanalIngreso[] = ['WHATSAPP', 'LLAMADA'];

const CAMPOS_IDENTIFICACION: DescripcionCampos = {
  tipoIdentificacion: { etiqueta: 'Tipo de documento', mensajes: { required: 'Seleccione el tipo de documento.' } },
  numeroIdentificacion: { etiqueta: 'Número de documento', mensajes: { required: 'Escriba el número de documento.' } },
  canalIngreso: { etiqueta: 'Canal por el que llegó la solicitud', mensajes: { required: 'Indique por qué canal llegó la solicitud.' } }
};

const CAMPOS_SOLICITUD: DescripcionCampos = {
  solParentesco: { etiqueta: 'Relación con la persona que requiere atención', mensajes: { required: 'Seleccione cuál es su relación con la persona.' } },
  solParentescoOtro: { etiqueta: 'Relación (¿Cuál?)', mensajes: { required: 'Indique cuál es la relación.' } },
  solTelefono: { etiqueta: 'Teléfono de contacto de quien solicita', mensajes: { pattern: 'Escriba solo números (de 7 a 12 dígitos).' } },
  solCorreo: { etiqueta: 'Correo electrónico de quien solicita', mensajes: { email: 'Verifique que el correo tenga el formato nombre@dominio.com.' } },
  motivoConsulta: { etiqueta: 'Motivo de consulta', mensajes: { required: 'Escriba el motivo de consulta.' } }
};

const CAMPOS_PERSONA: DescripcionCampos = Object.fromEntries(
  CAMPOS_CARACTERIZACION.map((c) => [c.control, { etiqueta: c.etiqueta }])
);

/**
 * Registrar nueva atención — `/linea-alma/aph/nueva`.
 *
 * Revisión de flujos de Línea Alma (noviembre de 2026): la pantalla queda en **dos pasos**.
 *
 * 1. **Registrar atención:** tipo de solicitud (directa o indirecta), canal, quien solicita (solo si es
 *    indirecta), la persona que requiere atención, información de los hechos (lugar de ocurrencia y
 *    motivo de consulta), evidencias opcionales, y el APH que atiende con su fecha y hora, que asigna
 *    el sistema. **No** pide presunto agresor.
 * 2. **Triaje y derivación:** triaje, nota de valoración APH, remisión a Psicología y panel de
 *    remisiones internas y externas con sus novedades.
 *
 * Cada «Guardar y continuar» persiste el borrador (`POST` la primera vez, que genera el `ALMA-…`, y
 * `PATCH` con `version` después). Se puede **retomar un borrador** o una remisión tomada con
 * `?atencion=ALMA-…`.
 *
 * Reglas que rigen la pantalla: una llamada nueva **siempre** genera una atención nueva (RN-ALMA-06,
 * la consulta previa solo informa); el Técnico APH **no ve notas clínicas** (RNF-ALMA-002); sin
 * consentimiento no hay derivación (RN-ALMA-02).
 */
@Component({
  selector: 'app-nueva-atencion-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatStepperModule,
    MatTooltipModule,
    EtiquetaCampoComponent,
    SpybSoloLetrasDirective,
    ResumenErroresComponent,
    CaracterizacionFormComponent,
    AlertaSeguimientoComponent,
    EvidenciasAdjuntasComponent,
    PanelDerivacionesComponent,
    PasoTriajeComponent,
    PasoDerivacionComponent,
    ContencionPostCierreFormComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nueva-atencion.page.html',
  styleUrl: './nueva-atencion.page.scss'
})
export class NuevaAtencionPage implements OnInit, ConCambiosPendientes {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly atenciones = inject(AtencionesAphService);
  private readonly personas = inject(PersonasAlmaService);
  private readonly catalogos = inject(CatalogosAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly permisos = inject(AlmaPermisosService);

  protected readonly etiquetasCanal = ETIQUETA_CANAL_INGRESO;
  protected readonly lugares = LUGARES_OCURRENCIA;
  protected readonly etiquetasLugar = ETIQUETA_LUGAR_OCURRENCIA;
  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);
  /** Campos y servicios que el backend real aún no admite (ver `environment.lineaAlma.extensiones`). */
  protected readonly extensiones = environment.lineaAlma.extensiones;

  protected readonly form = this.fb.nonNullable.group({
    identificacion: this.fb.nonNullable.group({
      tipoIdentificacion: ['', Validators.required],
      numeroIdentificacion: ['', [Validators.required, Validators.minLength(4)]],
      canalIngreso: ['' as CanalIngreso | '', Validators.required]
    }),
    caracterizacion: crearGrupoCaracterizacion(),
    solicitud: this.fb.nonNullable.group({
      esTercero: [false],
      solPrimerNombre: ['', [Validators.maxLength(60), Validators.pattern(REGEX_LETRAS)]],
      solSegundoNombre: ['', [Validators.maxLength(60), Validators.pattern(REGEX_LETRAS)]],
      solPrimerApellido: ['', [Validators.maxLength(60), Validators.pattern(REGEX_LETRAS)]],
      solSegundoApellido: ['', [Validators.maxLength(60), Validators.pattern(REGEX_LETRAS)]],
      solParentesco: [''],
      solParentescoOtro: ['', Validators.maxLength(100)],
      solTelefono: ['', Validators.pattern(REGEX_TELEFONO)],
      solCorreo: ['', [Validators.email, Validators.maxLength(150)]],
      lugarOcurrencia: ['' as LugarOcurrencia | ''],
      motivoConsulta: ['', [Validators.required, Validators.maxLength(2000)]]
    }),
    valoracion: this.fb.nonNullable.group({
      notaAph: ['', Validators.maxLength(2000)]
    })
  });

  protected readonly paso = signal(0);
  /**
   * Tres pasos: 1 Solicitud, 2 Persona y hechos, 3 Triaje y derivación. Cada uno se abre solo cuando
   * el anterior está completo: la solicitud (canal y, si es indirecta, la relación) y el registro
   * guardado. Cualquier cambio en los campos los cierra de nuevo hasta volver a continuar.
   */
  protected readonly solicitudCompleta = signal(false);
  protected readonly registroGuardado = signal(false);
  /** Las remisiones se abren cuando ya hay triaje (o la omisión por peligro inminente): la atención sale de «Borrador». */
  protected readonly triajeRegistrado = computed(() => {
    const a = this.atencion();
    return !!a && a.estado !== 'BORRADOR';
  });
    private readonly stepper = viewChild(MatStepper);
  private readonly pasos = viewChildren(MatStep);
  protected readonly cargandoInicial = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly consultando = signal(false);
  protected readonly atencion = signal<AtencionAph | null>(null);
  protected readonly consulta = signal<ConsultaPersonaVista | null>(null);
  /** Documento sobre el que se hizo la consulta: si cambia, la consulta deja de valer. */
  private documentoConsultado = '';
  protected readonly erroresResumen = signal<ErrorFormulario[]>([]);
  protected readonly tiposDocumento = signal<ItemCatalogo[]>([]);
  protected readonly parentescos = signal<ItemCatalogo[]>([]);
  protected readonly mostrarContencion = signal<string | null>(null);
  /** Archivos elegidos que se suben al guardar la atención. */
  protected readonly archivosPendientes = signal<File[]>([]);

  protected readonly esTercero = signal(false);
  protected readonly parentescoOtro = signal(false);
  protected readonly idAtencion = computed(() => this.atencion()?.idAtencion ?? null);
  protected readonly esRemision = computed(() => this.atencion()?.canalIngreso.startsWith('REMISION_') ?? false);
  protected readonly canales = computed<readonly CanalIngreso[]>(() => {
    const actual = this.atencion()?.canalIngreso;
    return actual && !CANALES_DIRECTOS.includes(actual) ? [actual] : CANALES_DIRECTOS;
  });
  protected readonly consultaVigente = computed(() => {
    const c = this.consulta();
    return !!c && this.documentoConsultado === this.documentoActual();
  });
  private readonly documentoActual = signal('');

  /** «APH que atiende» y «Fecha y hora de atención»: las asigna el sistema, no se editan. */
  private readonly momentoApertura = new Date().toISOString();
  protected readonly aphQueAtiende = computed(() => this.atencion()?.tomadaPor ?? this.auth.currentUser?.nombre ?? '');
  protected readonly fechaAtencion = computed(() => this.atencion()?.fechaCreacion ?? this.momentoApertura);

  ngOnInit(): void {
    this.catalogos.obtener('tipos-identificacion').subscribe({
      next: (items) => this.tiposDocumento.set(items),
      error: (e: ErrorAlma) => this.notificacion.error('No pudimos cargar los tipos de documento. Intente de nuevo en un momento.', e)
    });
    this.catalogos.obtener('parentescos-solicitante').subscribe({
      next: (items) => this.parentescos.set(items),
      error: () => undefined
    });

    const g = this.form.controls.identificacion.controls;
    g.numeroIdentificacion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.documentoActual.set(this.claveDocumento()));
    g.tipoIdentificacion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.documentoActual.set(this.claveDocumento()));

    const s = this.form.controls.solicitud.controls;
    s.esTercero.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => {
      this.esTercero.set(v);
      this.ajustarValidadoresSolicitante();
    });
    s.solParentesco.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.ajustarValidadoresSolicitante());

    const alCambiarRegistro = () => this.registroGuardado.set(false);
    this.form.controls.identificacion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(alCambiarRegistro);
    this.form.controls.caracterizacion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(alCambiarRegistro);
    this.form.controls.solicitud.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(alCambiarRegistro);
    this.form.controls.identificacion.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.actualizarSolicitud());
    this.form.controls.solicitud.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.actualizarSolicitud());

    const id = this.route.snapshot.queryParamMap.get('atencion');
    if (id) this.cargarExistente(id);
  }

  tieneCambiosPendientes(): boolean {
    return this.form.dirty || this.archivosPendientes().length > 0;
  }

  /** En una solicitud indirecta la relación es obligatoria, y «¿Cuál?» cuando es «Otro». */
  private ajustarValidadoresSolicitante(): void {
    const s = this.form.controls.solicitud.controls;
    const tercero = s.esTercero.value;
    const otro = tercero && this.extensiones && s.solParentesco.value === PARENTESCO_OTRO;
    this.parentescoOtro.set(otro);
    s.solParentesco.setValidators(tercero ? [Validators.required] : []);
    s.solParentescoOtro.setValidators(otro ? [Validators.required, Validators.maxLength(100)] : [Validators.maxLength(100)]);
    s.solParentesco.updateValueAndValidity({ emitEvent: false });
    s.solParentescoOtro.updateValueAndValidity({ emitEvent: false });
  }

  // ───────────────────────── carga de un borrador o remisión ─────────────────────────

  private cargarExistente(id: string): void {
    this.cargandoInicial.set(true);
    this.errorCarga.set(null);
    this.atenciones.obtener(id).subscribe({
      next: (atencion) => {
        this.cargandoInicial.set(false);
        if (!atencion.editable) {
          this.notificacion.info('Esa atención ya no se puede editar. Le mostramos su detalle.');
          void this.router.navigate(['/linea-alma/aph/atenciones', id], { replaceUrl: true });
          return;
        }
        this.aplicarAtencion(atencion, true);
        // Solo se retoma en «Triaje y derivación» si ya tiene triaje y el registro está completo; si falta
        // algo obligatorio (p. ej. una remisión recién tomada), se vuelve al registro.
        this.actualizarSolicitud();
        this.registroGuardado.set(this.registroCompleto());
        const conTriaje = !!(atencion.triaje || atencion.omisionTriaje);
        this.paso.set(this.registroGuardado() && conTriaje ? 2 : this.solicitudCompleta() ? 1 : 0);
      },
      error: (e: ErrorAlma) => {
        this.cargandoInicial.set(false);
        this.errorCarga.set(e.mensaje);
      }
    });
  }

  protected reintentarCarga(): void {
    const id = this.route.snapshot.queryParamMap.get('atencion');
    if (id) this.cargarExistente(id);
  }

  private aplicarAtencion(atencion: AtencionAph, rehidratarFormulario: boolean): void {
    this.atencion.set(atencion);
    const ident = this.form.controls.identificacion;
    if (rehidratarFormulario) {
      const p = atencion.persona;
      ident.patchValue({ tipoIdentificacion: p.tipoIdentificacion, numeroIdentificacion: p.numeroIdentificacion, canalIngreso: atencion.canalIngreso });
      this.form.controls.caracterizacion.patchValue(valoresCaracterizacion(p));
      const s = atencion.solicitante;
      const nombreSol = separarNombre(s?.nombres);
      const apellidoSol = separarNombre(s?.apellidos);
      this.form.controls.solicitud.patchValue({
        esTercero: s?.esTercero ?? false,
        solPrimerNombre: nombreSol.primero,
        solSegundoNombre: nombreSol.segundo,
        solPrimerApellido: apellidoSol.primero,
        solSegundoApellido: apellidoSol.segundo,
        solParentesco: s?.parentesco ?? '',
        solParentescoOtro: s?.parentescoOtro ?? '',
        solTelefono: s?.telefono ?? '',
        solCorreo: s?.correo ?? '',
        lugarOcurrencia: atencion.lugarOcurrencia ?? '',
        motivoConsulta: atencion.motivoConsulta ?? ''
      });
      this.form.controls.valoracion.patchValue({ notaAph: atencion.notaAph ?? '' });
      this.esTercero.set(s?.esTercero ?? false);
      this.ajustarValidadoresSolicitante();
      this.documentoActual.set(this.claveDocumento());
    }
    // El documento identifica la atención: una vez creada ya no se cambia (el contrato no lo admite en PATCH).
    ident.controls.tipoIdentificacion.disable({ emitEvent: false });
    ident.controls.numeroIdentificacion.disable({ emitEvent: false });
    if (atencion.canalIngreso.startsWith('REMISION_')) ident.controls.canalIngreso.disable({ emitEvent: false });
    this.form.markAsPristine();
  }

  // ───────────────────────── identificación: consulta por documento ─────────────────────────

  protected soloDigitos(): void {
    const ident = this.form.controls.identificacion.controls;
    const tipo = ident.tipoIdentificacion.value;
    const limpio = limpiarDocumento(ident.numeroIdentificacion.value, tipo);
    if (limpio !== ident.numeroIdentificacion.value) ident.numeroIdentificacion.setValue(limpio);
  }

  protected longitudMaxima(): number {
    return longitudMaximaDocumento(this.form.controls.identificacion.controls.tipoIdentificacion.value);
  }

  private claveDocumento(): string {
    const ident = this.form.controls.identificacion.getRawValue();
    return `${ident.tipoIdentificacion}|${ident.numeroIdentificacion}`;
  }

  protected consultar(): void {
    const ident = this.form.controls.identificacion;
    ident.controls.tipoIdentificacion.markAsTouched();
    ident.controls.numeroIdentificacion.markAsTouched();
    if (ident.controls.tipoIdentificacion.invalid || ident.controls.numeroIdentificacion.invalid) return;
    const { tipoIdentificacion, numeroIdentificacion } = ident.getRawValue();
    this.consultando.set(true);
    this.consulta.set(null);
    this.personas.consultar(tipoIdentificacion, numeroIdentificacion).subscribe({
      next: (resultado) => {
        this.consultando.set(false);
        this.consulta.set(resultado);
        this.documentoConsultado = this.claveDocumento();
        this.documentoActual.set(this.claveDocumento());
        const car = this.form.controls.caracterizacion;
        if (resultado.nombres && !car.controls.primerNombre.value) {
          const nombre = separarNombre(resultado.nombres);
          const apellido = separarNombre(resultado.apellidos);
          car.patchValue({
            primerNombre: nombre.primero,
            segundoNombre: nombre.segundo,
            primerApellido: apellido.primero,
            segundoApellido: apellido.segundo
          });
        }
      },
      error: (e: ErrorAlma) => {
        this.consultando.set(false);
        const sinCampo = aplicarErroresServidor(ident, e);
        this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
      }
    });
  }

  // ───────────────────────── guardado ─────────────────────────

  private aVacioNulo(valor: string): string | null {
    const limpio = valor.trim();
    return limpio ? limpio : null;
  }

  private construirDto(): AtencionAphGuardarDto {
    const ident = this.form.controls.identificacion.getRawValue();
    const car = this.form.controls.caracterizacion.getRawValue();
    const sol = this.form.controls.solicitud.getRawValue();
    const val = this.form.controls.valoracion.getRawValue();
    const solicitante: SolicitanteDto | null = sol.esTercero
      ? {
          esTercero: true,
          nombres: unirNombre(sol.solPrimerNombre, sol.solSegundoNombre),
          apellidos: unirNombre(sol.solPrimerApellido, sol.solSegundoApellido),
          telefono: this.aVacioNulo(sol.solTelefono),
          correo: this.aVacioNulo(sol.solCorreo),
          parentesco: this.aVacioNulo(sol.solParentesco),
          parentescoOtro: sol.solParentesco === PARENTESCO_OTRO ? this.aVacioNulo(sol.solParentescoOtro) : null
        }
      : null;
    return {
      canalIngreso: ident.canalIngreso || undefined,
      persona: {
        ...(this.atencion() ? {} : { tipoIdentificacion: ident.tipoIdentificacion, numeroIdentificacion: ident.numeroIdentificacion }),
        ...construirPersona(car)
      },
      solicitante,
      lugarOcurrencia: sol.lugarOcurrencia || null,
      motivoConsulta: this.aVacioNulo(sol.motivoConsulta),
      notaAph: this.aVacioNulo(val.notaAph)
    };
  }

  /** Crea o actualiza el borrador. Emite la atención guardada. */
  private persistir(): Observable<AtencionAph> {
    const dto = this.construirDto();
    const actual = this.atencion();
    return actual ? this.atenciones.actualizar(actual.idAtencion, { ...dto, version: actual.version }) : this.atenciones.crear(dto);
  }

  private ejecutarGuardado(alExito: (atencion: AtencionAph) => void): void {
    this.guardando.set(true);
    this.persistir().subscribe({
      next: (atencion) => {
        this.aplicarAtencion(atencion, false);
        this.subirEvidencias(atencion, alExito);
      },
      error: (e: ErrorAlma) => {
        this.guardando.set(false);
        this.alFallar(e);
      }
    });
  }

  /** Sube los archivos elegidos una vez que la atención existe; si no hay ninguno, sigue de largo. */
  private subirEvidencias(atencion: AtencionAph, alExito: (atencion: AtencionAph) => void): void {
    const pendientes = this.archivosPendientes();
    if (!pendientes.length) {
      this.guardando.set(false);
      alExito(atencion);
      return;
    }
    this.atenciones.adjuntarEvidencias(atencion.idAtencion, pendientes).subscribe({
      next: (conArchivos) => {
        this.guardando.set(false);
        this.archivosPendientes.set([]);
        this.atencion.set(conArchivos);
        alExito(conArchivos);
      },
      error: (e: ErrorAlma) => {
        this.guardando.set(false);
        this.notificacion.error(`La atención se guardó, pero no pudimos subir los archivos. ${e.mensaje}`, e);
      }
    });
  }

  protected quitarEvidenciaGuardada(idEvidencia: string): void {
    const actual = this.atencion();
    if (!actual) return;
    this.atenciones.quitarEvidencia(actual.idAtencion, idEvidencia).subscribe({
      next: (atencion) => this.atencion.set(atencion),
      error: (e: ErrorAlma) => this.notificacion.error(e.mensaje, e)
    });
  }

  private alFallar(e: ErrorAlma): void {
    const sinCampo = aplicarErroresServidor(this.form, e);
    this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
    if (e.tipo === 'conflicto' && this.atencion()) this.recargarVersion();
  }

  /** Trae la versión más reciente sin pisar lo que la persona tiene escrito en pantalla. */
  private recargarVersion(): void {
    const id = this.atencion()?.idAtencion;
    if (!id) return;
    this.atenciones.obtener(id).subscribe({
      next: (atencion) => this.atencion.set(atencion),
      error: () => undefined
    });
  }

  protected recargarTrasConflicto(): void {
    this.notificacion.info('La atención cambió mientras la editaba. Cargamos la versión más reciente.');
    this.recargarVersion();
  }

  protected actualizarAtencion(atencion: AtencionAph): void {
    this.atencion.set(atencion);
  }

  /** «Guardar borrador»: no valida lo pendiente, solo exige documento y canal para poder crear. */
  protected guardarBorrador(): void {
    const ident = this.form.controls.identificacion;
    if (!this.atencion() && ident.invalid) {
      ident.markAllAsTouched();
      this.erroresResumen.set(recolectarErrores(ident, CAMPOS_IDENTIFICACION, 'nueva-ident'));
      this.paso.set(ident.controls.canalIngreso.invalid ? 0 : 1);
      return;
    }
    this.erroresResumen.set([]);
    this.ejecutarGuardado((a) => this.notificacion.exito(`Borrador guardado (${a.idAtencion}).`));
  }

  /** Revisión silenciosa (sin marcar campos) de lo obligatorio del registro. */
  private registroCompleto(): boolean {
    const f = this.form.controls;
    return f.identificacion.valid && f.caracterizacion.valid && f.solicitud.valid;
  }

  /**
   * Revisión silenciosa del primer paso: canal y, si la solicitud es indirecta, la relación (y «¿Cuál?»
   * si es «Otro») y que lo opcional que se escribió tenga formato válido.
   */
  private actualizarSolicitud(): void {
    const f = this.form.controls;
    const sol = f.solicitud.getRawValue();
    let completa = !!f.identificacion.getRawValue().canalIngreso;
    if (sol.esTercero) {
      const c = f.solicitud.controls;
      completa =
        completa &&
        !!sol.solParentesco &&
        (!this.extensiones || sol.solParentesco !== PARENTESCO_OTRO || !!sol.solParentescoOtro.trim()) &&
        [c.solPrimerNombre, c.solSegundoNombre, c.solPrimerApellido, c.solSegundoApellido, c.solTelefono, c.solCorreo].every((x) => x.valid);
    }
    this.solicitudCompleta.set(completa);
  }

  /**
   * Mueve el paso. Los pasos previos se marcan completos con la API del stepper (el `[completed]` del
   * template se aplica después del `selectedIndex` y bloquearía el salto en modo lineal).
   */
  protected irAlPaso(indice: number): void {
    const pasos = this.pasos();
    if (indice >= 1 && pasos[0]) pasos[0].completed = true;
    if (indice >= 2 && pasos[1]) pasos[1].completed = true;
    if (indice >= 3 && pasos[2]) pasos[2].completed = true;
    const stepper = this.stepper();
    if (stepper) stepper.selectedIndex = indice;
    this.paso.set(indice);
  }

  /** Abre el triaje: el registro queda completo y guardado. */
  private irAlTriaje(): void {
    this.solicitudCompleta.set(true);
    this.registroGuardado.set(true);
    this.irAlPaso(2);
  }

  /** «Continuar» del primer paso: exige canal (y la relación si es indirecta) antes de pasar a la persona. */
  protected continuarSolicitud(): void {
    this.erroresResumen.set([]);
    this.actualizarSolicitud();
    if (!this.solicitudCompleta()) {
      const f = this.form.controls;
      f.identificacion.controls.canalIngreso.markAsTouched();
      f.solicitud.markAllAsTouched();
      this.erroresResumen.set([
        ...recolectarErrores(f.identificacion, { canalIngreso: CAMPOS_IDENTIFICACION['canalIngreso'] }, 'nueva-ident'),
        ...(f.solicitud.controls.esTercero.value
          ? recolectarErrores(
              f.solicitud,
              { solParentesco: CAMPOS_SOLICITUD['solParentesco'], solParentescoOtro: CAMPOS_SOLICITUD['solParentescoOtro'], solTelefono: CAMPOS_SOLICITUD['solTelefono'], solCorreo: CAMPOS_SOLICITUD['solCorreo'] },
              'nueva-sol'
            )
          : [])
      ]);
      return;
    }
    this.irAlPaso(1);
  }

  /** Valida lo que exige el primer paso y devuelve los errores para el resumen, en el orden de la pantalla. */
  private erroresDelRegistro(): ErrorFormulario[] {
    const ident = this.form.controls.identificacion;
    const car = this.form.controls.caracterizacion;
    const sol = this.form.controls.solicitud;
    ident.markAllAsTouched();
    car.markAllAsTouched();
    sol.markAllAsTouched();
    return [
      ...recolectarErrores(ident, CAMPOS_IDENTIFICACION, 'nueva-ident'),
      ...recolectarErrores(sol, { solParentesco: CAMPOS_SOLICITUD['solParentesco'], solParentescoOtro: CAMPOS_SOLICITUD['solParentescoOtro'], solTelefono: CAMPOS_SOLICITUD['solTelefono'], solCorreo: CAMPOS_SOLICITUD['solCorreo'] }, 'nueva-sol'),
      ...recolectarErrores(car, CAMPOS_PERSONA, 'nueva-car'),
      ...recolectarErrores(sol, { motivoConsulta: CAMPOS_SOLICITUD['motivoConsulta'] }, 'nueva-sol')
    ];
  }

  /** «Guardar y continuar» del registro: valida, guarda (con los archivos) y pasa a «Triaje y derivación». */
  protected continuar(): void {
    this.erroresResumen.set([]);
    const errores = this.erroresDelRegistro();
    if (errores.length) {
      this.erroresResumen.set(errores);
      if (!this.solicitudCompleta()) this.paso.set(0);
      return;
    }
    if (!this.atencion() && !this.consultaVigente()) {
      this.notificacion.info('Antes de continuar consulte el documento: así sabemos si la persona ya tiene seguimiento.');
      return;
    }
    this.ejecutarGuardado(() => this.irAlTriaje());
  }

  /** Guarda la nota de valoración APH sin tocar el resto de la atención. */
  protected guardarNota(): void {
    const actual = this.atencion();
    const nota = this.form.controls.valoracion.controls.notaAph;
    nota.markAsTouched();
    if (!actual || nota.invalid) return;
    this.guardando.set(true);
    this.atenciones.actualizar(actual.idAtencion, { version: actual.version, notaAph: this.aVacioNulo(nota.value) }).subscribe({
      next: (atencion) => {
        this.guardando.set(false);
        this.atencion.set(atencion);
        nota.markAsPristine();
        this.notificacion.exito('Nota de valoración guardada.');
      },
      error: (e: ErrorAlma) => {
        this.guardando.set(false);
        this.alFallar(e);
      }
    });
  }

  protected abrirContencion(numeroCaso: string): void {
    // La contención se registra sobre una atención `ALMA-…` nueva (RN-ALMA-06): se crea el borrador si falta.
    const registrar = () => {
      this.mostrarContencion.set(numeroCaso);
      this.irAlTriaje();
    };
    if (this.atencion()) {
      registrar();
      return;
    }
    const ident = this.form.controls.identificacion;
    if (ident.invalid) {
      ident.markAllAsTouched();
      this.erroresResumen.set(recolectarErrores(ident, CAMPOS_IDENTIFICACION, 'nueva-ident'));
      return;
    }
    this.ejecutarGuardado(registrar);
  }

  protected errorCampo(grupo: 'identificacion' | 'solicitud' | 'valoracion', control: string, etiqueta: string): string | null {
    return mensajeDeError(this.form.get([grupo, control]), etiqueta);
  }

  protected copiarId(): void {
    const id = this.idAtencion();
    if (!id) return;
    navigator.clipboard?.writeText(id).then(
      () => this.notificacion.exito('Código copiado.'),
      () => this.notificacion.info(`Código de la atención: ${id}`)
    );
  }

  protected etiquetaCanal(canal: CanalIngreso): string {
    return this.etiquetasCanal[canal];
  }
}
