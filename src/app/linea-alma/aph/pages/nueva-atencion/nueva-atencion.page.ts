import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DescripcionCampos, ErrorFormulario, recolectarErrores } from '../../../../core/a11y/errores-formulario';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ResumenErroresComponent } from '../../../../core/a11y/resumen-errores.component';
import { limpiarDocumento, longitudMaximaDocumento } from '../../../../core/forms/documento-identidad';
import { ConCambiosPendientes } from '../../../../core/navegacion/cambios-sin-guardar.guard';
import { CaracterizacionFormComponent } from '../../../shared/components/caracterizacion-form/caracterizacion-form.component';
import { crearGrupoCaracterizacion } from '../../../shared/components/caracterizacion-form/caracterizacion-campos';
import { ContencionPostCierreFormComponent } from '../../../shared/components/contencion-post-cierre-form/contencion-post-cierre-form.component';
import { CatalogosAlmaService } from '../../../shared/catalogos/catalogos-alma.service';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { AlmaPermisosService } from '../../../shared/permisos/alma-permisos.service';
import { AtencionAphGuardarDto, SolicitanteDto } from '../../../shared/types/alma-dto';
import { CanalIngreso, ETIQUETA_CANAL_INGRESO, ItemCatalogo } from '../../../shared/types/alma.types';
import { AlertaSeguimientoComponent } from '../../components/alerta-seguimiento/alerta-seguimiento.component';
import { PasoDerivacionComponent } from '../../components/paso-derivacion/paso-derivacion.component';
import { PasoTriajeComponent } from '../../components/paso-triaje/paso-triaje.component';
import { AtencionAph, AtencionesAphService } from '../../services/atenciones-aph.service';
import { ConsultaPersonaVista, PersonasAlmaService } from '../../services/personas-alma.service';

/** Canales que APH puede elegir al registrar una llamada. Las remisiones llegan por la bandeja. */
const CANALES_DIRECTOS: readonly CanalIngreso[] = ['LLAMADA', 'WHATSAPP'];

const CAMPOS_IDENTIFICACION: DescripcionCampos = {
  tipoIdentificacion: { etiqueta: 'Tipo de documento', mensajes: { required: 'Seleccione el tipo de documento.' } },
  numeroIdentificacion: { etiqueta: 'Número de documento', mensajes: { required: 'Escriba el número de documento.' } },
  canalIngreso: { etiqueta: 'Canal de ingreso', mensajes: { required: 'Indique por qué canal llegó la solicitud.' } }
};

const CAMPOS_SOLICITUD: DescripcionCampos = {
  motivoConsulta: { etiqueta: 'Motivo de consulta', mensajes: { required: 'Escriba el motivo de consulta.' } }
};

/**
 * Registro de atención APH — `/linea-alma/aph/nueva` (H-1.1, H-1.2, H-1.3 y H-1.4).
 *
 * Stepper: **Identificación → Caracterización → Motivo y solicitante → Triaje y derivación.**
 * Cada «Guardar y continuar» persiste el borrador (`POST` la primera vez, que genera el
 * `ALMA-…`, y `PATCH` con `version` después), así que no se pierde nada al cerrar la pestaña y
 * el ID aparece desde el primer paso (Q4). Se puede **retomar un borrador** o una remisión
 * tomada con `?atencion=ALMA-…`.
 *
 * Reglas que rigen la pantalla: una llamada nueva **siempre** genera una atención nueva
 * (RN-ALMA-06, la consulta previa solo informa); el Técnico APH **no ve notas clínicas**
 * (RNF-ALMA-002); sin consentimiento no hay derivación (RN-ALMA-02).
 */
