import { DOCUMENT, Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Prefijo de las llaves propias de Casilda en `localStorage`. */
export const CASILDA_STORAGE_PREFIX = 'casilda_';

/**
 * Llaves de `localStorage` que contienen información sensible de la persona
 * usuaria aunque no lleven el prefijo de Casilda (sesión autenticada).
 */
export const LLAVES_SENSIBLES_ADICIONALES = ['userSession'];

/**
 * Lógica de la **Salida Rápida** (Quick Escape): la herramienta de seguridad
 * más crítica de la plataforma. Permite abandonar Casilda de inmediato sin
 * dejar rastro navegable ni datos en el cliente.
 *
 * Ver `casilda-diseno-v1.md` §4.
 */
@Injectable({ providedIn: 'root' })
export class QuickExitService {
  private readonly document = inject(DOCUMENT);

  /** Sitio neutral de destino. Nunca se escribe hardcodeado en componentes. */
  readonly destinoSeguro = environment.quickExitUrl;

  /** Limpia el rastro local y redirige reemplazando el historial. */
  ejecutar(): void {
    this.limpiarRastroSensible();
    this.navegarADestinoSeguro();
  }

  /**
   * Borra todo `sessionStorage` y las llaves de `localStorage` que puedan
   * comprometer la confidencialidad (prefijo Casilda + sesión autenticada).
   * No se limpia el resto de `localStorage` para no afectar otros flujos UdeA.
   */
  limpiarRastroSensible(): void {
    const ventana = this.document.defaultView;
    if (!ventana) return;

    try {
      ventana.sessionStorage.clear();
    } catch {
      /* El almacenamiento puede estar bloqueado por el navegador: no es motivo para abortar la salida. */
    }

    try {
      const llaves = Object.keys(ventana.localStorage).filter(
        (llave) => llave.startsWith(CASILDA_STORAGE_PREFIX) || LLAVES_SENSIBLES_ADICIONALES.includes(llave)
      );
      llaves.forEach((llave) => ventana.localStorage.removeItem(llave));
    } catch {
      /* Idem: la redirección debe ocurrir siempre. */
    }
  }

  /**
   * Redirige con `location.replace()` para que el botón "Atrás" del navegador
   * no permita regresar a Casilda. Método público para poder aislarlo en pruebas.
   */
  navegarADestinoSeguro(): void {
    this.document.defaultView?.location.replace(this.destinoSeguro);
  }
}
