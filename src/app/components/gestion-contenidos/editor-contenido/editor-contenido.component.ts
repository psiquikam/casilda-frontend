import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../../environments/environment';
import {
  DESTINOS_ENLACE,
  IMAGEN_EXTENSIONES,
  IMAGEN_TAMANO_MAXIMO_BYTES,
  IMAGEN_TIPOS_PERMITIDOS,
  LIMITE_CONTENIDO,
  LIMITE_TITULO,
  SECCIONES_CONTENIDO,
  TITULO_RECOMENDADO,
  seccionInfo,
  type SeccionContenido
} from '../../../core/contenidos/catalogo-contenidos';
import {
  estadoVigencia,
  finDelDia,
  inicioDelDia,
  mismoDia,
  resolverImagenContenido
} from '../../../core/contenidos/reglas-contenido';
import { enteroNoNegativo, finNoAnteriorA, textoConContenido } from '../../../core/contenidos/validadores-contenido';
import { DescripcionCampos, ErrorFormulario, recolectarErrores } from '../../../core/a11y/errores-formulario';
import { ResumenErroresComponent } from '../../../core/a11y/resumen-errores.component';
import { NotificacionService } from '../../../core/a11y/notificacion.service';
import type { ConCambiosPendientes } from '../../../core/navegacion/cambios-sin-guardar.guard';
import {
  ContenidoAdminDto,
  ContenidoAdminService,
  ContenidoRequestDto,
  interpretarErrorContenido
} from '../../../services/contenido-admin.service';
import type { ContenidoDestacadoDto } from '../../../services/contenido-home.service';
import { CasildaCardComponent } from '../../casilda-card/casilda-card.component';
import { SelectorImagenComponent } from '../../selector-imagen/selector-imagen.component';
import { EstadoVigenciaComponent } from '../estado-vigencia/estado-vigencia.component';

const RUTA_LISTADO = '/gestion-contenidos';
/** Prefijo de los `id` de los campos: `editor-titulo`, `editor-contenido`… (resumen de errores). */
const PREFIJO_ID = 'editor';
const ID_IMAGEN = `${PREFIJO_ID}-imagen`;

/** Etiquetas y mensajes por campo, en el orden visual: alimentan `mat-error` y el resumen. */
const DESCRIPCIONES: DescripcionCampos = {
  titulo: {
    etiqueta: 'Título',
    mensajes: {
      required: 'Escriba el título de la tarjeta.',
      textoVacio: 'Escriba el título de la tarjeta.',
      maxlength: `Use máximo ${LIMITE_TITULO} caracteres.`
    }
  },
  contenido: {
    etiqueta: 'Texto de la tarjeta',
    mensajes: {
      required: 'Escriba el texto que acompaña al título.',
      textoVacio: 'Escriba el texto que acompaña al título.',
      maxlength: `Use máximo ${LIMITE_CONTENIDO} caracteres: en la tarjeta un texto más largo no se lee bien.`
    }
  },
  seccion: { etiqueta: 'Sección', mensajes: { required: 'Elija en qué sección de la portada se mostrará.' } },
  enlace: { etiqueta: 'Al hacer clic, llevar a' },
  orden: {
    etiqueta: 'Posición',
    mensajes: { required: 'Indique la posición: 0 o un número mayor.', entero: 'Use un número entero de 0 en adelante.' }
  },
  vigenciaInicio: {
    etiqueta: 'Publicar desde',
    mensajes: { required: 'Indique desde qué fecha se publica.', matDatepickerParse: 'Escriba la fecha como dd/mm/aaaa.' }
  },
  vigenciaFin: {
    etiqueta: 'Retirar después de',
    mensajes: {
      finAnterior: 'Debe ser igual o posterior a la fecha de «Publicar desde».',
      matDatepickerParse: 'Escriba la fecha como dd/mm/aaaa.'
    }
  }
};

/** Siguiente posición libre de una sección: una más que la mayor, o 0 si está vacía. */
function siguientePosicion(existentes: readonly ContenidoAdminDto[], seccion: string | null): number {
  const posiciones = existentes.filter((c) => c.seccion === seccion).map((c) => c.orden ?? 0);
  return posiciones.length ? Math.max(...posiciones) + 1 : 0;
}

type CampoEditor = 'titulo' | 'contenido' | 'seccion' | 'enlace' | 'orden' | 'vigenciaInicio' | 'vigenciaFin';

/**
 * Crear y editar un contenido del home (`/gestion-contenidos/nuevo` y
 * `/gestion-contenidos/:id`).
 *
 * El formulario va en cuatro grupos que responden a las preguntas de quien
 * publica —qué dice, dónde va, cuándo se ve y con qué imagen— y lo acompaña una
 * **vista previa en vivo** hecha con la misma `CasildaCardComponent` de la
 * portada, para que lo que se ve aquí sea exactamente lo que se publicará.
 *
 * Las fechas se piden por día (sin hora): el inicio se guarda a las 00:00 y el
 * fin a las 23:59:59 del día elegido, en la zona del navegador. Al editar, si el
 * día de inicio no cambia, se conserva el instante original.
 */
