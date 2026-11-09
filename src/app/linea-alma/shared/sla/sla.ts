import { SlaDto } from '../types/alma-dto';
import { SemaforoSla } from '../types/alma-psicologia-dto';

/**
 * Semáforo SLA (J-0.3, RN-ALMA-01, frontera F3). Lógica **pura**: la comparten `SlaBadge`, la
 * bandeja de Psicología, las listas de APH y el mock (filtro `semaforo=`).
 *
 * Todo se calcula con `venceEn` y `ahoraServidor` que entrega el Backend; el reloj del navegador
 * solo aporta el **tiempo transcurrido** desde que llegó la respuesta (riesgo R6: desfase de
 * reloj o zona horaria).
 *
 * Umbrales (Q3, sugerencia a validar con Laura Murillo): verde mientras queda más del 50 % del
 * tiempo, amarillo entre 50 % y 20 %, rojo con menos del 20 % o vencido.
 */
export interface UmbralesSla {
  /** Fracción restante por debajo de la cual el semáforo pasa a amarillo. */
  readonly amarillo: number;
  /** Fracción restante por debajo de la cual pasa a rojo. */
  readonly rojo: number;
}

export const UMBRALES_SLA_POR_DEFECTO: UmbralesSla = { amarillo: 0.5, rojo: 0.2 };

export interface EstadoSla {
  readonly semaforo: SemaforoSla;
  readonly vencido: boolean;
  /** Milisegundos restantes (negativos si ya venció). */
  readonly restanteMs: number;
  /** Fracción del plazo total que todavía queda, entre 0 y 1. */
  readonly fraccionRestante: number;
  readonly horasLimite: number;
}

const HORA_MS = 3_600_000;
const MINUTO_MS = 60_000;

/** Instante «ahora» en el reloj del servidor, dado cuándo llegó `ahoraServidor` y cuánto pasó desde entonces. */
export function ahoraSegunServidor(ahoraServidor: string, recibidoEnMs: number, ahoraLocalMs: number): number {
  const transcurrido = Math.max(0, ahoraLocalMs - recibidoEnMs);
  return Date.parse(ahoraServidor) + transcurrido;
}

export function evaluarSla(sla: SlaDto, ahoraServidorMs: number, umbrales: UmbralesSla = UMBRALES_SLA_POR_DEFECTO): EstadoSla {
  const venceEnMs = Date.parse(sla.venceEn);
  const totalMs = Math.max(sla.horasLimite * HORA_MS, 1);
  const restanteMs = venceEnMs - ahoraServidorMs;
  const fraccionRestante = Math.min(1, Math.max(0, restanteMs / totalMs));
  const vencido = restanteMs <= 0;
  const semaforo: SemaforoSla = vencido || fraccionRestante < umbrales.rojo ? 'ROJO' : fraccionRestante < umbrales.amarillo ? 'AMARILLO' : 'VERDE';
  return { semaforo, vencido, restanteMs, fraccionRestante, horasLimite: sla.horasLimite };
}

/** Atajo para evaluar con el `ahoraServidor` del propio DTO (listas recién recibidas, mocks). */
export function semaforoDe(sla: SlaDto, umbrales?: UmbralesSla): SemaforoSla {
  return evaluarSla(sla, Date.parse(sla.ahoraServidor), umbrales).semaforo;
}

/** «3 h 20 min», «45 min», «menos de un minuto». Siempre con el valor absoluto. */
export function formatearDuracion(ms: number): string {
  const absoluto = Math.abs(ms);
  const horas = Math.floor(absoluto / HORA_MS);
  const minutos = Math.floor((absoluto % HORA_MS) / MINUTO_MS);
  if (horas === 0 && minutos === 0) return 'menos de un minuto';
  if (horas === 0) return `${minutos} min`;
  if (minutos === 0) return `${horas} h`;
  return `${horas} h ${minutos} min`;
}

/** Texto para la persona usuaria: «Quedan 3 h 20 min» o «Vencido hace 2 h». */
export function describirSla(estado: EstadoSla): string {
  return estado.vencido ? `Vencido hace ${formatearDuracion(estado.restanteMs)}` : `Quedan ${formatearDuracion(estado.restanteMs)}`;
}

export const ETIQUETA_SEMAFORO: Record<SemaforoSla, string> = {
  VERDE: 'Dentro del plazo',
  AMARILLO: 'Plazo por vencer',
  ROJO: 'Plazo vencido o crítico'
};
