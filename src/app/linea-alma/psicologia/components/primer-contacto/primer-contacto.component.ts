import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { DialogoService } from '../../../../core/a11y/dialogo.service';
import { DescripcionCampos, ErrorFormulario, recolectarErrores } from '../../../../core/a11y/errores-formulario';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { ResumenErroresComponent } from '../../../../core/a11y/resumen-errores.component';
import { BorradorLocal, crearBorrador } from '../../../shared/borrador/borrador-local';
import { CatalogosAlmaService } from '../../../shared/catalogos/catalogos-alma.service';
import { CaracterizacionFormComponent } from '../../../shared/components/caracterizacion-form/caracterizacion-form.component';
import { GrupoCaracterizacion, crearGrupoCaracterizacion } from '../../../shared/components/caracterizacion-form/caracterizacion-campos';
import { ConsentimientoInformadoComponent } from '../../../shared/components/consentimiento-informado/consentimiento-informado.component';
import { ErrorAlma } from '../../../shared/http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../../shared/http/errores-servidor';
import { ConsentimientoDto } from '../../../shared/types/alma-dto';
import { CasoActivoResumenDto, PrimerContactoRequestDto, PrimerContactoRespuestaDto } from '../../../shared/types/alma-psicologia-dto';
import { ETIQUETA_RIESGO_CLINICO, ETIQUETA_TRIAJE, ItemCatalogo, RIESGOS_CLINICOS, RiesgoClinico } from '../../../shared/types/alma.types';
import { fechaFuturaValidator } from '../../dominio/seguimientos';
import { NovedadPsicologia, NovedadesPsicologiaService } from '../../services/novedades-psicologia.service';

type Convivencia = '' | 'SI' | 'NO';
type DecisionCaso = 'VINCULAR' | 'CASO_NUEVO';

/** Lo que se guarda como borrador local entre pasos (RF-ALMA-005). */
interface BorradorPrimerContacto {
  consentimiento: ConsentimientoDto | null;
  caracterizacion: Record<string, string>;
  valoracion: { nivel: RiesgoClinico | ''; descripcion: string };
  dimensiones: string[];
  agresor: { nombres: string; apellidos: string; vinculo: string; convivencia: Convivencia; observaciones: string };
  acuerdos: { acuerdos: string; proximoControl: string };
}

const CAMPOS_VALORACION: DescripcionCampos = {
  nivel: { etiqueta: 'Nivel de riesgo', mensajes: { required: 'Indique el nivel de riesgo valorado.' } },
  descripcion: { etiqueta: 'Valoración clínica', mensajes: { required: 'Describa la valoración.', minlength: 'Describa la valoración con al menos 10 caracteres.' } }
};
const CAMPOS_ACUERDOS: DescripcionCampos = {
  acuerdos: { etiqueta: 'Acuerdos', mensajes: { required: 'Registre los acuerdos con la persona.', minlength: 'Describa los acuerdos con al menos 10 caracteres.' } },
  proximoControl: { etiqueta: 'Próximo control', mensajes: { required: 'Programe la fecha y hora del próximo control.', fechaPasada: 'La fecha del próximo control no puede ser pasada.' } }
};
const CAMPOS_CARACTERIZACION: DescripcionCampos = {
  correoPersonal: { etiqueta: 'Correo personal' },
  telefonoPrincipal: { etiqueta: 'Teléfono principal' }
};

/**
 * Primer contacto efectivo y creación del caso (J-1.4; `RF-ALMA-PSI-003`, `RF-ALMA-001`,
 * `RF-ALMA-004`, `RN-ALMA-02`, `RN-ALMA-04`, `RN-ALMA-06`).
 *
 * Flujo por pasos: consentimiento **verbal** (`ConsentimientoInformado`, F5) → caracterización
 * (`CaracterizacionForm`, F4) → valoración clínica de riesgo (campo propio; el triaje de APH se
 * muestra al lado y no se modifica) → 15 dimensiones (catálogo placeholder) → presunto agresor
 * opcional (nunca bloquea) → acuerdos y próximo control. Cada paso guarda un borrador local.
 *
 * Si la persona ya tiene un caso activo, **nunca se vincula solo**: la UI pide una decisión
 * explícita y la confirma antes de enviar `vincularA` (si no lo hace, el servidor responde 422
 * `CASO_ACTIVO_EXISTENTE` y la UI vuelve a pedirla). Al guardar, el servidor devuelve `CAS-…`.
 */
