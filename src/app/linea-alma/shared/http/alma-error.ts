import { HttpErrorResponse } from '@angular/common/http';

/**
 * Modelo de error estándar de Línea Alma (H-0.2, F7).
 *
 * El Backend responde `{ codigo, mensaje, detalles }` (A.1). Aquí se traduce a un tipo que la
 * interfaz puede ramificar sin conocer códigos HTTP, y a un **mensaje en lenguaje neutro y no
 * revictimizante** (H-3.3): sin culpa, sin jerga técnica y diciendo qué hacer.
 */
export type TipoErrorAlma =
  | 'sin-sesion'
  | 'sin-permiso'
  | 'no-encontrado'
  | 'conflicto'
  | 'regla-negocio'
  | 'validacion'
  | 'red'
  | 'servidor';

export interface ErrorAlma {
  readonly estado: number;
  readonly tipo: TipoErrorAlma;
  readonly codigo: string | null;
  readonly mensaje: string;
  readonly detalles: Record<string, unknown>;
  /** Mensaje por campo cuando el 400/422 trae `detalles` o `validationErrors`. */
  readonly camposInvalidos: Record<string, string>;
}

/** Códigos de negocio conocidos (Anexo A.3) → texto para la persona usuaria. */
const MENSAJES_POR_CODIGO: Record<string, string> = {
  CONSENTIMIENTO_REQUERIDO:
    'Para continuar necesitamos registrar que la persona dio su consentimiento. Revise ese paso y vuelva a intentarlo.',
  REMISION_YA_TOMADA: 'Otra persona del equipo ya tomó esta remisión. Actualizamos la lista para que vea cuáles siguen disponibles.',
  NOVEDAD_YA_TOMADA: 'Otra persona del equipo ya tomó esta novedad. Actualizamos la lista para que vea cuáles siguen disponibles.',
  CONFLICTO_VERSION:
    'Alguien más modificó esta atención mientras usted la editaba. Cargamos la versión más reciente; revise los cambios y repita la acción.',
  ATENCION_NO_EDITABLE: 'Esta atención ya no se puede modificar porque cambió de estado.',
  TRIAJE_REQUERIDO: 'Indique el triaje o registre el motivo por el que se omite para poder continuar.',
  ATENCION_INCOMPLETA: 'Faltan datos para continuar. Revise los campos marcados.',
  RUTAS_PENDIENTES: 'Aún hay rutas externas en curso. Ciérrelas o registre su resultado antes de cerrar la atención.',
  PSICOLOGIA_PENDIENTE: 'La atención está en la cola de Psicología, por eso no se puede cerrar desde aquí.',
  PERSONA_SIN_CASO_CERRADO: 'No encontramos un caso cerrado para esta persona, por eso no se puede registrar la contención.',
  // Psicología (J-1.x; contrato `contrato-psicologia-*.md`).
  NOVEDAD_NO_TOMADA: 'Para registrar acciones sobre esta novedad primero debe tomarla desde la bandeja.',
  NOVEDAD_CERRADA: 'Esta novedad ya no está pendiente: no admite nuevas acciones.',
  INTENTOS_AGOTADOS: 'Ya se registraron los 9 intentos del protocolo. El sistema cerró la novedad por «No contacto».',
  CASO_ACTIVO_EXISTENTE: 'La persona ya tiene un caso activo. Confirme si desea vincular esta atención o abrir un caso nuevo.',
  CASO_CERRADO: 'El caso está cerrado y no admite cambios. Si la persona vuelve a comunicarse, registre una contención después del cierre.',
  CASO_NO_ENCONTRADO: 'No encontramos el caso. Revise el número o vuelva a la bandeja.',
  NOVEDAD_NO_ENCONTRADA: 'No encontramos la novedad. Es posible que todavía no haya sido derivada a Psicología.',
  RECONTACTO_YA_RESUELTO: 'Este recontacto ya fue resuelto. Actualizamos la lista.',
  PDF_NO_DISPONIBLE: 'El PDF del caso todavía no está disponible. Intente de nuevo en unos minutos.'
};

