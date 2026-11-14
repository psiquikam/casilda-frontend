import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin } from 'rxjs';
import { NotificacionService } from '../../../../core/a11y/notificacion.service';
import { DerivacionesAlmaService } from '../../../aph/services/derivaciones-alma.service';
import { CatalogosAlmaService, etiquetaDe } from '../../catalogos/catalogos-alma.service';
import { ErrorAlma } from '../../http/alma-error';
import { aplicarErroresServidor, mensajeDeError } from '../../http/errores-servidor';
import { ConsentimientoDto, DerivacionInternaDto, EstadoRutaExterna, RutaExternaDto } from '../../types/alma-dto';
import { ContextoAlma, DESTINOS_PELIGRO_INMINENTE, ItemCatalogo } from '../../types/alma.types';
import { ConsentimientoInformadoComponent } from '../consentimiento-informado/consentimiento-informado.component';

const ETIQUETA_ESTADO_RUTA: Record<EstadoRutaExterna, string> = {
  ACTIVADA: 'Activada',
  EN_SEGUIMIENTO: 'En seguimiento',
  CERRADA: 'Cerrada'
};

/**
 * `PanelDerivaciones` — rutas **internas** (SPyB, Equipo de Atención, Dupla Psicojurídica,
 * Masculinidades, UAD) y **externas** (Línea 123, Código Fucsia, Fiscalía, Comisarías,
 * Policía, ICBF, CAIVAS) de un contexto, con su historial (RF-ALMA-APH-003/004).
 *
 * **Frontera F6**: es reutilizable sin cambios por Psicología (J-1.6) porque recibe
 * `contexto = { tipo: 'ATENCION_APH' | 'CASO', id }`. Los destinos salen de los catálogos
 * `destinos-internos` y `rutas-externas`, nunca de listas quemadas.
 *
 * Consentimiento (RN-ALMA-02): toda derivación lo exige, **salvo peligro inminente hacia SPyB o
 * Línea 123**. Si el padre ya tiene un consentimiento vigente lo pasa en `consentimiento` y no se
 * pide de nuevo; si no, se captura aquí con `ConsentimientoInformado`.
 */
@Component({
  selector: 'app-panel-derivaciones',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    ConsentimientoInformadoComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-derivaciones.component.html',
  styleUrl: './panel-derivaciones.component.scss'
})
export class PanelDerivacionesComponent implements OnInit {
  private readonly servicio = inject(DerivacionesAlmaService);
  private readonly catalogos = inject(CatalogosAlmaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly fb = inject(FormBuilder);

  readonly contexto = input.required<ContextoAlma>();
  /** Consentimiento ya registrado en la atención; si existe no se vuelve a pedir. */
  readonly consentimiento = input<ConsentimientoDto | null>(null);
  /** La atención omitió el triaje por peligro inminente: habilita la excepción de consentimiento. */
  readonly peligroInminente = input(false);
  /** Solo lectura (atención cerrada, o rol sin permiso de edición). */
  readonly soloLectura = input(false);
  /** Se emite con la lista actual tras crear o actualizar, para que el padre refresque su estado. */
  readonly cambio = output<{ internas: DerivacionInternaDto[]; externas: RutaExternaDto[] }>();

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly enviando = signal(false);
  protected readonly internas = signal<DerivacionInternaDto[]>([]);
  protected readonly externas = signal<RutaExternaDto[]>([]);
  protected readonly destinos = signal<ItemCatalogo[]>([]);
  protected readonly entidades = signal<ItemCatalogo[]>([]);
  protected readonly resultados = signal<ItemCatalogo[]>([]);
  protected readonly estadosRuta = ETIQUETA_ESTADO_RUTA;
  protected readonly estadosRutaLista = Object.keys(ETIQUETA_ESTADO_RUTA) as EstadoRutaExterna[];

  /** Consentimiento capturado en este panel (cuando el padre no aporta uno). */
  protected readonly consentimientoLocal = signal<ConsentimientoDto | null>(null);
  protected readonly formularioAbierto = signal<'interna' | 'externa' | null>(null);
  protected readonly rutaEnEdicion = signal<string | null>(null);

  protected readonly formInterna = this.fb.nonNullable.group({
    destino: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    peligro: [false]
  });
  protected readonly formExterna = this.fb.nonNullable.group({
    entidad: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    fechaActivacion: [this.hoy(), Validators.required],
    peligro: [false]
  });
  protected readonly formRuta = this.fb.nonNullable.group({
    estado: ['EN_SEGUIMIENTO' as EstadoRutaExterna, Validators.required],
    resultado: ['', Validators.maxLength(500)]
  });

  protected readonly consentimientoVigente = computed(() => this.consentimiento() ?? this.consentimientoLocal());

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    forkJoin({
      internas: this.servicio.listarInternas(this.contexto()),
      externas: this.servicio.listarRutasExternas(this.contexto()),
      destinos: this.catalogos.obtener('destinos-internos'),
      entidades: this.catalogos.obtener('rutas-externas'),
      resultados: this.catalogos.obtener('resultados-ruta-externa')
    }).subscribe({
      next: (datos) => {
        this.internas.set(datos.internas);
        this.externas.set(datos.externas);
        this.destinos.set(datos.destinos);
        this.entidades.set(datos.entidades);
        this.resultados.set(datos.resultados);
        this.cargando.set(false);
      },
      error: () => {
        this.catalogos.invalidar();
        this.errorCarga.set(true);
        this.cargando.set(false);
      }
    });
  }

