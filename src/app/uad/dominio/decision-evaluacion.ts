import {
  ContinuarTramiteDatos,
  DecisionEvaluacionRequest,
  FaseProcesoRemision,
  ModoCaso,
  TipoDecision,
  TipoNoticia
} from '../contratos/uad-api.types';

/**
 * Reglas puras de la decisión de evaluación preliminar (UAD-EVA-02 a 12, UAD-REM-01 a 06).
 *
 * Las usan la página (validación previa al envío) y el adaptador mock (que simula la validación del
 * servidor). **El servidor real debe aplicar las mismas reglas por su cuenta**: compartirlas aquí no
 * convierte al cliente en autoridad.
 */

export const LIMITE_TEXTO_DECISION = 2000;
export const MINIMO_INFORMACION_REQUERIDA = 10;
export const LIMITE_EXPEDIENTE_UAD = 40;

/**
 * PROVISIONAL (D-UAD-13): la justificación de la decisión inhibitoria es obligatoria solo porque así
 * aparece en el prototipo (PANTALLAZOS p. 8). La bitácora no lo define y la inhibitoria está en sus
 * pendientes jurídicos (§16). Cambiar a `false` si UAD jurídica lo decide así.
 */
export const JUSTIFICACION_INHIBITORIO_OBLIGATORIA = true;

/** Valores crudos del formulario (todo opcional; se normaliza en `construirDecision`). */
export interface ValoresDecision {
  readonly observaciones?: string | null;
  readonly modoCaso?: ModoCaso | null;
  readonly casoIdVincular?: string | null;
  readonly confirmaMismosHechos?: boolean | null;
  readonly expedienteUad?: string | null;
  readonly tipoSolicitudCodigo?: string | null;
  readonly informacionRequerida?: string | null;
  readonly fechaLimite?: string | null;
  readonly causalCodigo?: string | null;
  readonly justificacionInhibitorio?: string | null;
  readonly faseProceso?: FaseProcesoRemision | null;
  readonly entidadDestinatariaCodigo?: string | null;
  readonly fechaRemision?: string | null;
  readonly justificacionRemision?: string | null;
}

function texto(valor: string | null | undefined): string | null {
  const limpio = (valor ?? '').trim();
  return limpio.length > 0 ? limpio : null;
}

/**
 * Arma el cuerpo con **un solo bloque**, el de `tipo` (no se permiten decisiones incompatibles en una
 * misma operación). Los vacíos van en `null`, como espera el backend real (`@Pattern` sobre cadenas).
 */
export function construirDecision(tipo: TipoDecision, version: number, valores: ValoresDecision): DecisionEvaluacionRequest {
  const base = { tipo, version, observaciones: texto(valores.observaciones) };
  switch (tipo) {
    case 'CONTINUAR_TRAMITE': {
      const modoCaso = valores.modoCaso ?? 'CREAR_NUEVO';
      const continuarTramite: ContinuarTramiteDatos = {
        modoCaso,
        casoIdVincular: modoCaso === 'VINCULAR_EXISTENTE' ? texto(valores.casoIdVincular) : null,
        confirmaMismosHechos: modoCaso === 'VINCULAR_EXISTENTE' ? !!valores.confirmaMismosHechos : false,
        expedienteUad: texto(valores.expedienteUad)
      };
      return { ...base, continuarTramite };
    }
    case 'SOLICITAR_INFORMACION':
      return {
        ...base,
        solicitudInformacion: {
          tipoSolicitudCodigo: texto(valores.tipoSolicitudCodigo) ?? '',
          informacionRequerida: texto(valores.informacionRequerida) ?? '',
          fechaLimite: texto(valores.fechaLimite) ?? ''
        }
      };
    case 'INHIBITORIO':
      return {
        ...base,
        inhibitorio: {
          causalCodigo: texto(valores.causalCodigo) ?? '',
          justificacion: texto(valores.justificacionInhibitorio)
        }
      };
    case 'REMISION_COMPETENCIA':
      return {
        ...base,
        remisionCompetencia: {
          faseProceso: valores.faseProceso ?? 'EVALUACION_PRELIMINAR',
          entidadDestinatariaCodigo: texto(valores.entidadDestinatariaCodigo) ?? '',
          fechaRemision: texto(valores.fechaRemision) ?? '',
          justificacion: texto(valores.justificacionRemision)
        }
      };
  }
}

/** Contexto que el servidor conoce al validar (el mock lo arma desde su estado). */
export interface ContextoValidacionDecision {
  readonly tipoNoticia: TipoNoticia;
  /** `casoId` que la noticia ya trae (asignado por otro actor), o `null`. */
  readonly casoIdActual: string | null;
  /** IDs devueltos por la última consulta de casos asociados; `null` si no se consultó. */
  readonly casosConsultados: readonly string[] | null;
  readonly tieneReportanteIdentificado: boolean;
  readonly vinculacionDeterminada: boolean;
  /** Fecha de hoy `YYYY-MM-DD` (la del servidor en producción). */
  readonly hoy: string;
}

const BLOQUES: Record<TipoDecision, keyof DecisionEvaluacionRequest> = {
  CONTINUAR_TRAMITE: 'continuarTramite',
  SOLICITAR_INFORMACION: 'solicitudInformacion',
  INHIBITORIO: 'inhibitorio',
  REMISION_COMPETENCIA: 'remisionCompetencia'
};

function largo(valor: string | null | undefined): number {
  return (valor ?? '').length;
}

/**
 * Errores por campo con la ruta del cuerpo (`solicitudInformacion.fechaLimite`), igual que el
 * `validationErrors` real del backend. Objeto vacío = válida.
 */