@Component({
  selector: 'app-editor-contenido',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ResumenErroresComponent,
    CasildaCardComponent,
    SelectorImagenComponent,
    EstadoVigenciaComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor-contenido.component.html',
  styleUrl: './editor-contenido.component.scss'
})
export class EditorContenidoComponent implements OnInit, ConCambiosPendientes {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly servicio = inject(ContenidoAdminService);
  private readonly notificacion = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  // Constantes expuestas a la plantilla.
  readonly secciones = SECCIONES_CONTENIDO;
  readonly limiteTitulo = LIMITE_TITULO;
  readonly tituloRecomendado = TITULO_RECOMENDADO;
  readonly limiteContenido = LIMITE_CONTENIDO;
  readonly imagenTipos = IMAGEN_TIPOS_PERMITIDOS;
  readonly imagenExtensiones = IMAGEN_EXTENSIONES;
  readonly imagenTamanoMaximo = IMAGEN_TAMANO_MAXIMO_BYTES;
  readonly idImagen = ID_IMAGEN;

  readonly form = this.fb.group({
    titulo: ['', [Validators.required, textoConContenido, Validators.maxLength(LIMITE_TITULO)]],
    contenido: ['', [Validators.required, textoConContenido, Validators.maxLength(LIMITE_CONTENIDO)]],
    seccion: this.fb.control<SeccionContenido>('acciones', Validators.required),
    enlace: this.fb.control<string | null>(null),
    orden: this.fb.control<number | null>(0, [Validators.required, enteroNoNegativo]),
    vigenciaInicio: this.fb.control<Date | null>(inicioDelDia(new Date()), Validators.required),
    vigenciaFin: this.fb.control<Date | null>(null, finNoAnteriorA('vigenciaInicio'))
  });

  /** Id del contenido en edición; `null` al crear. */
  readonly id = signal<number | null>(null);
  readonly modo = computed(() => (this.id() === null ? 'crear' : 'editar'));

  readonly cargando = signal(false);
  readonly errorCarga = signal(false);
  readonly guardando = signal(false);
  readonly errores = signal<ErrorFormulario[]>([]);

  /** Contenido tal como llegó del servidor (solo en edición). */
  readonly original = signal<ContenidoAdminDto | null>(null);

  // Imagen: archivo nuevo elegido, su URL temporal y si se pidió quitar la actual.
  readonly archivoImagen = signal<File | null>(null);
  private readonly urlImagenLocal = signal<string | null>(null);
  readonly quitarImagen = signal(false);
  readonly errorImagen = signal<string | null>(null);

  /** Evita que el guard pregunte justo después de guardar con éxito. */
  private guardado = false;

  /** Valores del formulario como señal, para la vista previa y los contadores. */
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly largoTitulo = computed(() => this.valores().titulo?.length ?? 0);
  readonly largoContenido = computed(() => this.valores().contenido?.length ?? 0);

  /** Destinos del selector. Si el contenido trae una ruta fuera del catálogo, se conserva como opción. */
  readonly destinos = computed(() => {
    const actual = this.original()?.enlace;
    return actual && !DESTINOS_ENLACE.some((d) => d.ruta === actual)
      ? [...DESTINOS_ENLACE, { ruta: actual, etiqueta: `Ruta actual: ${actual}` }]
      : DESTINOS_ENLACE;
  });

  /** Imagen que se muestra en el selector: la nueva, la guardada o ninguna. */
  readonly imagenSelector = computed(() => {
    if (this.urlImagenLocal()) return this.urlImagenLocal();
    const guardada = this.original()?.imagen;
    return !this.quitarImagen() && guardada ? resolverImagenContenido(guardada, environment.apiBaseUrl) : null;
  });

  readonly seccionPrevia = computed(() => seccionInfo(this.valores().seccion ?? '') ?? SECCIONES_CONTENIDO[0]);

  /** Lo que la tarjeta mostrará en la portada, con textos guía mientras los campos están vacíos. */
  readonly vistaPrevia = computed<ContenidoDestacadoDto>(() => {
    const v = this.valores();
    return {
      id: this.id() ?? 0,
      titulo: v.titulo?.trim() || 'Título de la tarjeta',
      contenido: v.contenido?.trim() || 'Aquí aparecerá el texto que escriba.',
      imagen: this.urlImagenLocal() ?? (this.quitarImagen() ? null : this.original()?.imagen ?? null),
      vigenciaInicio: '',
      vigenciaFin: null,
      enlace: v.enlace ?? null,
      seccion: v.seccion ?? 'acciones'
    };
  });

