import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { environment } from '../../../../../environments/environment';
import { ConsentimientoDto, DerivacionInternaDto, EstadoRutaExterna, RutaExternaDto } from '../../types/alma-dto';
import {
  BANDEJA_POR_DESTINO_INTERNO,
  ContextoAlma,
  DESTINOS_PELIGRO_INMINENTE,
  DESTINOS_SIN_DERIVACION,
  ItemCatalogo,
  NombreCatalogo,
  PerfilPanelRutas
} from '../../types/alma.types';
import { ConsentimientoInformadoComponent } from '../consentimiento-informado/consentimiento-informado.component';

const ETIQUETA_ESTADO_RUTA: Record<EstadoRutaExterna, string> = {
  ACTIVADA: 'Activada',
  EN_SEGUIMIENTO: 'En seguimiento',
  CERRADA: 'Cerrada'
};

/**
 * `PanelDerivaciones` — «Remisiones y/o rutas internas acordadas» y «Remisiones y/o rutas externas
 * acordadas» de un contexto, con el signo «+» para agregar y, en cada remisión, una o más novedades
 * con fecha y hora (lo que APH capta al volver a comunicarse con la persona).
 *
 * **Frontera F6**: es reutilizable sin cambios por Psicología (J-1.6) porque recibe
 * `contexto = { tipo: 'ATENCION_APH' | 'CASO', id }`. Los destinos salen de los catálogos, nunca de
 * listas quemadas, y `perfil` elige cuáles: APH ofrece el listado acordado durante la llamada
 * (`destinos-internos-aph`, `rutas-externas-aph`); Psicología, el completo (`destinos-internos`,
 * `rutas-externas`). Revisión de flujos de Línea Alma, noviembre de 2026.
 *
 * Consentimiento (RN-ALMA-02): toda derivación lo exige, **salvo peligro inminente hacia SPyB o
 * Línea 123**. Si el padre ya tiene un consentimiento vigente lo pasa en `consentimiento` y no se
 * pide de nuevo; si no, se captura aquí con `ConsentimientoInformado`.
 */
