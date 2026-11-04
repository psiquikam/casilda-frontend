import { FormControl } from '@angular/forms';
import {
  codigoTipoDocumento,
  esMayorDeEdad,
  limpiarDocumento,
  longitudMaximaDocumento,
  tarjetaIdentidadMenorEdadValidator
} from './documento-identidad';

describe('reglas de documento de identidad', () => {
  const tipos = [
    { id: 1, codigo: 'CC', nombre: 'Cédula de ciudadanía' },
    { id: 2, codigo: 'TI', nombre: 'Tarjeta de identidad' },
    { id: 3, codigo: 'CE', nombre: 'Cédula de extranjería' },
    { id: 4, codigo: 'PAS', nombre: 'Pasaporte' }
  ];

  it('resuelve el código y la longitud máxima desde el id del maestro', () => {
    expect(codigoTipoDocumento(2, tipos)).toBe('TI');
    expect(longitudMaximaDocumento(1, tipos)).toBe(10);
    expect(longitudMaximaDocumento(2, tipos)).toBe(11);
    expect(longitudMaximaDocumento(3, tipos)).toBe(6);
    expect(longitudMaximaDocumento(4, tipos)).toBe(16);
  });

  it('limpia y recorta documentos según su tipo', () => {
    expect(limpiarDocumento('1.234.567.8909', 1, tipos)).toBe('1234567890');
    expect(limpiarDocumento('ab-12345678901234567', 4, tipos)).toBe('AB12345678901234');
  });

  it('calcula la mayoría de edad respetando el día del cumpleaños', () => {
    const hoy = new Date(2026, 10, 3);
    expect(esMayorDeEdad(new Date(2008, 10, 3), hoy)).toBeTrue();
    expect(esMayorDeEdad(new Date(2008, 10, 4), hoy)).toBeFalse();
  });

  it('rechaza TI para una persona mayor de edad', () => {
    const control = new FormControl(2, tarjetaIdentidadMenorEdadValidator(
      () => new Date(2000, 0, 1),
      () => tipos
    ));
    expect(control.hasError('tiMayorEdad')).toBeTrue();
  });
});
