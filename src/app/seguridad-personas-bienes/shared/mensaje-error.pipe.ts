import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';

export type TipoCampo =
  | 'texto'
  | 'letras'
  | 'telefono'
  | 'cedula'
  | 'documento'
  | 'email'
  | 'entero'
  | 'seleccion';

const PATRON: Record<TipoCampo, string> = {
  texto: 'El texto tiene caracteres no permitidos',
  letras: 'Solo puede contener letras y espacios',
  telefono: 'Escriba entre 7 y 12 dígitos, solo números',
  cedula: 'Escriba entre 5 y 10 dígitos, solo números',
  documento: 'El número no corresponde al formato del tipo de documento',
  email: 'Ingrese un correo válido (ej: nombre@correo.com)',
  entero: 'Escriba un número entero mayor que cero',
  seleccion: 'Seleccione una opción'
};

/** Mensaje de error de un control, en el mismo tono que el resto de CASILDA. */
@Pipe({ name: 'mensajeError', standalone: true, pure: false })
export class MensajeErrorPipe implements PipeTransform {
  transform(control: AbstractControl | null | undefined, tipo: TipoCampo = 'texto'): string {
    const e = control?.errors;
    if (!e) return '';
    if (e['required']) return tipo === 'seleccion' ? 'Seleccione una opción' : 'Este campo es obligatorio';
    if (e['minlength']) return `Escriba al menos ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `No puede superar ${e['maxlength'].requiredLength} caracteres`;
    if (e['email']) return PATRON.email;
    if (e['pattern']) return PATRON[tipo];
    if (e['fechaFutura']) return 'La fecha no puede ser posterior a hoy';
    if (e['fechaPasada']) return 'La fecha no puede ser anterior a hoy';
    if (e['fechaHoraFutura']) return 'La fecha y la hora no pueden ser posteriores a este momento';
    if (e['horaFin']) return 'La hora de fin debe ser posterior a la hora de inicio';
    if (e['finAnterior']) return 'El fin debe ser posterior al inicio';
    if (e['programacionPasada']) return 'La fecha y la hora no pueden ser anteriores a este momento';
    return 'El valor no es válido';
  }
}
