import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface TipoDocumentoIdentidad {
  readonly id: number;
  readonly codigo?: string | null;
  readonly nombre: string;
}

/**
 * Longitudes máximas usadas por los formularios de CASILDA.
 *
 * La tabla sigue los lineamientos RIPS vigentes para los tipos disponibles en
 * el maestro del proyecto. `PAS` es el código histórico que usa el backend para
 * pasaporte; `PA` se admite para no depender de esa denominación interna.
 */
export const LONGITUD_MAXIMA_DOCUMENTO: Readonly<Record<string, number>> = {
  CC: 10,
  TI: 11,
  CE: 6,
  PA: 16,
  PAS: 16,
  RC: 11,
  NUIP: 10,
  NIP: 11
};

export const LONGITUD_MAXIMA_DOCUMENTO_GENERICA = 20;

export function codigoTipoDocumento(
  valor: number | string | null | undefined,
  tipos: readonly TipoDocumentoIdentidad[]
): string {
  if (valor == null || valor === '') return '';

  const texto = String(valor).trim();
  const porId = tipos.find((tipo) => tipo.id === Number(valor));
  const candidato = porId?.codigo || porId?.nombre || texto;
  const normalizado = candidato.toUpperCase().trim();

  if (/^(CC|C[ÉE]DULA DE CIUDADAN[IÍ]A)$/.test(normalizado)) return 'CC';
  if (/^(TI|TARJETA DE IDENTIDAD)$/.test(normalizado)) return 'TI';
  if (/^(CE|C[ÉE]DULA DE EXTRANJER[IÍ]A)$/.test(normalizado)) return 'CE';
  if (/^(PA|PAS|PASAPORTE)$/.test(normalizado)) return 'PAS';
  if (/^(RC|REGISTRO CIVIL)$/.test(normalizado)) return 'RC';
  if (/^NUIP$/.test(normalizado)) return 'NUIP';
  if (/^NIP$/.test(normalizado)) return 'NIP';

  return normalizado;
}

export function longitudMaximaDocumento(
  valorTipo: number | string | null | undefined,
  tipos: readonly TipoDocumentoIdentidad[] = []
): number {
  const codigo = codigoTipoDocumento(valorTipo, tipos);
  return LONGITUD_MAXIMA_DOCUMENTO[codigo] ?? LONGITUD_MAXIMA_DOCUMENTO_GENERICA;
}

export function documentoEsAlfanumerico(
  valorTipo: number | string | null | undefined,
  tipos: readonly TipoDocumentoIdentidad[] = []
): boolean {
  return ['CE', 'PAS'].includes(codigoTipoDocumento(valorTipo, tipos));
}

export function limpiarDocumento(
  valor: string,
  valorTipo: number | string | null | undefined,
  tipos: readonly TipoDocumentoIdentidad[] = []
): string {
  const caracteresPermitidos = documentoEsAlfanumerico(valorTipo, tipos) ? /[^A-Z0-9]/g : /\D/g;
  return valor
    .toUpperCase()
    .replace(caracteresPermitidos, '')
    .slice(0, longitudMaximaDocumento(valorTipo, tipos));
}

export function fechaNacimientoPasadaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fecha = new Date(control.value);
  if (Number.isNaN(fecha.getTime())) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return fecha >= hoy ? { fechaFutura: true } : null;
}

export function esMayorDeEdad(fechaNacimiento: Date | string, hoy = new Date()): boolean {
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return false;

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad >= 18;
}

/** Invalida TI cuando la fecha de nacimiento corresponde a una persona adulta. */
export function tarjetaIdentidadMenorEdadValidator(
  obtenerFechaNacimiento: () => Date | string | null | undefined,
  obtenerTipos: () => readonly TipoDocumentoIdentidad[]
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const fechaNacimiento = obtenerFechaNacimiento();
    if (!fechaNacimiento) return null;

    const codigo = codigoTipoDocumento(control.value, obtenerTipos());
    return codigo === 'TI' && esMayorDeEdad(fechaNacimiento) ? { tiMayorEdad: true } : null;
  };
}
