import {
  INTENTOS_SIN_JUSTIFICACION,
  MAX_INTENTOS_CONTACTO,
  PRIORIDAD_POR_TRIAJE,
  esIdAtencionValido,
  esNumeroCasoValido,
  formatearIdAtencion,
  formatearNumeroCaso,
  normalizarIdentificador,
  parsearIdentificador,
  protocoloDeIntento
} from './alma.types';

/** J-0.1 — identificadores (RF-ALMA-001), protocolo (RN-ALMA-03) y relación triaje/prioridad (Q1). */
describe('tipos de dominio de Línea Alma', () => {
  describe('identificadores ALMA-/CAS-', () => {
    it('formatea con año y consecutivo de seis dígitos', () => {
      expect(formatearIdAtencion(2026, 7)).toBe('ALMA-2026-000007');
      expect(formatearNumeroCaso(2026, 123456)).toBe('CAS-2026-123456');
    });

    it('rechaza años y consecutivos fuera de rango', () => {
      expect(() => formatearIdAtencion(26, 1)).toThrowError(RangeError);
      expect(() => formatearNumeroCaso(2026, 0)).toThrowError(RangeError);
      expect(() => formatearNumeroCaso(2026, 1_000_000)).toThrowError(RangeError);
    });

    it('valida el formato exacto y no confunde un prefijo con el otro', () => {
      expect(esIdAtencionValido('ALMA-2026-000001')).toBeTrue();
      expect(esIdAtencionValido('CAS-2026-000001')).toBeFalse();
      expect(esNumeroCasoValido('CAS-2026-000001')).toBeTrue();
      expect(esNumeroCasoValido('CAS-2026-1')).toBeFalse();
      expect(esNumeroCasoValido(null)).toBeFalse();
    });

    it('normaliza lo que escribe la persona y lo descompone', () => {
      expect(normalizarIdentificador('  cas-2026-000045 ')).toBe('CAS-2026-000045');
      expect(parsearIdentificador('alma-2026-000123')).toEqual({ prefijo: 'ALMA', anio: 2026, consecutivo: 123 });
      expect(parsearIdentificador('ALMA-2026')).toBeNull();
    });
  });

  describe('protocolo de intentos (RN-ALMA-03)', () => {
    it('asigna Protocolo 1, 2 y 3 a los tres primeros intentos y «adicional» al resto', () => {
      expect(protocoloDeIntento(1)).toBe('PROTOCOLO_1');
      expect(protocoloDeIntento(2)).toBe('PROTOCOLO_2');
      expect(protocoloDeIntento(3)).toBe('PROTOCOLO_3');
      expect(protocoloDeIntento(4)).toBe('ADICIONAL');
      expect(protocoloDeIntento(MAX_INTENTOS_CONTACTO)).toBe('ADICIONAL');
    });

    it('el máximo es 9 y la justificación se exige desde el cuarto', () => {
      expect(MAX_INTENTOS_CONTACTO).toBe(9);
      expect(INTENTOS_SIN_JUSTIFICACION).toBe(3);
    });
  });

  it('relaciona cada triaje con una prioridad de caso sin perder ninguna (Q1)', () => {
    expect(PRIORIDAD_POR_TRIAJE).toEqual({ ALTO: 'ALTA', MEDIO: 'MEDIA', BAJO: 'BAJA' });
  });
});