@Component({
  selector: 'app-panel-derivaciones',
  imports: [
    DatePipe,
    NgTemplateOutlet,
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
  /** Qué listado de remisiones se ofrece. */
  readonly perfil = input<PerfilPanelRutas>('PSICOLOGIA');
  /** Con `false` el título queda solo para lectores de pantalla (la página ya titula el paso). */
  readonly conTitulo = input(true);
  /** Se emite con la lista actual tras crear o actualizar, para que el padre refresque su estado. */
  readonly cambio = output<{ internas: DerivacionInternaDto[]; externas: RutaExternaDto[] }>();

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly enviando = signal(false);
  /** Novedades y cierre de remisiones: el backend real aún no los tiene (ver `environment.lineaAlma.extensiones`). */
  protected readonly extensiones = environment.lineaAlma.extensiones;
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
  /** Novedad con fecha y hora sobre una remisión ya registrada (interna o externa). */
  protected readonly formSeguimiento = this.fb.nonNullable.group({
    novedad: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    fechaHora: [this.ahoraLocal(), Validators.required]
  });
  protected readonly seguimientoAbierto = signal<string | null>(null);
  protected readonly ahoraMaximo = signal(this.ahoraLocal());
  /** Cierre de una derivación interna: resultado obligatorio. Cerrarla no cierra la atención. */
  protected readonly cierreInternaAbierto = signal<string | null>(null);
  protected readonly formCierreInterna = this.fb.nonNullable.group({
    resultado: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]]
  });

  protected readonly formRuta = this.fb.nonNullable.group({
    estado: ['EN_SEGUIMIENTO' as EstadoRutaExterna, Validators.required],
    resultado: ['', Validators.maxLength(500)]
  });

  protected readonly consentimientoVigente = computed(() => this.consentimiento() ?? this.consentimientoLocal());

  ngOnInit(): void {
    this.cargar();
    // «No acepta» y «No aplica» solo dejan constancia: no exigen motivo ni consentimiento.
    this.formInterna.controls.destino.valueChanges.subscribe((codigo) => this.motivoOpcional(this.formInterna.controls.motivo, codigo));
    this.formExterna.controls.entidad.valueChanges.subscribe((codigo) => this.motivoOpcional(this.formExterna.controls.motivo, codigo));
  }

  private motivoOpcional(control: FormControl<string>, codigo: string): void {
    control.setValidators(
      this.sinDerivacion(codigo)
        ? [Validators.maxLength(500)]
        : [Validators.required, Validators.minLength(5), Validators.maxLength(500)]
    );
    control.updateValueAndValidity();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    forkJoin({
      internas: this.servicio.listarInternas(this.contexto()),
      externas: this.servicio.listarRutasExternas(this.contexto()),
      destinos: this.catalogos.obtener(this.catalogoInterno()),
      entidades: this.catalogos.obtener(this.catalogoExterno()),
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

  private catalogoInterno(): NombreCatalogo {
    return this.perfil() === 'APH' && environment.lineaAlma.extensiones ? 'destinos-internos-aph' : 'destinos-internos';
  }

  private catalogoExterno(): NombreCatalogo {
    return this.perfil() === 'APH' && environment.lineaAlma.extensiones ? 'rutas-externas-aph' : 'rutas-externas';
  }

  /** `true` para «No acepta / No toma ninguna decisión» y «No aplica». */
  protected sinDerivacion(codigo: string): boolean {
    return DESTINOS_SIN_DERIVACION.includes(codigo);
  }

  /** Módulo de Casilda al que llega la remisión, si el destino tiene bandeja propia. */
  protected bandejaDe(codigo: string): string | null {
    return BANDEJA_POR_DESTINO_INTERNO[codigo] ?? null;
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
    if (this.sinDerivacion(codigo)) return false;
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
        motivo: v.motivo.trim() || 'Sin derivación',
        peligroInminente: peligro,
        consentimiento: peligro || this.sinDerivacion(v.destino) ? null : this.consentimientoVigente()
      })
      .subscribe({
        next: () => this.tras('Remisión registrada.'),
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
        motivo: v.motivo.trim() || 'Sin derivación',
        fechaActivacion: v.fechaActivacion,
        peligroInminente: peligro,
        consentimiento: peligro || this.sinDerivacion(v.entidad) ? null : this.consentimientoVigente()
      })
      .subscribe({
        next: () => this.tras('Remisión registrada.'),
        error: (e: ErrorAlma) => this.fallo(e, this.formExterna)
      });
  }

  // ───────────────────────── novedades de una remisión ─────────────────────────

  protected abrirSeguimiento(id: string): void {
    this.cierreInternaAbierto.set(null);
    this.seguimientoAbierto.set(id);
    this.rutaEnEdicion.set(null);
    this.ahoraMaximo.set(this.ahoraLocal());
    this.formSeguimiento.reset({ novedad: '', fechaHora: this.ahoraLocal() });
  }

  protected abrirCierreInterna(id: string): void {
    this.seguimientoAbierto.set(null);
    this.rutaEnEdicion.set(null);
    this.formCierreInterna.reset({ resultado: '' });
    this.cierreInternaAbierto.set(id);
  }

  protected cancelarCierreInterna(): void {
    this.cierreInternaAbierto.set(null);
  }

  protected guardarCierreInterna(d: DerivacionInternaDto): void {
    this.formCierreInterna.markAllAsTouched();
    if (this.formCierreInterna.invalid) return;
    this.enviando.set(true);
    this.servicio
      .cerrarInterna(d.idDerivacion, { version: d.version ?? 1, estado: 'CERRADA', resultado: this.formCierreInterna.getRawValue().resultado.trim() })
      .subscribe({
        next: () => {
          this.cierreInternaAbierto.set(null);
          this.tras('Derivación cerrada.');
        },
        error: (e: ErrorAlma) => this.fallo(e, this.formCierreInterna)
      });
  }

  protected etiquetaEstadoInterna(estado: DerivacionInternaDto['estado']): string {
    return { REGISTRADA: 'Registrada', ENVIADA: 'Enviada', RECIBIDA: 'Recibida', RECHAZADA: 'Rechazada', CERRADA: 'Cerrada' }[estado];
  }

  protected cancelarSeguimiento(): void {
    this.seguimientoAbierto.set(null);
  }

  protected guardarSeguimiento(tipo: 'interna' | 'externa', id: string): void {
    this.formSeguimiento.markAllAsTouched();
    const v = this.formSeguimiento.getRawValue();
    const momento = new Date(v.fechaHora);
    if (!Number.isNaN(momento.getTime()) && momento.getTime() > Date.now() + 60_000) {
      this.formSeguimiento.controls.fechaHora.setErrors({ servidor: 'La fecha y la hora no pueden ser futuras.' });
    }
    if (this.formSeguimiento.invalid) return;
    this.enviando.set(true);
    const cuerpo = { novedad: v.novedad.trim(), fechaHora: momento.toISOString() };
    const alExito = () => {
      this.seguimientoAbierto.set(null);
      this.tras('Novedad registrada.');
    };
    const alFallar = (e: ErrorAlma) => this.fallo(e, this.formSeguimiento);
    if (tipo === 'interna') this.servicio.agregarSeguimientoInterna(id, cuerpo).subscribe({ next: alExito, error: alFallar });
    else this.servicio.agregarSeguimientoRuta(id, cuerpo).subscribe({ next: alExito, error: alFallar });
  }

  protected errorSeguimiento(control: 'novedad' | 'fechaHora', etiqueta: string): string | null {
    return mensajeDeError(this.formSeguimiento.get(control), etiqueta);
  }

  protected editarRuta(ruta: RutaExternaDto): void {
    this.seguimientoAbierto.set(null);
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

  /** Fecha y hora local en el formato de `<input type="datetime-local">`. */
  private ahoraLocal(): string {
    const ahora = new Date();
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
  }

  private hoy(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}-${dia}`;
  }
}
