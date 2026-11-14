import { SlaDto } from '../types/alma-dto';
import { ahoraSegunServidor, describirSla, evaluarSla, formatearDuracion, semaforoDe } from './sla';

/** J-0.3 / J-3.1 — umbrales del semáforo, vencimiento y manejo del desfase de reloj (R6). */
describe('semáforo SLA (RN-ALMA-01)', () => {
  const HORA = 3_600_000;
  const venceEn = '2026-11-06T21:15:00-05:00';
  const sla = (ahoraServidor: string, horasLimite = 12): SlaDto => ({ horasLimite, venceEn, ahoraServidor });
  const venceEnMs = Date.parse(venceEn);

  it('es verde con más del 50 % del tiempo restante', () => {
    const estado = evaluarSla(sla('x'), venceEnMs - 7 * HORA);
    expect(estado.semaforo).toBe('VERDE');
    expect(estado.vencido).toBeFalse();
    expect(estado.fraccionRestante).toBeCloseTo(7 / 12, 5);
  });

  it('pasa a amarillo entre el 50 % y el 20 %', () => {
    expect(evaluarSla(sla('x'), venceEnMs - 6 * HORA).semaforo).toBe('VERDE'); // exactamente 50 % sigue verde
    expect(evaluarSla(sla('x'), venceEnMs - 5 * HORA).semaforo).toBe('AMARILLO');
    expect(evaluarSla(sla('x'), venceEnMs - 2.4 * HORA).semaforo).toBe('AMARILLO'); // exactamente 20 %
  });

  it('es rojo con menos del 20 % o vencido', () => {
    expect(evaluarSla(sla('x'), venceEnMs - 2 * HORA).semaforo).toBe('ROJO');
    const vencido = evaluarSla(sla('x'), venceEnMs + 90 * 60_000);
    expect(vencido.semaforo).toBe('ROJO');
    expect(vencido.vencido).toBeTrue();
    expect(vencido.restanteMs).toBe(-90 * 60_000);
    expect(vencido.fraccionRestante).toBe(0);
  });

  it('admite umbrales configurables', () => {
    const umbrales = { amarillo: 0.8, rojo: 0.5 };
    expect(evaluarSla(sla('x'), venceEnMs - 9 * HORA, umbrales).semaforo).toBe('AMARILLO');
    expect(evaluarSla(sla('x'), venceEnMs - 5 * HORA, umbrales).semaforo).toBe('ROJO');
  });

  it('`semaforoDe` evalúa con el `ahoraServidor` del DTO, no con el reloj del navegador', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2030-01-01T00:00:00Z'));
    expect(semaforoDe(sla('2026-11-06T10:00:00-05:00'))).toBe('VERDE');
    jasmine.clock().uninstall();
  });

  it('`ahoraSegunServidor` suma solo el tiempo transcurrido localmente, aunque el reloj local esté desfasado', () => {
    const recibido = 1_000_000; // reloj local arbitrario, años distinto al del servidor
    const ahora = ahoraSegunServidor('2026-11-06T10:00:00-05:00', recibido, recibido + 5 * 60_000);
    expect(ahora).toBe(Date.parse('2026-11-06T10:05:00-05:00'));
    expect(ahoraSegunServidor('2026-11-06T10:00:00-05:00', recibido, recibido - 1000)).toBe(Date.parse('2026-11-06T10:00:00-05:00'));
  });

  it('formatea duraciones de forma legible', () => {
    expect(formatearDuracion(3 * HORA + 20 * 60_000)).toBe('3 h 20 min');
    expect(formatearDuracion(45 * 60_000)).toBe('45 min');
    expect(formatearDuracion(2 * HORA)).toBe('2 h');
    expect(formatearDuracion(-30 * 1000)).toBe('menos de un minuto');
  });

  it('describe el estado con «Quedan» o «Vencido hace»', () => {
    expect(describirSla(evaluarSla(sla('x'), venceEnMs - 2 * HORA))).toBe('Quedan 2 h');
    expect(describirSla(evaluarSla(sla('x'), venceEnMs + 10 * 60_000))).toBe('Vencido hace 10 min');
  });
});
