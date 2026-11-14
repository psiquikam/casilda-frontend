import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SEGUIMIENTOS_REGLAMENTARIOS } from '../../shared/types/alma.types';

/**
 * Reglas puras de seguimientos y controles (J-1.5, RN-ALMA-05). El contador es informativo:
 * superar los 3 controles reglamentarios **nunca bloquea** el expediente.
 */
export interface ContadorControles {
  /** Controles realizados: la atención inicial (primer contacto) más los seguimientos. */
  readonly realizados: number;
  readonly reglamentarios: number;
  /** «2/3», «5/3». */
  readonly texto: string;
  readonly excedeReglamentarios: boolean;
  readonly faltanParaReglamentarios: number;
}

export function contadorControles(numeroSeguimientos: number): ContadorControles {
  const realizados = Math.max(0, numeroSeguimientos) + 1;
  return {
    realizados,
    reglamentarios: SEGUIMIENTOS_REGLAMENTARIOS,
    texto: `${realizados}/${SEGUIMIENTOS_REGLAMENTARIOS}`,
    excedeReglamentarios: realizados > SEGUIMIENTOS_REGLAMENTARIOS,
    faltanParaReglamentarios: Math.max(0, SEGUIMIENTOS_REGLAMENTARIOS - realizados)
  };
}

/** `datetime-local` (`YYYY-MM-DDTHH:mm`, hora local) → ISO-8601 con zona. `null` si está vacío o es inválido. */
export function desdeFechaLocal(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

/** ISO-8601 → valor para un `<input type="datetime-local">` en hora local. */
export function aFechaLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

/** Mensaje si la fecha no es futura; `null` si es válida. `ahoraMs` permite anclar al reloj del servidor. */
export function validarFechaFutura(valor: string | null | undefined, ahoraMs: number = Date.now()): string | null {
  const iso = desdeFechaLocal(valor);
  if (!iso) return 'Indique una fecha y hora válidas.';
  return Date.parse(iso) > ahoraMs ? null : 'La fecha del próximo control no puede ser pasada.';
}

/** Validador de formulario reactivo: `{ fechaPasada: mensaje }` cuando la fecha no es futura. Ignora vacíos (eso lo decide `required`). */
export function fechaFuturaValidator(ahora: () => number = () => Date.now()): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const mensaje = validarFechaFutura(control.value, ahora());
    return mensaje ? { fechaPasada: mensaje } : null;
  };
}
