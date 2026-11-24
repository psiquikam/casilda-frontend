import { aContratoServidor, desdeContratoServidor } from './alma-contrato.interceptor';

/** Contrato real del backend (rama `feat/psicologia-bandeja-novedades`): nombres separados y lista cerrada de campos. */
describe('almaContratoInterceptor', () => {
  const persona = { tipoIdentificacion: 'CC', numeroIdentificacion: '1', nombres: 'Ana María', apellidos: 'Pérez', telefonoPrincipal: '3001234567', fechaNacimiento: '2000-01-01', identidadGenero: 'X', vinculoUniversidad: 'Y' };

  describe('aContratoServidor', () => {
    it('envía primer y segundo nombre/apellido y nunca `nombres` ni `apellidos`', () => {
      const salida = aContratoServidor({ persona }, true) as { persona: Record<string, unknown> };
      expect(salida.persona['nombres']).toBeUndefined();
      expect(salida.persona['apellidos']).toBeUndefined();
      expect(salida.persona['primerNombre']).toBe('Ana');
      expect(salida.persona['segundoNombre']).toBe('María');
      expect(salida.persona['primerApellido']).toBe('Pérez');
      expect(salida.persona['segundoApellido']).toBeNull();
    });

    it('respeta los cuatro campos cuando el formulario ya los trae', () => {
      const salida = aContratoServidor({ persona: { ...persona, primerNombre: 'Juan', segundoNombre: null, primerApellido: 'Gómez', segundoApellido: 'Ruiz' } }, true) as { persona: Record<string, unknown> };
      expect(salida.persona['primerNombre']).toBe('Juan');
      expect(salida.persona['segundoApellido']).toBe('Ruiz');
      expect(salida.persona['nombres']).toBeUndefined();
    });

    it('sin extensiones retira lo que el backend no admite; con extensiones lo conserva', () => {
      const cuerpo = { persona, lugarOcurrencia: 'DENTRO_UDEA', solicitante: { esTercero: true, nombres: 'X', correo: 'a@b.co', parentescoOtro: 'Vecina' } };
      const sin = aContratoServidor(cuerpo, false) as { persona: Record<string, unknown>; lugarOcurrencia?: string; solicitante: Record<string, unknown> };
      expect(sin.persona['fechaNacimiento']).toBeUndefined();
      expect(sin.persona['identidadGenero']).toBeUndefined();
      expect(sin.persona['vinculoUniversidad']).toBeUndefined();
      expect(sin.lugarOcurrencia).toBeUndefined();
      expect(sin.solicitante['correo']).toBeUndefined();
      expect(sin.solicitante['parentescoOtro']).toBeUndefined();
      expect(sin.solicitante['nombres']).toBe('X');
      const con = aContratoServidor(cuerpo, true) as { persona: Record<string, unknown>; lugarOcurrencia?: string };
      expect(con.persona['fechaNacimiento']).toBe('2000-01-01');
      expect(con.lugarOcurrencia).toBe('DENTRO_UDEA');
    });

    it('no modifica el cuerpo original ni toca lo que no es un objeto', () => {
      const original = { persona: { ...persona } };
      aContratoServidor(original, false);
      expect(original.persona.nombres).toBe('Ana María');
      expect(aContratoServidor(null, false)).toBeNull();
    });
  });

  describe('desdeContratoServidor', () => {
    it('recompone `nombres` y `apellidos` donde el backend manda los cuatro campos, también en listas', () => {
      const respuesta = desdeContratoServidor({ persona: { primerNombre: 'Ana', segundoNombre: 'María', primerApellido: 'Pérez', segundoApellido: null }, items: [{ persona: { primerNombre: 'Luis', primerApellido: 'Mora' } }] }) as {
        persona: Record<string, unknown>;
        items: { persona: Record<string, unknown> }[];
      };
      expect(respuesta.persona['nombres']).toBe('Ana María');
      expect(respuesta.persona['apellidos']).toBe('Pérez');
      expect(respuesta.items[0].persona['nombres']).toBe('Luis');
    });

    it('deja igual lo que ya trae `nombres` o no tiene nombres', () => {
      expect(desdeContratoServidor({ persona: { nombres: 'Ya viene' } })).toEqual({ persona: { nombres: 'Ya viene' } });
      expect(desdeContratoServidor([1, 'a', null])).toEqual([1, 'a', null]);
    });
  });
});