  protected etiquetaDestino(codigo: string): string {
    return etiquetaDe(this.destinos(), codigo);
  }

  protected etiquetaEntidad(codigo: string): string {
    return etiquetaDe(this.entidades(), codigo);
  }

  protected etiquetaResultado(codigo: string): string {
    return etiquetaDe(this.resultados(), codigo);
  }

  protected abrir(tipo: 'interna' | 'externa'): void {
    this.formularioAbierto.set(tipo);
    const peligro = this.peligroInminente();
    this.formInterna.reset({ destino: '', motivo: '', peligro });
    this.formExterna.reset({ entidad: '', motivo: '', fechaActivacion: this.hoy(), peligro });
    this.consentimientoLocal.set(null);
  }

  protected cancelar(): void {
    this.formularioAbierto.set(null);
  }

  /** La excepción por peligro inminente solo se ofrece hacia los destinos que la admiten. */
  protected admitePeligro(codigo: string): boolean {
    return DESTINOS_PELIGRO_INMINENTE.includes(codigo);
  }

  protected faltaConsentimiento(peligro: boolean, codigo: string): boolean {
    return !(peligro && this.admitePeligro(codigo)) && !this.consentimientoVigente();
  }

  protected error(grupo: 'interna' | 'externa' | 'ruta', control: string, etiqueta: string): string | null {
    const formulario: FormGroup = grupo === 'interna' ? this.formInterna : grupo === 'externa' ? this.formExterna : this.formRuta;
    return mensajeDeError(formulario.get(control), etiqueta);
  }

  protected guardarInterna(): void {
    this.formInterna.markAllAsTouched();
    const v = this.formInterna.getRawValue();
    const peligro = v.peligro && this.admitePeligro(v.destino);
    if (this.formInterna.invalid || this.faltaConsentimiento(v.peligro, v.destino)) return;
    this.enviando.set(true);
    this.servicio
      .crearInterna({
        tipoContexto: this.contexto().tipo,
        idContexto: this.contexto().id,
        destino: v.destino,
        motivo: v.motivo.trim(),
        peligroInminente: peligro,
        consentimiento: peligro ? null : this.consentimientoVigente()
      })
      .subscribe({
        next: () => this.tras('Derivación registrada.'),
        error: (e: ErrorAlma) => this.fallo(e, this.formInterna)
      });
  }

  protected guardarExterna(): void {
    this.formExterna.markAllAsTouched();
    const v = this.formExterna.getRawValue();
    const peligro = v.peligro && this.admitePeligro(v.entidad);
    if (this.formExterna.invalid || this.faltaConsentimiento(v.peligro, v.entidad)) return;
    this.enviando.set(true);
    this.servicio
      .crearRutaExterna({
        tipoContexto: this.contexto().tipo,
        idContexto: this.contexto().id,
        entidad: v.entidad,
        motivo: v.motivo.trim(),
        fechaActivacion: v.fechaActivacion,
        peligroInminente: peligro,
        consentimiento: peligro ? null : this.consentimientoVigente()
      })
      .subscribe({
        next: () => this.tras('Ruta externa registrada.'),
        error: (e: ErrorAlma) => this.fallo(e, this.formExterna)
      });
  }

  protected editarRuta(ruta: RutaExternaDto): void {
    this.rutaEnEdicion.set(ruta.idRuta);
    this.formRuta.reset({
      estado: ruta.estado === 'ACTIVADA' ? 'EN_SEGUIMIENTO' : ruta.estado,
      resultado: ruta.resultado ?? ''
    });
  }

  protected guardarRuta(ruta: RutaExternaDto): void {
    this.formRuta.markAllAsTouched();
    const v = this.formRuta.getRawValue();
    if (v.estado === 'CERRADA' && !v.resultado.trim()) {
      this.formRuta.controls.resultado.setErrors({ servidor: 'Registre el resultado para cerrar la ruta.' });
      return;
    }
    if (this.formRuta.invalid) return;
    this.enviando.set(true);
    this.servicio
      .actualizarRutaExterna(ruta.idRuta, { version: ruta.version, estado: v.estado, resultado: v.resultado.trim() || null })
      .subscribe({
        next: () => {
          this.rutaEnEdicion.set(null);
          this.tras('Ruta actualizada.');
        },
        error: (e: ErrorAlma) => {
          if (e.tipo === 'conflicto') this.rutaEnEdicion.set(null);
          this.fallo(e, this.formRuta);
          if (e.tipo === 'conflicto') this.recargarListas();
        }
      });
  }

  private tras(mensaje: string): void {
    this.enviando.set(false);
    this.formularioAbierto.set(null);
    this.notificacion.exito(mensaje);
    this.recargarListas();
  }

  private recargarListas(): void {
    forkJoin({
      internas: this.servicio.listarInternas(this.contexto()),
      externas: this.servicio.listarRutasExternas(this.contexto())
    }).subscribe({
      next: (datos) => {
        this.internas.set(datos.internas);
        this.externas.set(datos.externas);
        this.cambio.emit(datos);
      },
      error: (e: ErrorAlma) => this.notificacion.error(e.mensaje, e)
    });
  }

  private fallo(error: ErrorAlma, formulario: FormGroup): void {
    this.enviando.set(false);
    const sinCampo = aplicarErroresServidor(formulario, error);
    this.notificacion.error(sinCampo[0] ?? error.mensaje, error);
  }

  private hoy(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}-${dia}`;
  }
}
