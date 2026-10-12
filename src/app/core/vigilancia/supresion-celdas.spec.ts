import {
  hayCeldasSuprimidas,
  suprimirCeldasPequenas,
  UMBRAL_SUPRESION
} from './supresion-celdas';

/**
 * La supresión protege a personas concretas: un conteo de dos casos en una
 * dependencia pequeña es un nombre deducible. Estas pruebas fijan que no se
 * pueda publicar por descuido (DSH-03-04, DSH-09-01).
 */
describe('supresión de celdas pequeñas', () => {
  it('no suprime nada cuando todos los conteos superan el umbral', () => {
    const celdas = [
      { etiqueta: 'A', casos: 40 },
      { etiqueta: 'B', casos: 30 },
      { etiqueta: 'C', casos: 20 }
    ];

    const resultado = suprimirCeldasPequenas(celdas, 90);

    expect(hayCeldasSuprimidas(resultado)).toBeFalse();
    expect(resultado.map((c) => c.casos)).toEqual([40, 30, 20]);
  });

  it('suprime el conteo que queda por debajo del umbral', () => {
    const celdas = [
      { etiqueta: 'A', casos: 40 },
      { etiqueta: 'B', casos: 30 },
      { etiqueta: 'C', casos: 2 }
    ];

    const resultado = suprimirCeldasPequenas(celdas, 72);

    expect(resultado[2].suprimida).toBeTrue();
    expect(resultado[2].casos).toBeNull();
    expect(resultado[2].proporcion).toBeNull();
  });

  it('aplica supresión secundaria: con una sola celda oculta el valor se deduce restando', () => {
    const celdas = [
      { etiqueta: 'A', casos: 40 },
      { etiqueta: 'B', casos: 30 },
      { etiqueta: 'C', casos: 2 }
    ];

    const resultado = suprimirCeldasPequenas(celdas, 72);
    const suprimidas = resultado.filter((c) => c.suprimida);

    // Sin la segunda supresión, 72 − 40 − 30 = 2 revelaría la celda oculta.
    expect(suprimidas.length).toBeGreaterThanOrEqual(2);
    expect(resultado[1].suprimida).toBeTrue();
  });

  it('no suprime los grupos sin casos: un cero no identifica a nadie', () => {
    const celdas = [
      { etiqueta: 'A', casos: 40 },
      { etiqueta: 'B', casos: 20 },
      { etiqueta: 'C', casos: 0 }
    ];

    const resultado = suprimirCeldasPequenas(celdas, 60);

    expect(resultado[2].suprimida).toBeFalse();
    expect(resultado[2].casos).toBe(0);
  });

  it('calcula la proporción sobre el total de las celdas publicables', () => {
    const resultado = suprimirCeldasPequenas(
      [
        { etiqueta: 'A', casos: 75 },
        { etiqueta: 'B', casos: 25 }
      ],
      100
    );

    expect(resultado[0].proporcion).toBeCloseTo(0.75);
    expect(resultado[1].proporcion).toBeCloseTo(0.25);
  });

  it('usa el umbral del contrato por defecto', () => {
    expect(UMBRAL_SUPRESION).toBe(5);
  });

  it('acepta un umbral distinto sin tocar el resto de la lógica', () => {
    const celdas = [
      { etiqueta: 'A', casos: 40 },
      { etiqueta: 'B', casos: 12 },
      { etiqueta: 'C', casos: 8 }
    ];

    const resultado = suprimirCeldasPequenas(celdas, 60, 10);

    expect(resultado[2].suprimida).toBeTrue();
  });
});
