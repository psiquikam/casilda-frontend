import { FormControl } from '@angular/forms';
import {
  CAMPOS_CARACTERIZACION,
  construirPersona,
  crearGrupoCaracterizacion,
  fechaNacimientoValida,
  separarNombre,
  unirNombre,
  valoresCaracterizacion
} from './caracterizacion-campos';

describe('caracterización de la persona', () => {
  it('incluye fecha de nacimiento, identidad de género y vínculo con la universidad', () => {
    const controles = CAMPOS_CARACTERIZACION.map((c) => c.control);
    expect(controles).toEqual(jasmine.arrayContaining(['fechaNacimiento', 'identidadGenero', 'vinculoUniversidad']));
  });

  it('la fecha de nacimiento no puede ser futura ni anterior a 1900', () => {
    expect(fechaNacimientoValida(new FormControl(''))).toBeNull();
    expect(fechaNacimientoValida(new FormControl('2000-05-01'))).toBeNull();
    expect(fechaNacimientoValida(new FormControl('1850-01-01'))).toEqual({ fechaInvalida: true });
    const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    expect(fechaNacimientoValida(new FormControl(manana))).toEqual({ fechaFutura: true });
  });

  it('construirPersona deja en null lo que está vacío y valoresCaracterizacion devuelve el camino inverso', () => {
    const grupo = crearGrupoCaracterizacion();
    grupo.patchValue({ primerNombre: ' Ana ', segundoNombre: 'María', primerApellido: 'Pérez', identidadGenero: 'MUJER_CIS', estrato: '3' });
    const persona = construirPersona(grupo.getRawValue());
    expect(persona.nombres).toBe('Ana María');
    expect(persona.apellidos).toBe('Pérez');
    expect(persona.fechaNacimiento).toBeNull();
    expect(persona.identidadGenero).toBe('MUJER_CIS');
    expect(persona.estrato).toBe(3);

    const valores = valoresCaracterizacion({ tipoIdentificacion: 'CC', numeroIdentificacion: '1', ...persona });
    expect(valores.primerNombre).toBe('Ana');
    expect(valores.segundoNombre).toBe('María');
    expect(valores.primerApellido).toBe('Pérez');
    expect(valores.segundoApellido).toBe('');
    expect(valores.estrato).toBe('3');
  });

  it('primer y segundo nombre se unen y se separan sin perder texto', () => {
    expect(unirNombre('Ana', '')).toBe('Ana');
    expect(unirNombre(' ', ' ')).toBeNull();
    expect(separarNombre('Ana María')).toEqual({ primero: 'Ana', segundo: 'María' });
    expect(separarNombre('De la Cruz')).toEqual({ primero: 'De', segundo: 'la Cruz' });
    expect(separarNombre(null)).toEqual({ primero: '', segundo: '' });
  });
});
