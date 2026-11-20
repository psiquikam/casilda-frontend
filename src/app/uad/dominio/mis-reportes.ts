import { EstadoNoticia } from '../contratos/uad-api.types';
import { ErrorUad } from '../infraestructura/uad-error';

/** Máximo de la respuesta a la solicitud de información (igual que `UadMisReportesService.LIMITE_RESPUESTA`). */
export const LIMITE_RESPUESTA_SOLICITUD = 4000;

/** Error del texto de la respuesta, o `null` si es válido. La misma regla la aplica el servidor. */
export function validarRespuestaSolicitud(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return 'Escriba su respuesta.';
  if (limpio.length > LIMITE_RESPUESTA_SOLICITUD) return `Máximo ${LIMITE_RESPUESTA_SOLICITUD} caracteres.`;
  return null;
}

/**
 * Estado en lenguaje para la persona usuaria. **Lo redacta el servidor**; esta copia solo alimenta el
 * mock y debe coincidir con `UadMisReportesService.estadoParaReportante` (PROVISIONAL, D-UAD-32).
 * No distingue inhibitoria de remisión ni revela pasos internos.
 */
export function estadoParaReportante(estado: EstadoNoticia): string {
  switch (estado) {
    case 'RECIBIDA':
    case 'PENDIENTE_CLASIFICACION':
      return 'Recibido';
    case 'EN_EVALUACION_PRELIMINAR':
    case 'SUBSANACION_RECIBIDA':
    case 'EN_REEVALUACION':
      return 'En revisión';
    case 'PENDIENTE_SUBSANACION':
      return 'Información adicional solicitada';
    case 'PROCEDE_TRAMITE':
      return 'En trámite';
    case 'INHIBITORIA':
    case 'REMITIDA_POR_COMPETENCIA':
      return 'Revisión finalizada';
  }
}

const MENSAJES_POR_CODIGO: Record<string, string> = {
  SOLICITUD_YA_RESPONDIDA: 'Esta solicitud ya tiene una respuesta registrada. Le mostramos el estado actual.',
  SOLICITUD_NO_VIGENTE: 'Esta solicitud ya no está pendiente de respuesta. Le mostramos el estado actual.',
  CONFLICTO_VERSION: 'El reporte cambió mientras escribía. Le mostramos el estado actual; su texto sigue en pantalla.',
  EVIDENCIAS_NO_HABILITADAS: 'Por ahora la respuesta solo admite texto.'
};

/**
 * Mensaje de error para quien radicó el reporte. Los textos generales de `uad-error.ts` hablan de
 * «bandeja» y «equipo», que son términos del personal de la UAD.
 */
export function mensajeParaReportante(e: ErrorUad): string {
  if (e.codigo && MENSAJES_POR_CODIGO[e.codigo]) return MENSAJES_POR_CODIGO[e.codigo];
  switch (e.tipo) {
    case 'sin-sesion':
      return 'Su sesión terminó. Inicie sesión de nuevo para continuar.';
    case 'sin-permiso':
      return 'Su perfil no tiene acceso a esta sección.';
    case 'no-encontrado':
      return 'No encontramos este reporte entre los suyos.';
    case 'conflicto':
      return 'El reporte cambió mientras escribía. Le mostramos el estado actual; su texto sigue en pantalla.';
    case 'red':
      return 'No pudimos conectar con el servidor. Revise su conexión; lo que escribió sigue en pantalla.';
    case 'validacion':
      return 'Revise el texto de su respuesta e intente de nuevo.';
    case 'servidor':
      return 'Tuvimos un problema de nuestro lado. Intente de nuevo en unos minutos; lo que escribió no se perdió.';
  }
}
