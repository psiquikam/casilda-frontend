import { Signal, computed, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ErrorAlma, interpretarErrorAlma } from '../http/alma-error';

/** Todo recurso mutable del contrato expone `version` (A.1, RNF-ALMA-001). */
export interface Versionado {
  readonly version: number;
}

export interface OpcionesBloqueo<T extends Versionado> {
  /** Vuelve a leer el recurso tras un 409 para mostrar la versión más reciente. */
  readonly recargar: () => Observable<T>;
  /** Avisa a la pantalla del conflicto (p. ej. `NotificacionService.info`). Se llama antes de recargar. */
  readonly alConflicto?: (error: ErrorAlma) => void;
}

/**
 * Bloqueo optimista (equivale al `useBloqueoOptimista` del plan, J-0.4; `RNF-ALMA-001`,
 * frontera F7). Dueño: Jonathan; lo consumen ambos submódulos.
 *
 * Mantiene el recurso con su `version` y ejecuta cada acción con la versión leída. Si el
 * servidor responde **409** (`CONFLICTO_VERSION`, `NOVEDAD_YA_TOMADA`, `REMISION_YA_TOMADA`),
 * registra el conflicto, **recarga** el recurso para que la persona vea lo más reciente y
 * vuelve a lanzar el error para que la pantalla decida qué decir. Nunca reintenta por su cuenta:
 * repetir una acción sobre una versión nueva es decisión de la persona.
 *
 * Ejemplo:
 * ```ts
 * readonly novedad = new BloqueoOptimista<Novedad>({ recargar: () => this.servicio.obtener(id) });
 * this.novedad.cargar().subscribe({ next: () => undefined, error: ... });
 * tomar(): void {
 *   this.novedad.ejecutar((version) => this.servicio.tomar(id, version)).subscribe({
 *     next: (actualizada) => this.notificacion.exito('Novedad tomada.'),
 *     error: (e: ErrorAlma) => this.notificacion.error(e.mensaje, e)
 *   });
 * }
 * ```
 */
export class BloqueoOptimista<T extends Versionado> {
  private readonly estado = signal<T | null>(null);
  private readonly ocupadoInterno = signal(false);
  private readonly conflictoInterno = signal<ErrorAlma | null>(null);

  /** Recurso vigente (`null` hasta la primera carga). */
  readonly recurso: Signal<T | null> = this.estado.asReadonly();
  readonly version: Signal<number | null> = computed(() => this.estado()?.version ?? null);
  /** Hay una acción o una recarga en curso: deshabilita los botones. */
  readonly ocupado: Signal<boolean> = this.ocupadoInterno.asReadonly();
  /** Último 409 recibido; se limpia al ejecutar la siguiente acción. */
  readonly conflicto: Signal<ErrorAlma | null> = this.conflictoInterno.asReadonly();

  constructor(private readonly opciones: OpcionesBloqueo<T>) {}

  /** Fija el recurso (p. ej. el que trajo la ruta o una respuesta reciente). */
  establecer(recurso: T): void {
    this.estado.set(recurso);
  }

  limpiarConflicto(): void {
    this.conflictoInterno.set(null);
  }

  /** Lee el recurso con `recargar` y lo deja como vigente. */
  cargar(): Observable<T> {
    this.ocupadoInterno.set(true);
    return this.opciones.recargar().pipe(
      tap((recurso) => this.estado.set(recurso)),
      catchError((error: unknown) => throwError(() => interpretarErrorAlma(error))),
      finalize(() => this.ocupadoInterno.set(false))
    );
  }

  /**
   * Ejecuta `accion` con la versión vigente. Si la respuesta trae `version`, pasa a ser el recurso
   * vigente; si no, `aplicar` puede derivar el nuevo recurso a partir de la respuesta.
   */
  ejecutar<R>(accion: (version: number) => Observable<R>, aplicar?: (respuesta: R, actual: T) => T | null | void): Observable<R> {
    const actual = this.estado();
    if (!actual) {
      return throwError(() => interpretarErrorAlma(new Error('No hay recurso cargado para ejecutar la acción.')));
    }
    this.conflictoInterno.set(null);
    this.ocupadoInterno.set(true);
    return accion(actual.version).pipe(
      tap((respuesta) => {
        const derivado = aplicar ? aplicar(respuesta, actual) : undefined;
        if (derivado) this.estado.set(derivado);
        else if (esVersionado(respuesta)) this.estado.set(respuesta as unknown as T);
      }),
      catchError((error: unknown) => {
        const traducido = interpretarErrorAlma(error);
        if (traducido.tipo === 'conflicto') {
          this.conflictoInterno.set(traducido);
          this.opciones.alConflicto?.(traducido);
          this.recargarSilencioso();
        }
        return throwError(() => traducido);
      }),
      finalize(() => this.ocupadoInterno.set(false))
    );
  }

  private recargarSilencioso(): void {
    this.opciones.recargar().subscribe({
      next: (recurso) => this.estado.set(recurso),
      // Si la recarga falla, el recurso anterior sigue en pantalla y la acción ya informó el conflicto.
      error: () => undefined
    });
  }
}

function esVersionado(valor: unknown): valor is Versionado {
  return !!valor && typeof valor === 'object' && typeof (valor as Versionado).version === 'number';
}
