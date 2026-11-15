import { construirRadicacionNda, validarRadicacionNda } from './radicacion-nda';

describe('UAD · queja anónima (reglas)', () => {
  it('arma el cuerpo con vacíos en null y sin campos de identidad ni contacto', () => {
    const cuerpo = construirRadicacionNda({ descripcionHechos: '  Relato ficticio con detalle suficiente.  ', lugarOcurrencia: ' ', vinculacionDeclarada: '' });
    expect(cuerpo).toEqual({
      descripcionHechos: 'Relato ficticio con detalle suficiente.',
      lugarOcurrencia: null,
      presuntoResponsable: null,
      vinculacionDeclarada: null
    });
    expect(Object.keys(cuerpo)).not.toContain('correo');
    expect(Object.keys(cuerpo)).not.toContain('numeroDocumento');
  });

  it('exige un relato mínimo y respeta los límites', () => {
    expect(validarRadicacionNda(construirRadicacionNda({ descripcionHechos: 'corto' }))['descripcionHechos']).toBeTruthy();
    expect(validarRadicacionNda(construirRadicacionNda({ descripcionHechos: 'x'.repeat(4001) }))['descripcionHechos']).toBeTruthy();
    expect(validarRadicacionNda(construirRadicacionNda({ descripcionHechos: 'Relato ficticio suficiente.', lugarOcurrencia: 'x'.repeat(301) }))['lugarOcurrencia']).toBeTruthy();
  });

  it('la vinculación es opcional; «No sé» y «No tiene vínculo» son válidas', () => {
    expect(validarRadicacionNda(construirRadicacionNda({ descripcionHechos: 'Relato ficticio suficiente.' }))).toEqual({});
    expect(validarRadicacionNda(construirRadicacionNda({ descripcionHechos: 'Relato ficticio suficiente.', vinculacionDeclarada: 'NO_SE' }))).toEqual({});
    expect(validarRadicacionNda(construirRadicacionNda({ descripcionHechos: 'Relato ficticio suficiente.', vinculacionDeclarada: 'NO_TIENE_VINCULO' }))).toEqual({});
  });
});
