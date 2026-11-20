import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  TipoDocumentoIdentidad,
  documentoEsAlfanumerico,
  limpiarDocumento,
  longitudMaximaDocumento
} from '../../core/forms/documento-identidad';

/** Reglas de formato compartidas por los formularios de Seguridad a personas y bienes (alineadas con el formulario de Equipo de atención). */
export const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;
export const REGEX_TELEFONO = /^[0-9]{7,12}$/;
export const REGEX_CEDULA = /^[0-9]{5,10}$/;
export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const REGEX_ENTERO_POSITIVO = /^[1-9][0-9]{0,9}$/;

/** Rechaza textos que solo tienen espacios (`Validators.required` los acepta). */
export const noSoloEspacios: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  typeof c.value === 'string' && c.value.length > 0 && c.value.trim().length === 0 ? { required: true } : null;

export function textoRequerido(min: number, max: number): ValidatorFn[] {
  return [Validators.required, noSoloEspacios, Validators.minLength(min), Validators.maxLength(max)];
}

export const validadoresNombre = (requerido: boolean): ValidatorFn[] => [
  ...(requerido ? [Validators.required, noSoloEspacios, Validators.minLength(2)] : []),
  Validators.maxLength(60),
  Validators.pattern(REGEX_LETRAS)
];

export const validadoresTelefono: ValidatorFn[] = [Validators.pattern(REGEX_TELEFONO)];
export const validadoresCedula: ValidatorFn[] = [Validators.required, Validators.pattern(REGEX_CEDULA)];
export const validadoresCorreo: ValidatorFn[] = [Validators.maxLength(100), Validators.email, Validators.pattern(REGEX_EMAIL)];

/** `YYYY-MM-DD` de hoy en hora local. */
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** `YYYY-MM-DDTHH:mm` de ahora en hora local. */
export function ahoraLocal(): string {
  const d = new Date();
  return `${hoyLocal()}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const fechaNoFutura: ValidatorFn = (c) => (c.value && String(c.value) > hoyLocal() ? { fechaFutura: true } : null);
export const fechaNoPasada: ValidatorFn = (c) => (c.value && String(c.value) < hoyLocal() ? { fechaPasada: true } : null);
export const fechaHoraNoFutura: ValidatorFn = (c) => (c.value && String(c.value) > ahoraLocal() ? { fechaHoraFutura: true } : null);

/** El valor de este control debe ser posterior al de `otro` (mismo formulario). */
export function posteriorA(otro: string, error = 'horaFin'): ValidatorFn {
  return (c) => {
    const ref = c.parent?.get(otro)?.value;
    return c.value && ref && String(c.value) <= String(ref) ? { [error]: true } : null;
  };
}

/** Cuando cambia `origen`, vuelve a validar `destino` (para validadores que dependen de otro campo). */
export function revalidarAlCambiar(form: FormGroup, origen: string, destino: string): void {
  form.get(origen)?.valueChanges.subscribe(() => form.get(destino)?.updateValueAndValidity({ emitEvent: false }));
}

/** La hora de este control, junto con el día de `campoFecha`, no puede estar en el pasado. */
export function horaNoPasadaDelDia(campoFecha: string): ValidatorFn {
  return (c) => {
    const f = c.parent?.get(campoFecha)?.value;
    return f && c.value && `${f}T${c.value}` < ahoraLocal() ? { programacionPasada: true } : null;
  };
}

/**
 * Número de documento que sigue el tipo elegido (longitud y alfanumérico para CE/pasaporte),
 * con las mismas reglas del formulario de Equipo de atención.
 */
export class ControlDocumento {
  constructor(
    private readonly form: FormGroup,
    private readonly tipo: string,
    private readonly numero: string,
    private readonly obtenerTipos: () => readonly TipoDocumentoIdentidad[]
  ) {
    this.form.get(this.tipo)?.valueChanges.subscribe(() => this.actualizar());
    this.actualizar();
  }

  maxLongitud(): number {
    return longitudMaximaDocumento(this.form.get(this.tipo)?.value, this.obtenerTipos());
  }

  /** Limpia lo escrito: solo caracteres válidos para el tipo y sin pasar la longitud máxima. */
  formato(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = limpiarDocumento(input.value, this.form.get(this.tipo)?.value, this.obtenerTipos());
    input.value = limpio;
    this.form.get(this.numero)?.setValue(limpio, { emitEvent: false });
  }

  actualizar(): void {
    const control = this.form.get(this.numero);
    if (!control) return;
    const tipo = this.form.get(this.tipo)?.value;
    const tipos = this.obtenerTipos();
    const alfanumerico = documentoEsAlfanumerico(tipo, tipos);
    control.setValidators([
      Validators.required,
      Validators.minLength(alfanumerico ? 4 : 5),
      Validators.maxLength(longitudMaximaDocumento(tipo, tipos)),
      Validators.pattern(alfanumerico ? '^[0-9A-Za-z]*$' : '^[0-9]*$')
    ]);
    const limpio = limpiarDocumento(String(control.value ?? ''), tipo, tipos);
    if (limpio !== control.value) control.setValue(limpio, { emitEvent: false });
    control.updateValueAndValidity({ emitEvent: false });
  }
}
