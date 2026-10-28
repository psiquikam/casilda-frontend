/**
 * Catálogo del gestor de contenidos del home: **único lugar** con las secciones,
 * los destinos de enlace permitidos y los límites que comparten la portada
 * pública (`CasildaHomeComponent`) y el módulo de administración
 * (`/gestion-contenidos`).
 *
 * Los valores replican lo que valida el backend (`ContenidoRequest` y
 * `ContenidoImagenStorageService`) y el contrato
 * `docs/contratos/contrato-contenidos-home.md` (§3.2, §5). Si el backend cambia
 * un límite, se cambia aquí y ambas superficies quedan alineadas.
 */

/** Bloque de la portada donde se ubica una tarjeta. Enumerado cerrado (§5.3). */
export type SeccionContenido = 'acciones' | 'informacion';

export interface SeccionContenidoInfo {
  readonly valor: SeccionContenido;
  /** Título del bloque tal como se lee en la portada (`h2`). */
  readonly titulo: string;
  /** Explicación para quien administra: qué tipo de tarjeta va aquí. */
  readonly descripcion: string;
  readonly icono: string;
}

/** En el orden en que aparecen en la portada. */
export const SECCIONES_CONTENIDO: readonly SeccionContenidoInfo[] = [
  {
    valor: 'acciones',
    titulo: 'Opciones de atención y gestión',
    descripcion: 'Rutas de atención que la persona puede iniciar. Lo usual es que lleven a una página.',
    icono: 'touch_app'
  },
  {
    valor: 'informacion',
    titulo: 'Información de interés general',
    descripcion: 'Contenido divulgativo para leer, sin acción asociada.',
    icono: 'info'
  }
];

export function seccionInfo(valor: string): SeccionContenidoInfo | undefined {
  return SECCIONES_CONTENIDO.find((seccion) => seccion.valor === valor);
}

export interface DestinoEnlace {
  /** Ruta interna de la SPA, o `null` para una tarjeta informativa. */
  readonly ruta: string | null;
  readonly etiqueta: string;
}

/**
 * Destinos que se ofrecen al crear una tarjeta. Solo rutas **públicas**: una
 * ruta protegida rebotaría a la persona anónima contra los guards (§5.2).
 * El backend solo exige que empiece por `/`; esta lista evita el texto libre.
 */
export const DESTINOS_ENLACE: readonly DestinoEnlace[] = [
  { ruta: null, etiqueta: 'Ninguno: tarjeta informativa' },
  { ruta: '/formulario-anonimo', etiqueta: 'Reporte anónimo de VBG' },
  { ruta: '/login', etiqueta: 'Iniciar sesión' },
  { ruta: '/home', etiqueta: 'Inicio (portada)' }
];

export function etiquetaDestino(ruta: string | null | undefined): string {
  const destino = DESTINOS_ENLACE.find((d) => d.ruta === (ruta || null));
  return destino?.etiqueta ?? `Otra ruta: ${ruta}`;
}

/** Límites de texto. El título lo impone el backend; el contenido, la tarjeta (§3.2). */
export const LIMITE_TITULO = 160;
/** Por encima de este largo el título se parte en demasiadas líneas en la tarjeta. */
export const TITULO_RECOMENDADO = 80;
export const LIMITE_CONTENIDO = 300;

/** Imagen de la tarjeta: formatos y peso que acepta el backend. */
export const IMAGEN_TIPOS_PERMITIDOS: readonly string[] = ['image/png', 'image/webp', 'image/svg+xml'];
export const IMAGEN_EXTENSIONES = '.png,.webp,.svg';
export const IMAGEN_TAMANO_MAXIMO_BYTES = 400 * 1024;

/**
 * Imagen de respaldo cuando un contenido no tiene imagen (el backend la
 * permite opcional) o la suya no carga: una tarjeta con el ícono de imagen rota
 * en la portada de un servicio VBG transmite descuido.
 */
export const IMAGEN_RESPALDO = 'assets/distintivo_casilda_morado.svg';