@Component({
  selector: 'app-nueva-atencion-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    ResumenErroresComponent,
    CaracterizacionFormComponent,
    AlertaSeguimientoComponent,
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
  private readonly destroyRef = inject(DestroyRef);
  protected readonly permisos = inject(AlmaPermisosService);

  protected readonly etiquetasCanal = ETIQUETA_CANAL_INGRESO;
  protected readonly demo = Object.values(environment.lineaAlma.mocks).some(Boolean);

  protected readonly form = this.fb.nonNullable.group({
    identificacion: this.fb.nonNullable.group({
      tipoIdentificacion: ['', Validators.required],
      numeroIdentificacion: ['', [Validators.required, Validators.minLength(4)]],
      canalIngreso: ['' as CanalIngreso | '', Validators.required]
    }),
    caracterizacion: crearGrupoCaracterizacion(),
    solicitud: this.fb.nonNullable.group({
      esTercero: [false],
      solNombres: ['', Validators.maxLength(100)],
      solApellidos: ['', Validators.maxLength(100)],
      solTelefono: ['', Validators.pattern(/^\+?\d{7,15}$/)],
      solParentesco: [''],
      motivoConsulta: ['', [Validators.required, Validators.maxLength(2000)]],
      notaAph: ['', Validators.maxLength(2000)]
    })
  });

  protected readonly paso = signal(0);
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

  protected readonly esTercero = signal(false);
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
    this.form.controls.solicitud.controls.esTercero.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.esTercero.set(v));

    const id = this.route.snapshot.queryParamMap.get('atencion');
    if (id) this.cargarExistente(id);
  }

  tieneCambiosPendientes(): boolean {
    return this.form.dirty;
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
        // Una atención ya creada se retoma en el primer paso pendiente.
        this.paso.set(atencion.estado === 'BORRADOR' ? 1 : 3);
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
      this.form.controls.caracterizacion.patchValue({
        nombres: p.nombres ?? '',
        apellidos: p.apellidos ?? '',
        telefonoPrincipal: p.telefonoPrincipal ?? '',
        correoPersonal: p.correoPersonal ?? '',
        ciudad: p.ciudad ?? '',
        estrato: p.estrato ? String(p.estrato) : ''
      });
      const s = atencion.solicitante;
      this.form.controls.solicitud.patchValue({
        esTercero: s?.esTercero ?? false,
        solNombres: s?.nombres ?? '',
        solApellidos: s?.apellidos ?? '',
        solTelefono: s?.telefono ?? '',
        solParentesco: s?.parentesco ?? '',
        motivoConsulta: atencion.motivoConsulta ?? '',
        notaAph: atencion.notaAph ?? ''
      });
      this.documentoActual.set(this.claveDocumento());
    }
    // El documento identifica la atención: una vez creada ya no se cambia (el contrato no lo admite en PATCH).
    ident.controls.tipoIdentificacion.disable({ emitEvent: false });
    ident.controls.numeroIdentificacion.disable({ emitEvent: false });
    if (atencion.canalIngreso.startsWith('REMISION_')) ident.controls.canalIngreso.disable({ emitEvent: false });
    this.form.markAsPristine();
  }

  // ───────────────────────── paso 1: consulta por documento ─────────────────────────

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
        if (resultado.nombres && !car.controls.nombres.value) {
          car.patchValue({ nombres: resultado.nombres, apellidos: resultado.apellidos ?? '' });
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
    const solicitante: SolicitanteDto | null = sol.esTercero
      ? {
          esTercero: true,
          nombres: this.aVacioNulo(sol.solNombres),
          apellidos: this.aVacioNulo(sol.solApellidos),
          telefono: this.aVacioNulo(sol.solTelefono),
          parentesco: this.aVacioNulo(sol.solParentesco)
        }
      : null;
    return {
      canalIngreso: ident.canalIngreso || undefined,
      persona: {
        ...(this.atencion() ? {} : { tipoIdentificacion: ident.tipoIdentificacion, numeroIdentificacion: ident.numeroIdentificacion }),
        nombres: this.aVacioNulo(car.nombres),
        apellidos: this.aVacioNulo(car.apellidos),
        telefonoPrincipal: this.aVacioNulo(car.telefonoPrincipal),
        correoPersonal: this.aVacioNulo(car.correoPersonal),
        ciudad: this.aVacioNulo(car.ciudad),
        estrato: car.estrato ? Number(car.estrato) : null
      },
      solicitante,
      motivoConsulta: this.aVacioNulo(sol.motivoConsulta),
      notaAph: this.aVacioNulo(sol.notaAph)
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
        this.guardando.set(false);
        this.aplicarAtencion(atencion, false);
        alExito(atencion);
      },
      error: (e: ErrorAlma) => {
        this.guardando.set(false);
        this.alFallar(e);
      }
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
      this.paso.set(0);
      return;
    }
    this.erroresResumen.set([]);
    this.ejecutarGuardado((a) => this.notificacion.exito(`Borrador guardado (${a.idAtencion}).`));
  }

  protected continuar(desde: 0 | 1 | 2): void {
    this.erroresResumen.set([]);
    if (desde === 0) {
      const ident = this.form.controls.identificacion;
      ident.markAllAsTouched();
      const errores = recolectarErrores(ident, CAMPOS_IDENTIFICACION, 'nueva-ident');
      if (errores.length) {
        this.erroresResumen.set(errores);
        return;
      }
      if (!this.atencion() && !this.consultaVigente()) {
        this.notificacion.info('Antes de continuar consulte el documento: así sabemos si la persona ya tiene seguimiento.');
        return;
      }
    }
    if (desde === 2) {
      const solicitud = this.form.controls.solicitud;
      solicitud.markAllAsTouched();
      const errores = recolectarErrores(solicitud, CAMPOS_SOLICITUD, 'nueva-sol');
      if (errores.length || solicitud.invalid) {
        this.erroresResumen.set(errores);
        return;
      }
    }
    this.ejecutarGuardado(() => this.paso.set(desde + 1));
  }

  protected abrirContencion(numeroCaso: string): void {
    // La contención se registra sobre una atención `ALMA-…` nueva (RN-ALMA-06): se crea el borrador si falta.
    const registrar = () => {
      this.mostrarContencion.set(numeroCaso);
      this.paso.set(3);
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

  protected errorCampo(grupo: 'identificacion' | 'solicitud', control: string, etiqueta: string): string | null {
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
