import { AbstractControl, FormGroup } from '@angular/forms';
import { ErrorAlma } from './alma-error';

/**
 * Pinta junto a cada campo los errores por campo que devolvió el servidor (`detalles` del 400).
 * Las claves del contrato son las del DTO: `persona.numeroIdentificacion` busca ese control
 * anidado y, si no existe, la última parte (`numeroIdentificacion`). Devuelve las claves que no
 * encontraron control, para que la pantalla las muestre en un aviso general y no se pierdan.
 */
export function aplicarErroresServidor(grupo: FormGroup, error: ErrorAlma): string[] {
  const sinControl: string[] = [];
  for (const [clave, mensaje] of Object.entries(error.camposInvalidos)) {
    const control = buscarControl(grupo, clave);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), servidor: mensaje });
      control.markAsTouched();
    } else {
      sinControl.push(mensaje);
    }
  }
  return sinControl;
}

function buscarControl(grupo: FormGroup, clave: string): AbstractControl | null {
  return grupo.get(clave.split('.')) ?? grupo.get(clave.split('.').slice(-1)) ?? null;
}

/** Mensaje del primer error de un control, en tono no punitivo. `null` si es válido. */
export function mensajeDeError(control: AbstractControl | null, etiqueta: string): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) return null;
  const errores = control.errors;
  if (errores['servidor']) return String(errores['servidor']);
  if (errores['required']) return `Falta ${etiqueta.toLowerCase()}.`;
  if (errores['email']) return 'Revise el correo: debe tener el formato nombre@dominio.com.';
  if (errores['pattern']) return `Revise el formato de ${etiqueta.toLowerCase()}.`;
  if (errores['minlength']) return `${etiqueta} es muy corto (mínimo ${errores['minlength'].requiredLength} caracteres).`;
  if (errores['maxlength']) return `${etiqueta} es muy largo (máximo ${errores['maxlength'].requiredLength} caracteres).`;
  return `Revise ${etiqueta.toLowerCase()}.`;
}