@Component({
  selector: 'app-primer-contacto',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatStepperModule,
    CaracterizacionFormComponent,
    ConsentimientoInformadoComponent,
    ResumenErroresComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './primer-contacto.component.html',
  styleUrl: './primer-contacto.component.scss'
})
export class PrimerContactoComponent implements OnInit {
  private readonly servicio = inject(NovedadesPsicologiaService);
  private readonly catalogos = inject(CatalogosAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly dialogo = inject(DialogoService);
  private readonly fb = inject(FormBuilder);

  readonly novedad = input.required<NovedadPsicologia>();
  readonly soloLectura = input(false);
  readonly casoCreado = output<PrimerContactoRespuestaDto>();
  readonly conflicto = output<void>();
  readonly cancelado = output<void>();

  protected readonly etiquetaTriaje = ETIQUETA_TRIAJE;
  protected readonly etiquetaRiesgo = ETIQUETA_RIESGO_CLINICO;
  protected readonly riesgos = RIESGOS_CLINICOS;
  protected readonly paso = signal(0);
  protected readonly enviando = signal(false);
  protected readonly erroresResumen = signal<ErrorFormulario[]>([]);
  protected readonly consentimiento = signal<ConsentimientoDto | null>(null);
  protected readonly dimensionesCatalogo = signal<ItemCatalogo[]>([]);
  protected readonly vinculosCatalogo = signal<ItemCatalogo[]>([]);
  protected readonly errorCatalogos = signal(false);
  protected readonly borradorRestauradoEn = signal<string | null>(null);
  /** El servidor (o la novedad) indica que ya hay un caso activo: hay que decidir. */
  protected readonly casoDetectado = signal<CasoActivoResumenDto | null>(null);
  protected readonly decisionCaso = signal<DecisionCaso | null>(null);
  private enviado = false;
  private borrador!: BorradorLocal<BorradorPrimerContacto>;

  protected readonly caracterizacion: GrupoCaracterizacion = crearGrupoCaracterizacion();
  protected readonly valoracion = this.fb.nonNullable.group({
    nivel: ['' as RiesgoClinico | '', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(3000)]]
  });
  protected readonly dimensiones = new FormControl<string[]>([], { nonNullable: true });
  protected readonly agresor = this.fb.nonNullable.group({
    nombres: ['', Validators.maxLength(100)],
    apellidos: ['', Validators.maxLength(100)],
    vinculo: [''],
    convivencia: ['' as Convivencia],
    observaciones: ['', Validators.maxLength(1000)]
  });
  protected readonly acuerdos = this.fb.nonNullable.group({
    acuerdos: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(3000)]],
    proximoControl: ['', [Validators.required, fechaFuturaValidator()]]
  });

  protected readonly casoActivo = computed(() => this.casoDetectado() ?? this.novedad().casoActivo);
  /** Se pide la decisión cuando hay caso activo pendiente de resolver (recontacto) o el servidor lo exigió. */
  protected readonly requiereDecision = computed(() => !!this.casoActivo() && (this.novedad().recontacto || !!this.casoDetectado()));

  ngOnInit(): void {
    this.borrador = crearBorrador<BorradorPrimerContacto>(`primer-contacto:${this.novedad().idAtencion}`);
    this.prellenarCaracterizacion();
    this.restaurarBorrador();
    this.cargarCatalogos();
    if (this.soloLectura()) this.deshabilitarTodo();
  }

  /** Para `cambiosSinGuardarGuard` (lo expone la página). */
  tieneCambiosPendientes(): boolean {
    if (this.enviado || this.soloLectura()) return false;
    return this.caracterizacion.dirty || this.valoracion.dirty || this.dimensiones.dirty || this.agresor.dirty || this.acuerdos.dirty || !!this.consentimiento();
  }

  protected cargarCatalogos(): void {
    this.errorCatalogos.set(false);
    this.catalogos.obtener('dimensiones-salud-mental').subscribe({
      next: (items) => this.dimensionesCatalogo.set(items),
      error: () => {
        this.catalogos.invalidar('dimensiones-salud-mental');
        this.errorCatalogos.set(true);
      }
    });
    this.catalogos.obtener('vinculos-agresor').subscribe({
      next: (items) => this.vinculosCatalogo.set(items),
      // El vínculo es opcional: sin catálogo queda «Sin dato» y no bloquea.
      error: () => undefined
    });
  }

  protected irA(paso: number): void {
    this.guardarBorrador(false);
    this.paso.set(paso);
  }

  protected alternarDimension(codigo: string, marcada: boolean): void {
    const actual = this.dimensiones.value;
    this.dimensiones.setValue(marcada ? [...new Set([...actual, codigo])] : actual.filter((c) => c !== codigo));
    this.dimensiones.markAsDirty();
  }

  protected tieneDimension(codigo: string): boolean {
    return this.dimensiones.value.includes(codigo);
  }

  protected error(grupo: 'valoracion' | 'agresor' | 'acuerdos', control: string, etiqueta: string): string | null {
    const formulario: FormGroup = grupo === 'valoracion' ? this.valoracion : grupo === 'agresor' ? this.agresor : this.acuerdos;
    const c = formulario.get(control);
    if (c?.errors?.['fechaPasada'] && (c.touched || c.dirty)) return String(c.errors['fechaPasada']);
    return mensajeDeError(c, etiqueta);
  }

  protected guardarBorrador(avisar = true): void {
    if (this.soloLectura()) return;
    const guardado = this.borrador.guardar(this.estadoActual(), this.paso());
    if (avisar) this.notificacion.exito(`Borrador guardado (${new Date(guardado.guardadoEn).toLocaleTimeString('es-CO')}). Puede retomarlo desde esta novedad.`);
  }

  protected descartarBorrador(): void {
    this.borrador.limpiar();
    this.borradorRestauradoEn.set(null);
    this.notificacion.info('Borrador descartado.');
  }

  protected guardar(): void {
    if (this.soloLectura()) return;
    const errores = this.validar();
    this.erroresResumen.set(errores);
    if (errores.length) return;

    const casoActivo = this.casoActivo();
    if (this.requiereDecision() && casoActivo) {
      const decision = this.decisionCaso();
      if (!decision) {
        this.paso.set(5);
        this.notificacion.info(`La persona ya tiene el caso ${casoActivo.numeroCaso} activo. Indique si desea vincular esta atención o abrir un caso nuevo.`);
        return;
      }
      if (decision === 'VINCULAR') {
        this.dialogo
          .confirmar({
            titulo: 'Vincular al caso existente',
            subtitulo: `Caso ${casoActivo.numeroCaso}`,
            mensaje: 'La atención quedará vinculada a ese caso en vez de abrir uno nuevo. La decisión es de Psicología y queda en el historial.',
            textoConfirmar: 'Vincular al caso',
            iconoConfirmar: 'link',
            textoCancelar: 'Revisar'
          })
          .subscribe({
            next: (confirmado) => confirmado && this.enviar(casoActivo.numeroCaso),
            error: () => undefined
          });
        return;
      }
      this.enviar('CASO_NUEVO');
      return;
    }
    this.enviar(null);
  }

  private enviar(vincularA: string | 'CASO_NUEVO' | null): void {
    const novedad = this.novedad();
    this.enviando.set(true);
    this.servicio.registrarPrimerContacto(novedad.idAtencion, this.construirDto(vincularA)).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.enviado = true;
        this.borrador.limpiar();
        this.notificacion.exito(
          respuesta.vinculado ? `Atención vinculada al caso ${respuesta.numeroCaso}.` : `Caso ${respuesta.numeroCaso} creado. Próximo control programado.`
        );
        this.casoCreado.emit(respuesta);
      },
      error: (e: ErrorAlma) => {
        this.enviando.set(false);
        if (e.codigo === 'CASO_ACTIVO_EXISTENTE') {
          // RN-ALMA-06: el servidor exige una decisión explícita; se muestra el bloque de decisión en el último paso.
          const detalle = e.detalles as Partial<CasoActivoResumenDto>;
          this.casoDetectado.set(
            detalle.numeroCaso
              ? {
                  numeroCaso: detalle.numeroCaso,
                  estado: detalle.estado ?? 'ACTIVO',
                  fechaApertura: detalle.fechaApertura ?? '',
                  profesional: detalle.profesional ?? null,
                  numeroSeguimientos: detalle.numeroSeguimientos ?? 0,
                  proximoControl: detalle.proximoControl ?? null
                }
              : this.novedad().casoActivo
          );
          this.decisionCaso.set(null);
          this.paso.set(5);
          this.notificacion.info(e.mensaje);
          return;
        }
        const sinCampo = [
          ...aplicarErroresServidor(this.valoracion, e),
          ...aplicarErroresServidor(this.acuerdos, e),
          ...aplicarErroresServidor(this.caracterizacion, e)
        ];
        this.notificacion.error(sinCampo[0] ?? e.mensaje, e);
        if (e.tipo === 'conflicto') this.conflicto.emit();
      }
    });
  }

  private validar(): ErrorFormulario[] {
    this.valoracion.markAllAsTouched();
    this.acuerdos.markAllAsTouched();
    this.caracterizacion.markAllAsTouched();
    const errores: ErrorFormulario[] = [];
    if (!this.consentimiento()?.otorgado) {
      errores.push({ id: 'pc-consentimiento', etiqueta: 'Consentimiento verbal', mensaje: 'Registre que la persona aceptó de forma voluntaria antes de continuar.' });
    }
    errores.push(...recolectarErrores(this.caracterizacion, CAMPOS_CARACTERIZACION, 'pc-car'));
    errores.push(...recolectarErrores(this.valoracion, CAMPOS_VALORACION, 'pc-val'));
    errores.push(...recolectarErrores(this.acuerdos, CAMPOS_ACUERDOS, 'pc-acu'));
    if (errores.length) {
      const primero = errores[0].id;
      this.paso.set(primero.startsWith('pc-consentimiento') ? 0 : primero.startsWith('pc-car') ? 1 : primero.startsWith('pc-val') ? 2 : 5);
    }
    return errores;
  }

  private construirDto(vincularA: string | 'CASO_NUEVO' | null): PrimerContactoRequestDto {
    const car = this.caracterizacion.getRawValue();
    const val = this.valoracion.getRawValue();
    const agr = this.agresor.getRawValue();
    const acu = this.acuerdos.getRawValue();
    const vacioNulo = (v: string) => (v.trim() ? v.trim() : null);
    const agresorRelleno = Object.values({ ...agr, convivencia: agr.convivencia || '' }).some((v) => String(v).trim());
    return {
      version: this.novedad().version,
      consentimiento: this.consentimiento()!,
      persona: {
        nombres: vacioNulo(car.nombres),
        apellidos: vacioNulo(car.apellidos),
        telefonoPrincipal: vacioNulo(car.telefonoPrincipal),
        correoPersonal: vacioNulo(car.correoPersonal),
        ciudad: vacioNulo(car.ciudad),
        estrato: car.estrato ? Number(car.estrato) : null
      },
      valoracionRiesgo: { nivel: val.nivel as RiesgoClinico, descripcion: val.descripcion.trim() },
      dimensiones: this.dimensiones.value,
      presuntoAgresor: agresorRelleno
        ? {
            nombres: vacioNulo(agr.nombres),
            apellidos: vacioNulo(agr.apellidos),
            vinculo: vacioNulo(agr.vinculo),
            convivencia: agr.convivencia === 'SI' ? true : agr.convivencia === 'NO' ? false : null,
            observaciones: vacioNulo(agr.observaciones)
          }
        : null,
      acuerdos: acu.acuerdos.trim(),
      proximoControl: new Date(acu.proximoControl).toISOString(),
      vincularA
    };
  }

  private estadoActual(): BorradorPrimerContacto {
    return {
      consentimiento: this.consentimiento(),
      caracterizacion: this.caracterizacion.getRawValue(),
      valoracion: this.valoracion.getRawValue(),
      dimensiones: this.dimensiones.value,
      agresor: this.agresor.getRawValue(),
      acuerdos: this.acuerdos.getRawValue()
    };
  }

  private prellenarCaracterizacion(): void {
    const p = this.novedad().persona;
    this.caracterizacion.patchValue({
      nombres: p.nombres ?? '',
      apellidos: p.apellidos ?? '',
      telefonoPrincipal: p.telefonoPrincipal ?? '',
      correoPersonal: p.correoPersonal ?? '',
      ciudad: p.ciudad ?? '',
      estrato: p.estrato === null ? '' : String(p.estrato)
    });
  }

  private restaurarBorrador(): void {
    const guardado = this.borrador.leer();
    if (!guardado || this.soloLectura()) return;
    const d = guardado.datos;
    this.consentimiento.set(d.consentimiento ?? null);
    this.caracterizacion.patchValue(d.caracterizacion ?? {});
    this.valoracion.patchValue(d.valoracion ?? {});
    this.dimensiones.setValue(d.dimensiones ?? []);
    this.agresor.patchValue(d.agresor ?? {});
    this.acuerdos.patchValue(d.acuerdos ?? {});
    this.paso.set(guardado.paso ?? 0);
    this.borradorRestauradoEn.set(guardado.guardadoEn);
  }

  private deshabilitarTodo(): void {
    this.caracterizacion.disable();
    this.valoracion.disable();
    this.dimensiones.disable();
    this.agresor.disable();
    this.acuerdos.disable();
  }
}
