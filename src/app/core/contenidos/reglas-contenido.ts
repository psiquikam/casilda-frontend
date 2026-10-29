import { IMAGEN_RESPALDO } from './catalogo-contenidos';

/**
 * Reglas puras del gestor de contenidos del home, sin dependencias de Angular,
 * para que la portada y el módulo de administración decidan lo mismo y se
 * prueben sin `TestBed`.
 */

/** Lo mínimo que se necesita para evaluar la vigencia de un contenido. */
export interface ConVigencia {
  vigenciaInicio: string;
  vigenciaFin?: string | null;
}

/**
 * Estado de publicación en un instante:
 * - `vigente`: se ve en la portada.
 * - `programado`: aún no empieza (`vigenciaInicio` en el futuro).
 * - `vencido`: ya terminó (`vigenciaFin` en el pasado).
 *
 * Una fecha de inicio ilegible cuenta como `programado`: nunca se publica algo
 * cuya vigencia no se puede verificar.
 */
export type EstadoVigencia = 'vigente' | 'programado' | 'vencido';

export function estadoVigencia(contenido: ConVigencia, referencia: Date = new Date()): EstadoVigencia {
  const ahora = referencia.getTime();
  const inicio = new Date(contenido.vigenciaInicio).getTime();
  if (Number.isNaN(inicio) || inicio > ahora) return 'programado';

  if (!contenido.vigenciaFin) return 'vigente';
  const fin = new Date(contenido.vigenciaFin).getTime();
  return Number.isNaN(fin) || fin >= ahora ? 'vigente' : 'vencido';
}

/** Indica si un contenido está vigente en la fecha dada (contrato §4). */
export function estaVigente(contenido: ConVigencia, referencia: Date = new Date()): boolean {
  return estadoVigencia(contenido, referencia) === 'vigente';
}

/**
 * Convierte el campo `imagen` en una URL utilizable en `<img [src]>`.
 *
 * El backend guarda las imágenes subidas como ruta **relativa a la API**
 * (`/contenidos/imagenes/<uuid>.svg`, ver `ContenidoImagenStorageService`). Si se
 * enlaza tal cual, el navegador la resuelve contra el dominio del frontend y la
 * imagen no carga. Las rutas `assets/…` (semilla versionada en el frontend), las
 * absolutas `https:` y las `blob:` de una vista previa local se usan sin cambios.
 * Sin imagen se usa el respaldo institucional.
 */
export function resolverImagenContenido(imagen: string | null | undefined, apiBaseUrl: string): string {
  const valor = imagen?.trim();
  if (!valor) return IMAGEN_RESPALDO;
  if (/^(https?:|blob:|data:image\/)/i.test(valor) || valor.startsWith('assets/')) return valor;
  if (valor.startsWith('/') && !valor.startsWith('//')) return `${apiBaseUrl.replace(/\/+$/, '')}${valor}`;
  return IMAGEN_RESPALDO;
}

/**
 * Un enlace solo es navegable si es una ruta interna de la SPA: empieza por una
 * única `/` (`//dominio` sería una URL externa relativa al protocolo). Lo demás
 * se pinta como tarjeta informativa en lugar de llevar a la persona a un 404.
 */
export function esEnlaceInterno(enlace: string | null | undefined): enlace is string {
  return typeof enlace === 'string' && /^\/(?!\/)\S*$/.test(enlace.trim());
}

/** Fecha local a medianoche, para convertir el valor del datepicker en el inicio de vigencia. */
export function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
}

/**
 * Último instante del día local: quien escribe «hasta el 30 de noviembre»
 * espera que la tarjeta siga visible durante todo el 30.
 */
export function finDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);
}

export function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