const MENSAJES_POR_ESTADO: Record<number, string> = {
  0: 'No pudimos conectar con el servidor. Revise su conexión; lo que escribió sigue en pantalla.',
  401: 'Su sesión terminó. Inicie sesión de nuevo para continuar.',
  403: 'Su perfil no tiene permiso para esta acción.',
  404: 'No encontramos lo que buscaba. Es posible que ya no exista o que el código esté mal escrito.',
  409: 'La información cambió mientras trabajaba. Cargamos la versión más reciente.',
  422: 'No fue posible completar la acción con los datos actuales. Revise la información e intente de nuevo.'
};

const MENSAJE_SERVIDOR = 'Tuvimos un problema de nuestro lado. Intente de nuevo en unos minutos; lo que escribió no se perdió.';
const MENSAJE_GENERICO = 'No pudimos completar la acción. Revise los datos e intente de nuevo.';

function tipoPorEstado(estado: number): TipoErrorAlma {
  if (estado === 0) return 'red';
  if (estado === 401) return 'sin-sesion';
  if (estado === 403) return 'sin-permiso';
  if (estado === 404) return 'no-encontrado';
  if (estado === 409) return 'conflicto';
  if (estado === 422) return 'regla-negocio';
  if (estado === 400) return 'validacion';
  return 'servidor';
}

function extraerCamposInvalidos(cuerpo: Record<string, unknown>): Record<string, string> {
  // Formato del contrato de Alma: `detalles: { campo: 'mensaje' }`; formato del resto del backend: `validationErrors`.
  const candidatos = [cuerpo['validationErrors'], cuerpo['detalles']];
  for (const candidato of candidatos) {
    if (candidato && typeof candidato === 'object') {
      const campos: Record<string, string> = {};
      for (const [clave, valor] of Object.entries(candidato as Record<string, unknown>)) {
        if (typeof valor === 'string') campos[clave] = valor;
      }
      if (Object.keys(campos).length > 0) return campos;
    }
  }
  return {};
}

/** Traduce cualquier error HTTP (o ya traducido) al modelo estándar. Idempotente. */
export function interpretarErrorAlma(error: unknown): ErrorAlma {
  if (esErrorAlma(error)) return error;

  if (!(error instanceof HttpErrorResponse)) {
    return { estado: 0, tipo: 'servidor', codigo: null, mensaje: MENSAJE_GENERICO, detalles: {}, camposInvalidos: {} };
  }

  const estado = error.status;
  const cuerpo = (error.error && typeof error.error === 'object' ? error.error : {}) as Record<string, unknown>;
  const codigo = typeof cuerpo['codigo'] === 'string' ? cuerpo['codigo'] : null;
  const mensajeServidor =
    typeof cuerpo['mensaje'] === 'string' ? cuerpo['mensaje'] : typeof cuerpo['message'] === 'string' ? cuerpo['message'] : null;
  const tipo = tipoPorEstado(estado);

  let mensaje: string;
  if (codigo && MENSAJES_POR_CODIGO[codigo]) {
    mensaje = MENSAJES_POR_CODIGO[codigo];
  } else if (estado >= 500) {
    mensaje = MENSAJE_SERVIDOR;
  } else if ((estado === 400 || estado === 422) && mensajeServidor) {
    // El mensaje de validación lo redacta el Backend en español (contrato §Errores).
    mensaje = mensajeServidor;
  } else {
    mensaje = MENSAJES_POR_ESTADO[estado] ?? MENSAJE_GENERICO;
  }

  const detalles =
    cuerpo['detalles'] && typeof cuerpo['detalles'] === 'object' ? (cuerpo['detalles'] as Record<string, unknown>) : {};

  return { estado, tipo, codigo, mensaje, detalles, camposInvalidos: extraerCamposInvalidos(cuerpo) };
}

export function esErrorAlma(valor: unknown): valor is ErrorAlma {
  return (
    !!valor &&
    typeof valor === 'object' &&
    !(valor instanceof HttpErrorResponse) &&
    'tipo' in valor &&
    'estado' in valor &&
    'camposInvalidos' in valor
  );
}
