import { esTelefonoPublicable } from './telefono-crisis';

/**
 * Esta suite es la red de seguridad de DSH-05-01: si alguien vuelve a poner un
 * número de relleno en `environment.telefonoOrientacion`, las pruebas fallan
 * antes de que el valor llegue a una persona en crisis.
 */
describe('esTelefonoPublicable', () => {
  describe('rechaza valores que no son un teléfono real', () => {
    it('rechaza el valor vacío y el que solo tiene espacios', () => {
      expect(esTelefonoPublicable('')).toBeFalse();
      expect(esTelefonoPublicable('   ')).toBeFalse();
    });

    it('rechaza null y undefined', () => {
      expect(esTelefonoPublicable(null)).toBeFalse();
      expect(esTelefonoPublicable(undefined)).toBeFalse();
    });

    it('rechaza el marcador histórico 1234567890', () => {
      expect(esTelefonoPublicable('1234567890')).toBeFalse();
    });

    it('rechaza secuencias consecutivas en cualquier sentido', () => {
      expect(esTelefonoPublicable('0123456789')).toBeFalse();
      expect(esTelefonoPublicable('9876543210')).toBeFalse();
      expect(esTelefonoPublicable('1234567')).toBeFalse();
    });

    it('rechaza secuencias aunque lleguen con separadores o prefijo', () => {
      expect(esTelefonoPublicable('123 456 7890')).toBeFalse();
      expect(esTelefonoPublicable('+57 123 456 7890')).toBeFalse();
      expect(esTelefonoPublicable('123-456-7890')).toBeFalse();
    });

    it('rechaza la repetición de un mismo dígito', () => {
      expect(esTelefonoPublicable('0000000000')).toBeFalse();
      expect(esTelefonoPublicable('1111111111')).toBeFalse();
    });

    it('rechaza textos de relleno', () => {
      expect(esTelefonoPublicable('pendiente')).toBeFalse();
      expect(esTelefonoPublicable('Por confirmar')).toBeFalse();
      expect(esTelefonoPublicable('TODO')).toBeFalse();
      expect(esTelefonoPublicable('N/A')).toBeFalse();
      expect(esTelefonoPublicable('xxx')).toBeFalse();
    });

    it('rechaza valores sin dígitos suficientes para marcar', () => {
      expect(esTelefonoPublicable('—')).toBeFalse();
      expect(esTelefonoPublicable('12')).toBeFalse();
    });
  });

  describe('acepta teléfonos reales', () => {
    it('acepta una línea nacional colombiana', () => {
      expect(esTelefonoPublicable('6042196000')).toBeTrue();
    });

    it('acepta un número con prefijo internacional y separadores', () => {
      expect(esTelefonoPublicable('+57 604 219 6000')).toBeTrue();
    });

    it('acepta las líneas cortas reales que el panel ya publica', () => {
      // La regla de secuencias no se aplica por debajo de 7 dígitos, para no
      // descartar líneas legítimas como la 123 de emergencias o la 155.
      expect(esTelefonoPublicable('155')).toBeTrue();
      expect(esTelefonoPublicable('123')).toBeTrue();
    });
  });
});
