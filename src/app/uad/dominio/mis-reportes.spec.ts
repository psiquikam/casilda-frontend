import { EstadoNoticia } from '../contratos/uad-api.types';
import { ErrorUad } from '../infraestructura/uad-error';
import { LIMITE_RESPUESTA_SOLICITUD, estadoParaReportante, mensajeParaReportante, validarRespuestaSolicitud } from './mis-reportes';

function error(parcial: Partial<ErrorUad>): ErrorUad {
  return { estado: 500, tipo: 'servidor', codigo: null, mensaje: 'x', camposInvalidos: {}, ...parcial };
}

describe('UAD · reglas de «Mis reportes»', () => {
  it('la respuesta es obligatoria y tiene tope', () => {
    expect(validarRespuestaSolicitud('   ')).toBe('Escriba su respuesta.');
    expect(validarRespuestaSolicitud('x'.repeat(LIMITE_RESPUESTA_SOLICITUD + 1))).toContain(String(LIMITE_RESPUESTA_SOLICITUD));
    expect(validarRespuestaSolicitud('x'.repeat(LIMITE_RESPUESTA_SOLICITUD))).toBeNull();
    expect(validarRespuestaSolicitud('Ocurrió el 3 de noviembre.')).toBeNull();
  });

  it('el estado para la persona no revela la decisión interna', () => {
    expect(estadoParaReportante('INHIBITORIA')).toBe('Revisión finalizada');
    expect(estadoParaReportante('REMITIDA_POR_COMPETENCIA')).toBe('Revisión finalizada');
    expect(estadoParaReportante('PENDIENTE_SUBSANACION')).toBe('Información adicional solicitada');
    const todos: EstadoNoticia[] = [
      'RECIBIDA',
      'PENDIENTE_CLASIFICACION',
      'EN_EVALUACION_PRELIMINAR',
      'PENDIENTE_SUBSANACION',
      'SUBSANACION_RECIBIDA',
      'EN_REEVALUACION',
      'INHIBITORIA',
      'REMITIDA_POR_COMPETENCIA',
      'PROCEDE_TRAMITE'
    ];
    for (const e of todos) {
      expect(estadoParaReportante(e)).withContext(e).not.toMatch(/inhibitori|remi|clasific|subsanaci|equipo/i);
    }
  });

  it('los mensajes de error no usan términos del personal de la UAD', () => {
    const casos: ErrorUad[] = [
      error({ estado: 404, tipo: 'no-encontrado' }),
      error({ estado: 409, tipo: 'conflicto', codigo: 'CONFLICTO_VERSION' }),
      error({ estado: 409, tipo: 'conflicto', codigo: 'SOLICITUD_YA_RESPONDIDA' }),
      error({ estado: 409, tipo: 'conflicto', codigo: 'SOLICITUD_NO_VIGENTE' }),
      error({ estado: 403, tipo: 'sin-permiso' }),
      error({ estado: 401, tipo: 'sin-sesion' }),
      error({ estado: 0, tipo: 'red' }),
      error({ estado: 400, tipo: 'validacion' }),
      error({})
    ];
    for (const e of casos) {
      const mensaje = mensajeParaReportante(e);
      expect(mensaje.length).toBeGreaterThan(0);
      expect(mensaje).withContext(e.codigo ?? e.tipo).not.toMatch(/bandeja|equipo|noticia|evalua/i);
    }
    expect(mensajeParaReportante(error({ estado: 404, tipo: 'no-encontrado' }))).toBe('No encontramos este reporte entre los suyos.');
  });
});
