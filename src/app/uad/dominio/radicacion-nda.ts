import { RadicacionNdaRequest, VinculacionInvestigado } from '../contratos/uad-api.types';
import { VINCULACIONES } from './etiquetas';

/**
 * Reglas puras de la queja anónima (NDA) — P-UAD-02; UAD-FOR-12, UAD-NOT-04, UAD-SEG-06.
 * Las usan la página (validación previa) y el mock (validación simulada del servidor). El servidor real
 * debe aplicarlas por su cuenta.
 */

export const MINIMO_RELATO_NDA = 20;
export const LIMITE_RELATO_NDA = 4000;
export const LIMITE_CAMPO_CORTO_NDA = 300;

export interface ValoresNda {
  readonly descripcionHechos?: string | null;
  readonly lugarOcurrencia?: string | null;
  readonly presuntoResponsable?: string | null;
  readonly vinculacionDeclarada?: VinculacionInvestigado | '' | null;
}

function texto(valor: string | null | undefined): string | null {
  const limpio = (valor ?? '').trim();
  return limpio.length > 0 ? limpio : null;
}

/** Arma el cuerpo con vacíos en `null`. No hay campos de identidad ni de contacto que llenar. */
export function construirRadicacionNda(v: ValoresNda): RadicacionNdaRequest {
  return {
    descripcionHechos: texto(v.descripcionHechos) ?? '',
    lugarOcurrencia: texto(v.lugarOcurrencia),
    presuntoResponsable: texto(v.presuntoResponsable),
    vinculacionDeclarada: v.vinculacionDeclarada ? v.vinculacionDeclarada : null
  };
}

/** Errores por campo, con el formato de `validationErrors` del backend. Objeto vacío = válida. */
export function validarRadicacionNda(c: RadicacionNdaRequest): Record<string, string> {
  const errores: Record<string, string> = {};
  const largo = c.descripcionHechos.length;
  if (largo < MINIMO_RELATO_NDA) {
    errores['descripcionHechos'] = 'Cuente con algo más de detalle qué pasó, para que la UAD pueda evaluarlo.';
  } else if (largo > LIMITE_RELATO_NDA) {
    errores['descripcionHechos'] = `Máximo ${LIMITE_RELATO_NDA} caracteres.`;
  }
  if ((c.lugarOcurrencia ?? '').length > LIMITE_CAMPO_CORTO_NDA) errores['lugarOcurrencia'] = `Máximo ${LIMITE_CAMPO_CORTO_NDA} caracteres.`;
  if ((c.presuntoResponsable ?? '').length > LIMITE_CAMPO_CORTO_NDA) {
    errores['presuntoResponsable'] = `Máximo ${LIMITE_CAMPO_CORTO_NDA} caracteres.`;
  }
  if (c.vinculacionDeclarada !== null && !VINCULACIONES.includes(c.vinculacionDeclarada)) {
    errores['vinculacionDeclarada'] = 'Seleccione una opción de la lista.';
  }
  return errores;
}