  /** Cuándo se verá en la portada con las fechas elegidas. */
  readonly publicacionPrevista = computed(() => {
    const fechas = this.fechasParaGuardar(this.valores().vigenciaInicio ?? null, this.valores().vigenciaFin ?? null);
    if (!fechas) return null;
    return { estado: estadoVigencia(fechas), inicio: fechas.vigenciaInicio };
  });

  constructor() {
    // El rango se valida en `vigenciaFin`: hay que revalidarlo al mover el inicio.
    this.form.controls.vigenciaInicio.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.vigenciaFin.updateValueAndValidity({ emitEvent: false }));

    this.destroyRef.onDestroy(() => this.liberarUrlLocal());
  }

  ngOnInit(): void {
    const parametroId = this.route.snapshot.paramMap.get('id');
    if (parametroId === null) {
      this.prepararCreacion();
      return;
    }

    const id = Number(parametroId);
    if (!Number.isInteger(id) || id <= 0) {
      this.notificacion.error('El contenido solicitado no existe.');
      void this.router.navigateByUrl(RUTA_LISTADO);
      return;
    }
    this.id.set(id);
    this.cargarContenido();
  }

  tieneCambiosPendientes(): boolean {
    return !this.guardado && (this.form.dirty || this.archivoImagen() !== null || this.quitarImagen());
  }

  cargarContenido(): void {
    const id = this.id();
    if (id === null) return;

    this.cargando.set(true);
    this.errorCarga.set(false);
    this.servicio
      .obtenerPorId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contenido) => {
          this.original.set(contenido);
          this.form.reset({
            titulo: contenido.titulo,
            contenido: contenido.contenido,
            seccion: seccionInfo(contenido.seccion)?.valor ?? 'acciones',
            enlace: contenido.enlace ?? null,
            orden: contenido.orden ?? 0,
            vigenciaInicio: new Date(contenido.vigenciaInicio),
            vigenciaFin: contenido.vigenciaFin ? new Date(contenido.vigenciaFin) : null
          });
          this.cargando.set(false);
        },
        error: (error) => {
          const interpretado = interpretarErrorContenido(error);
          this.notificacion.error(interpretado.mensaje, error);
          this.cargando.set(false);
          if (interpretado.noEncontrado) {
            void this.router.navigateByUrl(RUTA_LISTADO);
          } else {
            this.errorCarga.set(true);
          }
        }
      });
  }

  // --- Imagen ---

  seleccionarImagen(archivo: File): void {
    this.liberarUrlLocal();
    this.archivoImagen.set(archivo);
    this.urlImagenLocal.set(URL.createObjectURL(archivo));
    this.quitarImagen.set(false);
    this.errorImagen.set(null);
  }

  quitarImagenActual(): void {
    this.liberarUrlLocal();
    this.archivoImagen.set(null);
    this.urlImagenLocal.set(null);
    // Solo hay algo que quitar en el servidor si el contenido ya tenía imagen.
    this.quitarImagen.set(!!this.original()?.imagen);
    this.errorImagen.set(null);
  }

  // --- Errores ---

  /** Mensaje del primer error de un campo, el mismo que muestra el resumen. */
  mensajeError(campo: CampoEditor): string {
    const errores = this.form.controls[campo].errors;
    if (!errores) return '';
    const clave = Object.keys(errores)[0];
    if (clave === 'servidor') return String(errores['servidor']);
    return DESCRIPCIONES[campo]?.mensajes?.[clave] ?? 'Verifique este campo.';
  }

  // --- Guardar ---

  guardar(): void {
    if (this.guardando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errores.set(this.recolectarTodosLosErrores());
      return;
    }

    const datos = this.aRequest();
    if (!datos) return;

    this.errores.set([]);
    this.guardando.set(true);
    const id = this.id();
    const operacion =
      id === null
        ? this.servicio.crear(datos, this.archivoImagen())
        : this.servicio.actualizar(id, datos, { archivo: this.archivoImagen(), eliminar: this.quitarImagen() });

    operacion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (guardado) => {
        this.guardado = true;
        this.guardando.set(false);
        this.notificacion.exito(this.mensajeExito(guardado));
        void this.router.navigateByUrl(RUTA_LISTADO);
      },
      error: (error) => this.manejarErrorGuardado(error)
    });
  }

  private manejarErrorGuardado(error: unknown): void {
    this.guardando.set(false);
    const interpretado = interpretarErrorContenido(error);

    if (interpretado.noEncontrado) {
      this.guardado = true; // No hay nada que conservar: el registro ya no existe.
      this.notificacion.error(interpretado.mensaje, error);
      void this.router.navigateByUrl(RUTA_LISTADO);
      return;
    }

    // Los errores por campo del servidor se marcan en su control y entran al resumen.
    for (const [campo, mensaje] of Object.entries(interpretado.campos)) {
      if (campo === 'imagen') {
        this.errorImagen.set(mensaje);
      } else {
        this.form.get(campo)?.setErrors({ servidor: mensaje });
      }
    }

    const errores = this.recolectarTodosLosErrores();
    if (errores.length) {
      this.errores.set(errores);
    } else {
      this.notificacion.error(interpretado.mensaje, error);
    }
  }

  private recolectarTodosLosErrores(): ErrorFormulario[] {
    // El mensaje del servidor es dinámico: se agrega a la descripción del campo que lo tiene.
    const descripciones: DescripcionCampos = {};
    for (const [nombre, descripcion] of Object.entries(DESCRIPCIONES)) {
      const servidor = this.form.get(nombre)?.errors?.['servidor'];
      descripciones[nombre] = servidor ? { ...descripcion, mensajes: { ...descripcion.mensajes, servidor } } : descripcion;
    }
    const errores = recolectarErrores(this.form, descripciones, PREFIJO_ID);
    const errorImagen = this.errorImagen();
    return errorImagen ? [...errores, { id: ID_IMAGEN, etiqueta: 'Imagen', mensaje: errorImagen }] : errores;
  }

  private mensajeExito(contenido: ContenidoAdminDto): string {
    const accion = this.modo() === 'crear' ? 'Se creó' : 'Se guardaron los cambios de';
    const estado = estadoVigencia(contenido);
    const cuando =
      estado === 'vigente'
        ? 'Ya está publicado; la portada lo mostrará en unos minutos.'
        : estado === 'programado'
          ? 'Se publicará automáticamente en su fecha de inicio.'
          : 'No se mostrará en la portada porque su vigencia ya terminó.';
    return `${accion} «${contenido.titulo}». ${cuando}`;
  }

  // --- Conversión ---

  private aRequest(): ContenidoRequestDto | null {
    const v = this.form.getRawValue();
    const fechas = this.fechasParaGuardar(v.vigenciaInicio, v.vigenciaFin);
    if (!fechas || !v.seccion) return null;
    return {
      titulo: (v.titulo ?? '').trim(),
      contenido: (v.contenido ?? '').trim(),
      seccion: v.seccion,
      enlace: v.enlace || null,
      orden: Number(v.orden ?? 0),
      ...fechas
    };
  }

  /**
   * Convierte los días elegidos en los instantes que espera el backend. Si el
   * día no cambió respecto al original se conserva su instante exacto, para no
   * mover sin querer la publicación de un contenido ya existente.
   */
  private fechasParaGuardar(
    inicio: Date | null,
    fin: Date | null
  ): { vigenciaInicio: string; vigenciaFin: string | null } | null {
    if (!(inicio instanceof Date) || Number.isNaN(inicio.getTime())) return null;
    const original = this.original();

    const inicioOriginal = original ? new Date(original.vigenciaInicio) : null;
    const vigenciaInicio =
      inicioOriginal && mismoDia(inicio, inicioOriginal) ? original!.vigenciaInicio : inicioDelDia(inicio).toISOString();

    let vigenciaFin: string | null = null;
    if (fin instanceof Date && !Number.isNaN(fin.getTime())) {
      const finOriginal = original?.vigenciaFin ? new Date(original.vigenciaFin) : null;
      vigenciaFin = finOriginal && mismoDia(fin, finOriginal) ? original!.vigenciaFin! : finDelDia(fin).toISOString();
    }
    return { vigenciaInicio, vigenciaFin };
  }

  // --- Creación ---

  /**
   * Al crear: toma la sección de `?seccion=` (botón «Agregar en esta sección»)
   * y sugiere como posición la siguiente libre de esa sección, mientras la
   * persona no escriba una propia.
   */
  private prepararCreacion(): void {
    const seccion = seccionInfo(this.route.snapshot.queryParamMap.get('seccion') ?? '');
    if (seccion) this.form.controls.seccion.setValue(seccion.valor);

    const seccionControl = this.form.controls.seccion;
    this.servicio
      .listarTodos()
      .pipe(
        // La sugerencia es una ayuda, no un requisito: si falla, la posición queda en 0.
        catchError(() => of<ContenidoAdminDto[]>([])),
        switchMap((existentes) =>
          seccionControl.valueChanges.pipe(
            startWith(seccionControl.value),
            map((seccion) => siguientePosicion(existentes, seccion))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (posicion) => {
          if (!this.form.controls.orden.dirty) this.form.controls.orden.setValue(posicion);
        },
        error: () => undefined
      });
  }

  private liberarUrlLocal(): void {
    const url = this.urlImagenLocal();
    if (url) URL.revokeObjectURL(url);
  }
}
