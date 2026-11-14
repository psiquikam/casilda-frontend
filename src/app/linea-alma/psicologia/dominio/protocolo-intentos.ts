import {
  INTENTOS_SIN_JUSTIFICACION,
  MAX_INTENTOS_CONTACTO,
  ProtocoloIntento,
  protocoloDeIntento
} from '../../shared/types/alma.types';

/**
 * Protocolo escalonado de intentos de contacto (J-1.3, RN-ALMA-03). Funciones **puras** con
 * pruebas unitarias; la pantalla solo las consume. El Backend repite estas reglas (Q11): aquí
 * las de «día y horario distintos» son **advertencia suave**, no bloqueo.
 */
export interface IntentoPrevio {
  readonly numeroIntento: number;
  readonly fechaHora: string;
}

export interface ResumenIntentos {
  readonly realizados: number;
  readonly restantes: number;
  readonly siguiente: number | null;
  readonly protocoloSiguiente: ProtocoloIntento | null;
  /** «3/9». */
  readonly texto: string;
  readonly agotados: boolean;
}

export function resumenIntentos(intentos: readonly IntentoPrevio[]): ResumenIntentos {
  const realizados = Math.min(intentos.length, MAX_INTENTOS_CONTACTO);
  const agotados = realizados >= MAX_INTENTOS_CONTACTO;
  const siguiente = agotados ? null : realizados + 1;
  return {
    realizados,
    restantes: MAX_INTENTOS_CONTACTO - realizados,
    siguiente,
    protocoloSiguiente: siguiente ? protocoloDeIntento(siguiente) : null,
    texto: `${realizados}/${MAX_INTENTOS_CONTACTO}`,
    agotados
  };
}

/** Desde el 4.º intento se exige justificación (Q11). */
export function requiereJustificacion(numeroIntento: number): boolean {
  return numeroIntento > INTENTOS_SIN_JUSTIFICACION;
}

/** Al registrar este intento sin éxito, el servidor cierra la novedad por «No contacto». */
export function cierraPorNoContacto(numeroIntento: number): boolean {
  return numeroIntento >= MAX_INTENTOS_CONTACTO;
}

export interface BloqueoIntento {
  readonly permitido: boolean;
  readonly motivo: string | null;
}

/** Se puede registrar un intento solo con la novedad pendiente, tomada por la sesión y con cupo. */
export function puedeRegistrarIntento(estadoNovedad: string, tomadaPorMi: boolean, intentos: readonly IntentoPrevio[]): BloqueoIntento {
  if (estadoNovedad !== 'PENDIENTE_PSICOLOGIA') return { permitido: false, motivo: 'La novedad ya no está pendiente: no se registran más intentos.' };
  if (!tomadaPorMi) return { permitido: false, motivo: 'Tome la novedad para registrar intentos de contacto.' };
  if (resumenIntentos(intentos).agotados) return { permitido: false, motivo: 'Se agotaron los 9 intentos del protocolo.' };
  return { permitido: true, motivo: null };
}

const HORA_MS = 3_600_000;

function mismoDiaLocal(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function minutosDelDia(fecha: Date): number {
  return fecha.getHours() * 60 + fecha.getMinutes();
}

/**
 * Advertencias (no bloqueos) para el intento que se va a registrar, comparado con el anterior:
 * el protocolo pide **distinto día** y **distinto horario** entre intentos (RN-ALMA-03).
 * «Horario» se considera repetido si la hora del día difiere menos de una hora.
 */
export function advertenciasIntento(fechaHoraNueva: string, intentos: readonly IntentoPrevio[]): string[] {
  const anterior = [...intentos].sort((a, b) => b.numeroIntento - a.numeroIntento)[0];
  if (!anterior || Number.isNaN(Date.parse(fechaHoraNueva))) return [];
  const nueva = new Date(fechaHoraNueva);
  const previa = new Date(anterior.fechaHora);
  const avisos: string[] = [];
  if (mismoDiaLocal(nueva, previa)) {
    avisos.push(`Es el mismo día del intento ${anterior.numeroIntento}. El protocolo recomienda intentar en un día distinto.`);
  }
  const diferenciaMin = Math.abs(minutosDelDia(nueva) - minutosDelDia(previa));
  if (Math.min(diferenciaMin, 1440 - diferenciaMin) * 60_000 < HORA_MS) {
    avisos.push(`Es un horario parecido al del intento ${anterior.numeroIntento}. El protocolo recomienda cambiar de franja horaria.`);
  }
  return avisos;
}
