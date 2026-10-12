/**
 * Supresión de celdas pequeñas en las vistas de vigilancia.
 *
 * Un conteo agregado deja de ser anónimo cuando es lo bastante pequeño: si al
 * filtrar por sede y dependencia una categoría de identidad de género queda con
 * dos casos, cualquiera que conozca esa dependencia puede deducir de quién se
 * trata. Es el mismo criterio que aplican las oficinas de estadística públicas,
 * y aquí importa más que en ninguna otra parte: los datos son de personas que
 * atraviesan violencias (DSH-03-04, DSH-09-01, DSH-P6).
 *
 * **[PENDIENTE P-06]** El umbral está sin confirmar por el equipo. Se usa **5**
 * porque es el valor que el propio contrato propone como ejemplo
 * («p. ej. mostrar "< 5"») y el más extendido en estadística oficial. Cambiarlo
 * es cambiar esta constante.
 */
export const UMBRAL_SUPRESION = 5;

/** Texto que sustituye a un conteo suprimido. */
export const ETIQUETA_SUPRIMIDA = `< ${UMBRAL_SUPRESION}`;

export interface CeldaConteo {
  readonly etiqueta: string;
  readonly casos: number;
}

export interface CeldaPublicable {
  readonly etiqueta: string;
  /** Conteo real, o `null` si se suprimió. */
  readonly casos: number | null;
  /** Proporción sobre el total visible, o `null` si se suprimió. */
  readonly proporcion: number | null;
  readonly suprimida: boolean;
}

/**
 * Aplica supresión a un conjunto de conteos.
 *
 * No basta con ocultar la celda pequeña: si se publican el resto de celdas y el
 * total, el valor suprimido se recupera restando. Por eso, cuando hay una sola
 * celda por debajo del umbral, **se suprime también la siguiente más pequeña**
 * (supresión secundaria). Sin eso la supresión es decorativa.
 */
export function suprimirCeldasPequenas(
  celdas: readonly CeldaConteo[],
  total: number,
  umbral: number = UMBRAL_SUPRESION
): readonly CeldaPublicable[] {
  const indicesSuprimidos = new Set<number>();

  celdas.forEach((celda, indice) => {
    if (celda.casos > 0 && celda.casos < umbral) indicesSuprimidos.add(indice);
  });

  // Supresión secundaria: con una sola celda oculta, su valor es deducible por
  // diferencia contra el total.
  if (indicesSuprimidos.size === 1) {
    const candidatas = celdas
      .map((celda, indice) => ({ indice, casos: celda.casos }))
      .filter(({ indice }) => !indicesSuprimidos.has(indice))
      .sort((a, b) => a.casos - b.casos);

    if (candidatas.length > 0) indicesSuprimidos.add(candidatas[0].indice);
  }

  return celdas.map((celda, indice) => {
    const suprimida = indicesSuprimidos.has(indice);
    return {
      etiqueta: celda.etiqueta,
      casos: suprimida ? null : celda.casos,
      proporcion: suprimida || total === 0 ? null : celda.casos / total,
      suprimida
    };
  });
}

/** `true` si algún conteo del conjunto quedó suprimido. */
export function hayCeldasSuprimidas(celdas: readonly CeldaPublicable[]): boolean {
  return celdas.some((celda) => celda.suprimida);
}
