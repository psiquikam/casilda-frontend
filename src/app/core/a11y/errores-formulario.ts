import { AbstractControl, FormGroup } from '@angular/forms';

/** Un error de formulario listo para mostrarse en el resumen (WCAG 3.3.1 / 3.3.3). */
export interface ErrorFormulario {
  /** `id` del control en el DOM, destino del salto de foco. */
  id: string;
  /** Etiqueta visible del campo. */
  etiqueta: string;
  /** Sugerencia de corrección, en tono no punitivo. */
  mensaje: string;
}

/** Etiqueta y mensajes por control: `{ fecha: { etiqueta: 'Fecha', mensajes: { required: '…' } } }`. */
export type DescripcionCampos = Record<string, {
  etiqueta: string;
  /** Mensaje por clave de error (`required`, `pattern`, …); `default` como respaldo. */
  mensajes?: Record<string, string>;
}>;

const MENSAJES_GENERICOS: Record<string, string> = {
  required: 'Necesitamos este dato para continuar.',
  email: 'Revisa que el correo tenga el formato nombre@dominio.com.',
  pattern: 'El formato no coincide con el esperado.',
  minlength: 'Es demasiado corto.',
  maxlength: 'Es demasiado largo.'
};

/**
 * Recorre un `FormGroup` y devuelve los errores de los controles inválidos, en el
 * orden en que aparecen en pantalla (el de `descripciones`), para alimentar
 * `app-resumen-errores`. Solo se listan los campos descritos: los demás se
 * consideran sin representación visible.
 *
 * @param prefijoId prefijo con el que se construye el `id` del control en el DOM
 *   (`${prefijoId}-${nombre}`); los inputs deben declararlo con el mismo patrón.
 */
export function recolectarErrores(
  form: FormGroup,
  descripciones: DescripcionCampos,
  prefijoId: string
): ErrorFormulario[] {
  const errores: ErrorFormulario[] = [];
  for (const [nombre, desc] of Object.entries(descripciones)) {
    const control: AbstractControl | null = form.get(nombre);
    if (!control || control.valid || control.disabled || !control.errors) continue;
    const clave = Object.keys(control.errors)[0];
    const mensaje = desc.mensajes?.[clave] ?? desc.mensajes?.['default'] ?? MENSAJES_GENERICOS[clave] ?? 'Revisa este campo.';
    errores.push({ id: `${prefijoId}-${nombre}`, etiqueta: desc.etiqueta, mensaje });
  }
  return errores;
}
