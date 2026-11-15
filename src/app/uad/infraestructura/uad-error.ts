import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponseUad } from '../contratos/uad-api.types';

/**
 * Error del módulo UAD ya traducido para la interfaz. Lo producen **igual** el adaptador HTTP y el
 * mock (ambos pasan por `interpretarErrorUad`), así la página no sabe cuál está activo.
 *
 * Lee el formato real del backend (`ErrorResponse`: `message`; `ValidationErrorResponse`:
 * `validationErrors`) y el campo `codigo` propuesto en el contrato. Validación = 400 (el backend no usa 422).
 */
export type TipoErrorUad = 'sin-sesion' | 'sin-permiso' | 'no-encontrado' | 'conflicto' | 'validacion' | 'red' | 'servidor';

export interface ErrorUad {
  readonly estado: number;
  readonly tipo: TipoErrorUad;
  readonly codigo: string | null;
  readonly mensaje: string;
  /** Ruta del campo en el cuerpo (`solicitudInformacion.fechaLimite`) → mensaje. */
  readonly camposInvalidos: Readonly<Record<string, string>>;
}

/** Textos sin culpa ni jerga, que dicen qué hacer (mismo criterio que `alma-error.ts`). */
const MENSAJES_POR_CODIGO: Record<string, string> = {
  CONFLICTO_VERSION: 'Otra persona modificó esta noticia mientras usted la evaluaba. Cargamos la versión más reciente; revísela antes de decidir.',
  NOTICIA_YA_DECIDIDA: 'Otra persona ya registró una decisión sobre esta noticia. Cargamos su estado actual.',
  NOTICIA_RECLASIFICADA: 'La noticia fue reclasificada y ya no corresponde a su equipo.',
  NOTICIA_NO_EVALUABLE: 'Esta noticia ya no está en evaluación preliminar, por eso no admite esta acción.',
  DECISION_INCOMPATIBLE: 'Registre una sola decisión por vez.',
  SIN_EQUIPO_UAD: 'Su usuario no tiene un equipo UAD asignado. Pida a la administración que revise su perfil.'
};

const MENSAJES_POR_ESTADO: Record<number, string> = {
  0: 'No pudimos conectar con el servidor. Revise su conexión; lo que escribió sigue en pantalla.',
  401: 'Su sesión terminó. Inicie sesión de nuevo para continuar.',
  403: 'Su perfil no tiene permiso para esta información o acción.',
  404: 'No encontramos la noticia. Es posible que ya no esté en su bandeja.',
  409: 'La información cambió mientras trabajaba. Cargamos la versión más reciente.'
};

const MENSAJE_SERVIDOR = 'Tuvimos un problema de nuestro lado. Intente de nuevo en unos minutos; lo que escribió no se perdió.';
const MENSAJE_GENERICO = 'No pudimos completar la acción. Revise los datos e intente de nuevo.';

function tipoPorEstado(estado: number): TipoErrorUad {
  if (estado === 0) return 'red';
  if (estado === 401) return 'sin-sesion';
  if (estado === 403) return 'sin-permiso';
  if (estado === 404) return 'no-encontrado';
  if (estado === 409) return 'conflicto';
  if (estado === 400 || estado === 422) return 'validacion';
  return 'servidor';
}

export function esErrorUad(valor: unknown): valor is ErrorUad {
  return !!valor && typeof valor === 'object' && !(valor instanceof HttpErrorResponse) && 'tipo' in valor && 'camposInvalidos' in valor;
}

/** Traduce cualquier error al modelo `ErrorUad`. Idempotente. */
export function interpretarErrorUad(error: unknown): ErrorUad {
  if (esErrorUad(error)) return error;
  if (!(error instanceof HttpErrorResponse)) {
    return { estado: 0, tipo: 'servidor', codigo: null, mensaje: MENSAJE_GENERICO, camposInvalidos: {} };
  }
  const estado = error.status;
  const cuerpo = (error.error && typeof error.error === 'object' ? error.error : {}) as Partial<ErrorResponseUad>;
  const codigo = typeof cuerpo.codigo === 'string' ? cuerpo.codigo : null;
  const tipo = tipoPorEstado(estado);

  let mensaje: string;
  if (codigo && MENSAJES_POR_CODIGO[codigo]) mensaje = MENSAJES_POR_CODIGO[codigo];
  else if (estado >= 500) mensaje = MENSAJE_SERVIDOR;
  else if (tipo === 'validacion' && typeof cuerpo.message === 'string' && cuerpo.message) mensaje = cuerpo.message;
  else mensaje = MENSAJES_POR_ESTADO[estado] ?? MENSAJE_GENERICO;

  const camposInvalidos: Record<string, string> = {};
  for (const [campo, texto] of Object.entries(cuerpo.validationErrors ?? {})) {
    if (typeof texto === 'string') camposInvalidos[campo] = texto;
  }
  return { estado, tipo, codigo, mensaje, camposInvalidos };
}
