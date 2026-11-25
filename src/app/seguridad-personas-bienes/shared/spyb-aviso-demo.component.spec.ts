import { environment as desarrollo } from '../../../environments/environment';
import { environment as produccion } from '../../../environments/environment.prod';
import { spybConDatosSimulados } from './spyb-aviso-demo.component';

describe('Aviso de demostración de SPyB', () => {
  it('no se muestra en producción', () => {
    expect(spybConDatosSimulados(produccion.seguridadPyB.mocks)).toBeFalse();
  });

  it('se muestra cuando hay servicios simulados', () => {
    expect(spybConDatosSimulados(desarrollo.seguridadPyB.mocks)).toBeTrue();
  });
});
