import { environment as demo } from './environment.demo';
import { environment as produccion } from './environment.prod';

/** Barreras de los entornos desplegables: producción nunca simula; demo solo cambia lo declarado. */
describe('Entornos desplegables', () => {
  it('producción usa el backend real para UAD y Línea Alma y no tiene datos de demostración', () => {
    expect(produccion.uad.adaptador).toBe('http');
    expect(Object.values(produccion.lineaAlma.mocks).some(Boolean)).toBeFalse();
    expect(produccion.datosDemostracion).toBeFalse();
    // Sin endpoint en el backend, un formulario público que falla no se publica.
    expect(produccion.features.uadQuejaAnonima).toBeFalse();
    expect(produccion.features.uadMisReportes).toBeFalse();
  });

  it('demo hereda de producción y solo simula UAD y Línea Alma', () => {
    expect(demo.uad.adaptador).toBe('mock');
    expect(demo.apiBaseUrl).toBe(produccion.apiBaseUrl);
    expect(demo.datosDemostracion).toBeFalse();
    expect(demo.features).toEqual({ ...produccion.features, uadQuejaAnonima: true, uadMisReportes: true });
  });

  it('demo enciende todos los grupos simulados de Línea Alma, también los que se agreguen', () => {
    expect(Object.keys(demo.lineaAlma.mocks).sort()).toEqual(Object.keys(produccion.lineaAlma.mocks).sort());
    expect(Object.values(demo.lineaAlma.mocks).every(Boolean)).toBeTrue();
  });
});