export function validarDecision(cuerpo: DecisionEvaluacionRequest, ctx: ContextoValidacionDecision): Record<string, string> {
  const errores: Record<string, string> = {};
  const propio = BLOQUES[cuerpo.tipo];
  const otros = (Object.values(BLOQUES) as (keyof DecisionEvaluacionRequest)[]).filter((b) => b !== propio && cuerpo[b] != null);
  if (otros.length > 0) {
    errores['tipo'] = 'Registre una sola decisión por vez.';
    return errores;
  }
  if (largo(cuerpo.observaciones) > LIMITE_TEXTO_DECISION) {
    errores['observaciones'] = `Máximo ${LIMITE_TEXTO_DECISION} caracteres.`;
  }

  switch (cuerpo.tipo) {
    case 'CONTINUAR_TRAMITE': {
      const c = cuerpo.continuarTramite;
      if (!c) {
        errores['continuarTramite'] = 'Complete los datos para continuar el trámite.';
        break;
      }
      if (!ctx.vinculacionDeterminada) {
        errores['continuarTramite.vinculacion'] =
          'Clasifique primero la vinculación de la persona presuntamente responsable: de ella depende el equipo que instruye.';
      }
      if (ctx.casoIdActual) {
        // UAD-ID-06 / UAD-NOT-03: el hecho ya tiene ID de caso desde otro actor; se conserva, sin duplicar.
        if (c.modoCaso !== 'CONSERVAR_ASIGNADO') {
          errores['continuarTramite.modoCaso'] = 'Esta noticia ya tiene un ID de caso Casilda: se conserva el mismo.';
        }
      } else if (c.modoCaso === 'CONSERVAR_ASIGNADO') {
        errores['continuarTramite.modoCaso'] = 'La noticia no tiene un ID de caso para conservar.';
      } else if (c.modoCaso === 'VINCULAR_EXISTENTE') {
        if (!c.casoIdVincular) {
          errores['continuarTramite.casoIdVincular'] = 'Seleccione el caso existente de los mismos hechos.';
        } else if (!ctx.casosConsultados?.includes(c.casoIdVincular)) {
          errores['continuarTramite.casoIdVincular'] = 'El caso debe salir de la consulta de casos asociados.';
        }
        if (!c.confirmaMismosHechos) {
          errores['continuarTramite.confirmaMismosHechos'] =
            'Confirme que se trata de los mismos hechos. Una coincidencia de documento no basta para vincular.';
        }
      }
      if (largo(c.expedienteUad) > LIMITE_EXPEDIENTE_UAD) {
        errores['continuarTramite.expedienteUad'] = `Máximo ${LIMITE_EXPEDIENTE_UAD} caracteres.`;
      }
      break;
    }
    case 'SOLICITAR_INFORMACION': {
      const s = cuerpo.solicitudInformacion;
      if (ctx.tipoNoticia === 'NDA' || !ctx.tieneReportanteIdentificado) {
        errores['tipo'] = 'Solo se puede pedir información a un reportante identificado (UAD-EVA-04).';
        break;
      }
      if (!s?.tipoSolicitudCodigo) errores['solicitudInformacion.tipoSolicitudCodigo'] = 'Seleccione el tipo de solicitud.';
      const largoInfo = largo(s?.informacionRequerida);
      if (largoInfo < MINIMO_INFORMACION_REQUERIDA) {
        errores['solicitudInformacion.informacionRequerida'] = 'Describa con claridad qué información necesita.';
      } else if (largoInfo > LIMITE_TEXTO_DECISION) {
        errores['solicitudInformacion.informacionRequerida'] = `Máximo ${LIMITE_TEXTO_DECISION} caracteres.`;
      }
      if (!s?.fechaLimite) {
        errores['solicitudInformacion.fechaLimite'] = 'Indique la fecha límite para responder.';
      } else if (s.fechaLimite <= ctx.hoy) {
        errores['solicitudInformacion.fechaLimite'] = 'La fecha límite debe ser posterior a hoy.';
      }
      break;
    }
    case 'INHIBITORIO': {
      const i = cuerpo.inhibitorio;
      if (!i?.causalCodigo) errores['inhibitorio.causalCodigo'] = 'Seleccione la causal.';
      if (JUSTIFICACION_INHIBITORIO_OBLIGATORIA && !i?.justificacion) {
        errores['inhibitorio.justificacion'] = 'Escriba la justificación de la decisión.';
      } else if (largo(i?.justificacion) > LIMITE_TEXTO_DECISION) {
        errores['inhibitorio.justificacion'] = `Máximo ${LIMITE_TEXTO_DECISION} caracteres.`;
      }
      break;
    }
    case 'REMISION_COMPETENCIA': {
      const r = cuerpo.remisionCompetencia;
      if (!r?.faseProceso) errores['remisionCompetencia.faseProceso'] = 'Seleccione la fase del proceso.';
      if (!r?.entidadDestinatariaCodigo) errores['remisionCompetencia.entidadDestinatariaCodigo'] = 'Seleccione la entidad destinataria.';
      if (!r?.fechaRemision) {
        errores['remisionCompetencia.fechaRemision'] = 'Indique la fecha de remisión.';
      } else if (r.fechaRemision > ctx.hoy) {
        errores['remisionCompetencia.fechaRemision'] = 'La fecha de remisión no puede ser futura.';
      }
      if (largo(r?.justificacion) > LIMITE_TEXTO_DECISION) {
        errores['remisionCompetencia.justificacion'] = `Máximo ${LIMITE_TEXTO_DECISION} caracteres.`;
      }
      break;
    }
  }
  return errores;
}

/** `YYYY-MM-DD` local de una fecha (para comparar con fechas de calendario del contrato). */
export function fechaCalendario(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}
