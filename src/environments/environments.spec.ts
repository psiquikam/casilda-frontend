import { environment as demo } from './environment.demo';
import { environment as produccion } from './environment.prod';

/** Barreras de los entornos desplegables: producción nunca simula; demo solo cambia lo declarado. */
describe('Entornos desplegables', () => {
  it('producción usa el backend real para la UAD y no tiene datos de demostración', () => {
    expect(produccion.uad.adaptador).toBe('http');
    expect(produccion.datosDemostracion).toBeFalse();
  });

  it('demo hereda de producción y solo simula la UAD', () => {
    expect(demo.uad.adaptador).toBe('mock');
    expect(demo.apiBaseUrl).toBe(produccion.apiBaseUrl);
    expect(demo.datosDemostracion).toBeFalse();
    expect(demo.lineaAlma).toEqual(produccion.lineaAlma);
    expect(demo.features).toEqual(produccion.features);
  });
});
