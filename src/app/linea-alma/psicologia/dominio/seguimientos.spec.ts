import { FormControl } from '@angular/forms';
import { aFechaLocal, contadorControles, desdeFechaLocal, fechaFuturaValidator, validarFechaFutura } from './seguimientos';

/** J-1.5 / J-3.1 — contador informativo (RN-ALMA-05) y validación de la fecha del próximo control. */
describe('reglas de seguimientos', () => {
  it('cuenta la atención inicial más los seguimientos sobre 3 reglamentarios', () => {
    expect(contadorControles(0)).toEqual(jasmine.objectContaining({ realizados: 1, texto: '1/3', excedeReglamentarios: false, faltanParaReglamentarios: 2 }));
    expect(contadorControles(2)).toEqual(jasmine.objectContaining({ realizados: 3, texto: '3/3', excedeReglamentarios: false, faltanParaReglamentarios: 0 }));
  });

  it('con más de 3 controles sigue contando y solo marca que excede (no bloquea)', () => {
    const contador = contadorControles(4);
    expect(contador.texto).toBe('5/3');
    expect(contador.excedeReglamentarios).toBeTrue();
    expect(contador.faltanParaReglamentarios).toBe(0);
  });

  it('convierte entre `datetime-local` e ISO sin perder la hora local', () => {
    const iso = desdeFechaLocal('2026-11-20T10:30')!;
    expect(aFechaLocal(iso)).toBe('2026-11-20T10:30');
    expect(desdeFechaLocal('')).toBeNull();
    expect(desdeFechaLocal('no-fecha')).toBeNull();
    expect(aFechaLocal(null)).toBe('');
  });

  it('rechaza una fecha de próximo control pasada o inválida', () => {
    const ahora = Date.parse('2026-11-06T12:00:00-05:00');
    expect(validarFechaFutura('2026-11-07T09:00', ahora)).toBeNull();
    expect(validarFechaFutura('2020-01-01T09:00', ahora)).toContain('no puede ser pasada');
    expect(validarFechaFutura('', ahora)).toContain('válidas');
  });

  it('el validador reactivo deja los vacíos a `required` y marca `fechaPasada`', () => {
    const validador = fechaFuturaValidator(() => Date.parse('2026-11-06T12:00:00-05:00'));
    expect(validador(new FormControl(''))).toBeNull();
    expect(validador(new FormControl('2030-01-01T09:00'))).toBeNull();
    expect(validador(new FormControl('2020-01-01T09:00'))?.['fechaPasada']).toBeDefined();
  });
});
