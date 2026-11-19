import { equipoDecisor, equipoInstructor, equipoResponsable, equiposConVisibilidad, esVinculacionDeterminada, esVisiblePara } from './competencia';

describe('UAD · competencia (UAD-NOT-05 a 09, UAD-CAS-04 a 07)', () => {
  it('estudiantes: instruye Equipo 4 y decide Equipo 3', () => {
    expect(equipoInstructor('ESTUDIANTE_PREGRADO')).toBe('EQUIPO_4');
    expect(equipoInstructor('ESTUDIANTE_POSGRADO')).toBe('EQUIPO_4');
    expect(equipoDecisor('ESTUDIANTE_PREGRADO')).toBe('EQUIPO_3');
  });

  it('docentes, administrativos, directivos y trabajadores oficiales: instruye Equipo 3 y decide Equipo 4', () => {
    for (const v of ['DOCENTE_VINCULADO', 'DOCENTE_OCASIONAL', 'DOCENTE_CATEDRA', 'ADMINISTRATIVO', 'TRABAJADOR_OFICIAL', 'DIRECTIVO'] as const) {
      expect(equipoInstructor(v)).withContext(v).toBe('EQUIPO_3');
      expect(equipoDecisor(v)).withContext(v).toBe('EQUIPO_4');
    }
    expect(equipoResponsable('DIRECTIVO', 'DECISION')).toBe('EQUIPO_4');
  });

  it('«No sé» y «No tiene vínculo» no determinan equipo', () => {
    expect(esVinculacionDeterminada('NO_SE')).toBeFalse();
    expect(esVinculacionDeterminada('NO_TIENE_VINCULO')).toBeFalse();
    expect(esVinculacionDeterminada(null)).toBeFalse();
    expect(equipoInstructor('NO_SE')).toBeNull();
  });

  it('NDA es visible a ambos equipos sin importar la vinculación', () => {
    expect(equiposConVisibilidad('NDA', 'ESTUDIANTE_PREGRADO')).toEqual(['EQUIPO_3', 'EQUIPO_4']);
  });

  it('NDI «No sé» es visible a ambos hasta clasificarla; después solo al competente', () => {
    expect(equiposConVisibilidad('NDI', 'NO_SE')).toEqual(['EQUIPO_3', 'EQUIPO_4']);
    expect(esVisiblePara(['EQUIPO_3'], 'NDI', 'ESTUDIANTE_POSGRADO')).toBeFalse();
    expect(esVisiblePara(['EQUIPO_4'], 'NDI', 'ESTUDIANTE_POSGRADO')).toBeTrue();
  });
});
