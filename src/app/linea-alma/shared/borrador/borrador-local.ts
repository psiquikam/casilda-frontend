/**
 * Borrador local de un formulario (equivale al `useBorrador` del plan, J-0.4; `RF-ALMA-005`
 * «Guardar progreso»). Dueño: Jonathan; lo consume también APH (H-1.2).
 *
 * Guarda el estado parcial en **`sessionStorage`** bajo el prefijo `casilda_`: la Salida rápida
 * lo borra junto con el resto de la sesión (`QuickExitService`), y cerrar la pestaña también. No
 * se usa `localStorage`: el módulo maneja información sensible y un borrador no debe sobrevivir
 * a la sesión. Si el navegador no permite escribir (modo privado, cuota), el borrador queda solo
 * en memoria y la pantalla sigue funcionando.
 *
 * El borrador **local** complementa al borrador **del servidor** (estado `BORRADOR` de la
 * atención APH, Q4): sirve para no perder lo escrito entre pasos o ante un fallo de red.
 */
export const PREFIJO_BORRADOR = 'casilda_alma_borrador:';

export interface BorradorGuardado<T> {
  readonly datos: T;
  readonly guardadoEn: string;
  /** Paso del formulario en el que iba la persona, si aplica. */
  readonly paso: number | null;
}

export class BorradorLocal<T> {
  private enMemoria: BorradorGuardado<T> | null = null;

  constructor(
    private readonly clave: string,
    private readonly almacen: Storage | null = almacenSesion()
  ) {}

  get claveCompleta(): string {
    return `${PREFIJO_BORRADOR}${this.clave}`;
  }

  leer(): BorradorGuardado<T> | null {
    const crudo = this.intentar(() => this.almacen?.getItem(this.claveCompleta) ?? null);
    if (!crudo) return this.enMemoria;
    try {
      const guardado = JSON.parse(crudo) as BorradorGuardado<T>;
      return guardado && typeof guardado === 'object' && 'datos' in guardado ? guardado : null;
    } catch {
      this.limpiar();
      return null;
    }
  }

  existe(): boolean {
    return this.leer() !== null;
  }

  guardar(datos: T, paso: number | null = null, ahora: Date = new Date()): BorradorGuardado<T> {
    const guardado: BorradorGuardado<T> = { datos, guardadoEn: ahora.toISOString(), paso };
    this.enMemoria = guardado;
    this.intentar(() => this.almacen?.setItem(this.claveCompleta, JSON.stringify(guardado)));
    return guardado;
  }

  limpiar(): void {
    this.enMemoria = null;
    this.intentar(() => this.almacen?.removeItem(this.claveCompleta));
  }

  private intentar<R>(accion: () => R): R | null {
    try {
      return accion();
    } catch {
      return null;
    }
  }
}

/** `sessionStorage` si existe y se puede usar; `null` en SSR, pruebas sin DOM o navegadores que lo bloquean. */
export function almacenSesion(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

/** Atajo con la misma forma que el `useBorrador(clave)` del plan. */
export function crearBorrador<T>(clave: string, almacen?: Storage | null): BorradorLocal<T> {
  return new BorradorLocal<T>(clave, almacen === undefined ? almacenSesion() : almacen);
}
