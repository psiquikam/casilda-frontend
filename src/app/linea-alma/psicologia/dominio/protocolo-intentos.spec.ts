import {
  advertenciasIntento,
  cierraPorNoContacto,
  puedeRegistrarIntento,
  requiereJustificacion,
  resumenIntentos
} from './protocolo-intentos';

/** J-1.3 / J-3.1 — lógica pura del protocolo de 9 intentos (RN-ALMA-03, Q11). */
describe('protocolo de intentos de contacto', () => {
  const intentos = (n: number, base = '2026-11-01T09:00:00-05:00') =>
    Array.from({ length: n }, (_, i) => ({ numeroIntento: i + 1, fechaHora: new Date(Date.parse(base) + i * 36 * 3_600_000).toISOString() }));

  it('cuenta n/9, el siguiente intento y su protocolo', () => {
    expect(resumenIntentos([])).toEqual(jasmine.objectContaining({ realizados: 0, restantes: 9, siguiente: 1, protocoloSiguiente: 'PROTOCOLO_1', texto: '0/9', agotados: false }));
    expect(resumenIntentos(intentos(3))).toEqual(jasmine.objectContaining({ siguiente: 4, protocoloSiguiente: 'ADICIONAL', texto: '3/9' }));
    expect(resumenIntentos(intentos(9))).toEqual(jasmine.objectContaining({ restantes: 0, siguiente: null, protocoloSiguiente: null, agotados: true }));
  });

  it('exige justificación desde el cuarto intento y cierra por «No contacto» en el noveno', () => {
    expect(requiereJustificacion(3)).toBeFalse();
    expect(requiereJustificacion(4)).toBeTrue();
    expect(cierraPorNoContacto(8)).toBeFalse();
    expect(cierraPorNoContacto(9)).toBeTrue();
  });

  it('solo permite registrar con la novedad pendiente, tomada por la sesión y con cupo', () => {
    expect(puedeRegistrarIntento('PENDIENTE_PSICOLOGIA', true, intentos(2)).permitido).toBeTrue();
    expect(puedeRegistrarIntento('CERRADO', true, intentos(2)).motivo).toContain('ya no está pendiente');
    expect(puedeRegistrarIntento('PENDIENTE_PSICOLOGIA', false, []).motivo).toContain('Tome la novedad');
    expect(puedeRegistrarIntento('PENDIENTE_PSICOLOGIA', true, intentos(9)).motivo).toContain('agotaron');
  });

  describe('advertencias de día y horario (suaves, no bloquean)', () => {
    const previos = [{ numeroIntento: 1, fechaHora: '2026-11-05T10:00:00-05:00' }];

    it('avisa si se repite el día del intento anterior', () => {
      const avisos = advertenciasIntento('2026-11-05T16:30:00-05:00', previos);
      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain('mismo día');
    });

    it('avisa si el horario es parecido (menos de una hora de diferencia), aunque sea otro día', () => {
      const avisos = advertenciasIntento('2026-11-06T10:40:00-05:00', previos);
      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain('horario parecido');
    });

    it('no avisa con día y horario distintos, ni sin intentos previos', () => {
      expect(advertenciasIntento('2026-11-06T15:00:00-05:00', previos)).toEqual([]);
      expect(advertenciasIntento('2026-11-05T10:00:00-05:00', [])).toEqual([]);
    });

    it('compara contra el intento más reciente, no contra el primero', () => {
      const varios = [...previos, { numeroIntento: 2, fechaHora: '2026-11-07T18:00:00-05:00' }];
      expect(advertenciasIntento('2026-11-07T09:00:00-05:00', varios)[0]).toContain('intento 2');
    });
  });
});
