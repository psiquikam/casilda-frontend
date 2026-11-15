import { ActuacionDisponible, CodigoActuacion } from '../contratos/uad-api.types';
import { catalogoParaCaso, esPermanente, validarActuaciones } from './catalogo-actuaciones';

const ordinarias = (lista: readonly ActuacionDisponible[]): CodigoActuacion[] => lista.filter((a) => !a.permanente).map((a) => a.codigo);
const accion = (lista: readonly ActuacionDisponible[], codigo: CodigoActuacion) => lista.find((a) => a.codigo === codigo)!;

describe('UAD · catálogo de actuaciones (bitácora §7 y §8)', () => {
  it('Equipo 3 en instrucción: indagación, investigación, pruebas y pliego', () => {
    expect(ordinarias(catalogoParaCaso('INSTRUCCION', 'EQUIPO_3', 'ACTIVA'))).toEqual([
      'INDAGACION_PREVIA',
      'INVESTIGACION_DISCIPLINARIA',
      'PRACTICA_PRUEBAS',
      'PLIEGO_CARGOS'
    ]);
  });

  it('Equipo 4 en instrucción: averiguaciones preliminares, pruebas y pliego', () => {
    expect(ordinarias(catalogoParaCaso('INSTRUCCION', 'EQUIPO_4', 'ACTIVA'))).toEqual(['AVERIGUACIONES_PRELIMINARES', 'PRACTICA_PRUEBAS', 'PLIEGO_CARGOS']);
  });

  it('decisión (ambos equipos): pruebas, audiencias, mediación, fallo y recursos', () => {
    for (const equipo of ['EQUIPO_3', 'EQUIPO_4'] as const) {
      expect(ordinarias(catalogoParaCaso('DECISION', equipo, 'ACTIVA'))).toEqual(['PRACTICA_PRUEBAS', 'AUDIENCIAS', 'MEDIACION', 'FALLO', 'REPOSICION_APELACION']);
    }
  });

  it('mediación se muestra pero queda pendiente de validación jurídica', () => {
    const mediacion = accion(catalogoParaCaso('DECISION', 'EQUIPO_3', 'ACTIVA'), 'MEDIACION');
    expect(mediacion.ejecutable).toBeFalse();
    expect(mediacion.pendienteValidacion).toBeTrue();
    expect(mediacion.motivoNoEjecutable).toBeTruthy();
  });

  it('las cinco acciones permanentes son siempre visibles', () => {
    for (const fase of ['INSTRUCCION', 'DECISION'] as const) {
      const permanentes = catalogoParaCaso(fase, 'EQUIPO_4', 'ACTIVA').filter((a) => a.permanente).map((a) => a.codigo);
      expect(permanentes).toEqual(['REMISION_COMPETENCIA', 'INHIBITORIO', 'TERMINACION', 'FINALIZAR_INSTRUCCION', 'REMISION_RUTA']);
    }
  });

  it('«Finalizar etapa de instrucción» solo se ejecuta en instrucción', () => {
    expect(accion(catalogoParaCaso('INSTRUCCION', 'EQUIPO_3', 'ACTIVA'), 'FINALIZAR_INSTRUCCION').ejecutable).toBeTrue();
    const enDecision = accion(catalogoParaCaso('DECISION', 'EQUIPO_3', 'ACTIVA'), 'FINALIZAR_INSTRUCCION');
    expect(enDecision.ejecutable).toBeFalse();
    expect(enDecision.motivoNoEjecutable).toContain('instrucción');
  });

  it('inhibitorio, terminación y remisión a la Ruta quedan visibles pero pendientes', () => {
    const lista = catalogoParaCaso('INSTRUCCION', 'EQUIPO_3', 'ACTIVA');
    for (const codigo of ['INHIBITORIO', 'TERMINACION', 'REMISION_RUTA'] as const) {
      expect(accion(lista, codigo).ejecutable).withContext(codigo).toBeFalse();
      expect(accion(lista, codigo).pendienteValidacion).withContext(codigo).toBeTrue();
    }
    expect(accion(lista, 'REMISION_COMPETENCIA').ejecutable).toBeTrue();
  });

  it('con la gestión finalizada nada es ejecutable', () => {
    expect(catalogoParaCaso('INSTRUCCION', 'EQUIPO_3', 'FINALIZADA').some((a) => a.ejecutable)).toBeFalse();
  });

  describe('validarActuaciones', () => {
    const catalogo = catalogoParaCaso('INSTRUCCION', 'EQUIPO_3', 'ACTIVA');

    it('acepta varias ordinarias de la fase y observaciones vacías (son opcionales)', () => {
      expect(validarActuaciones(['PRACTICA_PRUEBAS', 'PLIEGO_CARGOS'], null, catalogo, 2000)).toEqual({});
    });

    it('rechaza mezclar una permanente con ordinarias (decisiones incompatibles)', () => {
      expect(esPermanente('FINALIZAR_INSTRUCCION')).toBeTrue();
      expect(validarActuaciones(['PLIEGO_CARGOS', 'FINALIZAR_INSTRUCCION'], null, catalogo, 2000)['actuaciones']).toBeTruthy();
    });

    it('rechaza actuaciones de otra fase o equipo', () => {
      expect(validarActuaciones(['FALLO'], null, catalogo, 2000)['actuaciones']).toContain('Fallo');
      expect(validarActuaciones(['AVERIGUACIONES_PRELIMINARES'], null, catalogo, 2000)['actuaciones']).toBeTruthy();
    });

    it('exige al menos una actuación', () => {
      expect(validarActuaciones([], null, catalogo, 2000)['actuaciones']).toBeTruthy();
    });
  });
});
