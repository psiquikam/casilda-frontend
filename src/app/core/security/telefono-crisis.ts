/**
 * Validación de los números telefónicos de **contenido de crisis**.
 *
 * En Casilda un teléfono de orientación no es un dato más: si una persona en
 * riesgo marca un número de relleno, no recibe ayuda. Por eso la regla no es
 * «mostrar lo que haya configurado» sino **mostrar solo lo que sea publicable**,
 * y ante la duda no mostrar nada (ver `DASHBOARDS_POR_ROL.md` DSH-05-01 y la
 * regla 4 del skill `casilda-ux`).
 *
 * Este módulo no valida que el número exista: valida que **no sea un marcador**.
 * El dato real lo aporta `environment.telefonoOrientacion`.
 */

/**
 * Longitud mínima de una racha consecutiva para considerarla un marcador.
 * Siete evita descartar líneas cortas legítimas (123, 155) y a la vez detecta
 * los rellenos típicos aunque lleguen con prefijo de país o separadores.
 */
const LONGITUD_RACHA_SOSPECHOSA = 7;

/** Dígitos mínimos para considerar siquiera un valor marcable. */
const MINIMO_DIGITOS_MARCABLES = 3;

/**
 * Textos de relleno habituales en configuraciones a medio completar.
 * Se comparan sobre el valor en minúsculas, sin espacios.
 */
const MARCADORES_TEXTUALES = ['pendiente', 'porconfirmar', 'todo', 'tbd', 'na', 'n/a', 'xxx', 'number', 'telefono'];

/** Devuelve solo los dígitos del valor. */
function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** `true` si todos los dígitos son el mismo (0000000000, 1111111111…). */
function esRepeticionDeUnDigito(digitos: string): boolean {
  return digitos.length > 1 && new Set(digitos).size === 1;
}

/**
 * `true` si en cualquier posición hay una racha de dígitos que avanza o
 * retrocede de uno en uno, con cierre decimal (…8, 9, 0, 1…).
 *
 * Se busca la racha *dentro* del número, no sobre el total, para que un relleno
 * no se disfrace añadiéndole un prefijo: «+57 123 456 7890» contiene la racha
 * 1234567890 y se rechaza igual que «1234567890».
 */
function contieneRachaConsecutiva(digitos: string): boolean {
  const avanzaUno = (anterior: string, actual: string, paso: number): boolean =>
    Number(actual) === (Number(anterior) + paso + 10) % 10;

  for (const paso of [1, -1]) {
    let racha = 1;
    for (let i = 1; i < digitos.length; i++) {
      racha = avanzaUno(digitos[i - 1], digitos[i], paso) ? racha + 1 : 1;
      if (racha >= LONGITUD_RACHA_SOSPECHOSA) return true;
    }
  }

  return false;
}

/**
 * Indica si un teléfono de crisis puede mostrarse a una persona usuaria.
 *
 * Rechaza: valores vacíos, textos de relleno, valores sin dígitos marcables,
 * repeticiones de un mismo dígito y secuencias consecutivas.
 */
export function esTelefonoPublicable(valor: string | null | undefined): boolean {
  if (!valor) return false;

  const normalizado = valor.trim();
  if (!normalizado) return false;

  if (MARCADORES_TEXTUALES.includes(normalizado.toLowerCase().replace(/[\s.-]/g, ''))) return false;

  const digitos = soloDigitos(normalizado);
  if (digitos.length < MINIMO_DIGITOS_MARCABLES) return false;
  if (esRepeticionDeUnDigito(digitos)) return false;
  if (contieneRachaConsecutiva(digitos)) return false;

  return true;
}
