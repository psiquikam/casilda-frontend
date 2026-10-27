import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { inicioDelDia } from './reglas-contenido';

/**
 * Validadores del formulario de contenidos del home. Replican en el cliente las
 * reglas del backend (`ContenidoRequest`, `ContenidoService.validarVigencia`)
 * para que el error se vea al escribir y no después de enviar.
 */

/**
 * `@NotBlank` del backend: `Validators.required` acepta «   », que el servidor
 * rechaza y que en la portada pintaría una tarjeta sin título.
 */
export const textoConContenido: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value;
  if (typeof valor !== 'string' || valor.length === 0) return null; // Lo cubre `required`.
  return valor.trim().length === 0 ? { textoVacio: true } : null;
};

/** Posición en la portada: entero de 0 en adelante. */
export const enteroNoNegativo: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value;
  if (valor === null || valor === undefined || valor === '') return null;
  return Number.isInteger(Number(valor)) && Number(valor) >= 0 ? null : { entero: true };
};

/**
 * La fecha de fin no puede ser anterior a la de inicio. Se compara por día: el
 * fin se guarda al final de su día (`finDelDia`), así que inicio y fin el mismo
 * día es un rango válido para el backend.
 *
 * Se aplica al control `vigenciaFin` (no al grupo) para que el error quede
 * junto al campo y en el resumen de errores; el formulario debe revalidarlo
 * cuando cambie `vigenciaInicio`.
 */
export function finNoAnteriorA(nombreInicio: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const fin = control.value;
    const inicio = control.parent?.get(nombreInicio)?.value;
    if (!(fin instanceof Date) || !(inicio instanceof Date)) return null;
    return inicioDelDia(fin).getTime() < inicioDelDia(inicio).getTime() ? { finAnterior: true } : null;
  };
}
