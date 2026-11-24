import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { separarNombre, unirNombre } from '../components/caracterizacion-form/caracterizacion-campos';

/**
 * Capa de compatibilidad con el contrato **real** del backend de Línea Alma.
 *
 * Va **después** de los interceptores del servidor simulado, así que solo ve las peticiones que salen
 * a la red: el mock y el resto del front siguen hablando el contrato de `docs/contratos/linea-alma/`.
 * Hace dos cosas, ambas documentadas en `docs/contratos/linea-alma/revision-backend-vs-front-2026-11-20.md`:
 *
 * 1. **Nombres separados.** El backend recibe y devuelve `persona.primerNombre`, `segundoNombre`,
 *    `primerApellido` y `segundoApellido`, y rechaza `nombres`/`apellidos` («Campo no permitido»). Al
 *    enviar se quitan estos dos; al recibir se reconstruyen para que el resto del front siga usándolos.
 * 2. **Campos que el backend aún no admite** (`environment.lineaAlma.extensiones = false`): el backend
 *    valida cada cuerpo con una lista cerrada de campos y responde `400` a cualquier otro, así que se
 *    retiran antes de enviar. La interfaz oculta los controles correspondientes.
 */
const PERSONA_NO_ADMITIDOS = ['fechaNacimiento', 'identidadGenero', 'vinculoUniversidad'] as const;
const SOLICITANTE_NO_ADMITIDOS = ['correo', 'parentescoOtro'] as const;

type Objeto = Record<string, unknown>;
const esObjeto = (valor: unknown): valor is Objeto => typeof valor === 'object' && valor !== null && !Array.isArray(valor);

function textoONulo(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

/** Cuerpo de una petición → forma que admite el backend. No modifica el original. */
export function aContratoServidor(cuerpo: unknown, extensiones: boolean): unknown {
  if (!esObjeto(cuerpo)) return cuerpo;
  const salida: Objeto = { ...cuerpo };

  if (esObjeto(salida['persona'])) {
    const persona: Objeto = { ...salida['persona'] };
    const traeSeparados = ['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'].some((c) => c in persona);
    if (!traeSeparados && ('nombres' in persona || 'apellidos' in persona)) {
      const nombre = separarNombre(textoONulo(persona['nombres']));
      const apellido = separarNombre(textoONulo(persona['apellidos']));
      persona['primerNombre'] = nombre.primero || null;
      persona['segundoNombre'] = nombre.segundo || null;
      persona['primerApellido'] = apellido.primero || null;
      persona['segundoApellido'] = apellido.segundo || null;
    }
    delete persona['nombres'];
    delete persona['apellidos'];
    if (!extensiones) for (const campo of PERSONA_NO_ADMITIDOS) delete persona[campo];
    salida['persona'] = persona;
  }

  if (!extensiones) {
    delete salida['lugarOcurrencia'];
    if (esObjeto(salida['solicitante'])) {
      const solicitante: Objeto = { ...salida['solicitante'] };
      for (const campo of SOLICITANTE_NO_ADMITIDOS) delete solicitante[campo];
      salida['solicitante'] = solicitante;
    }
  }
  return salida;
}

/** Respuesta del backend → forma que usa el front (recompone `nombres` y `apellidos`). */
export function desdeContratoServidor(cuerpo: unknown): unknown {
  if (Array.isArray(cuerpo)) return cuerpo.map(desdeContratoServidor);
  if (!esObjeto(cuerpo)) return cuerpo;
  const salida: Objeto = {};
  for (const [clave, valor] of Object.entries(cuerpo)) salida[clave] = desdeContratoServidor(valor);
  const traeSeparados = ['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'].some((c) => c in salida);
  if (traeSeparados && !('nombres' in salida)) {
    salida['nombres'] = unirNombre(textoONulo(salida['primerNombre']), textoONulo(salida['segundoNombre']));
    salida['apellidos'] = unirNombre(textoONulo(salida['primerApellido']), textoONulo(salida['segundoApellido']));
  }
  return salida;
}

export const almaContratoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(`${environment.apiBaseUrl}/alma/`)) return next(req);
  const esJson = req.body !== null && typeof req.body === 'object' && !(req.body instanceof FormData);
  const peticion = esJson ? req.clone({ body: aContratoServidor(req.body, environment.lineaAlma.extensiones) }) : req;
  return next(peticion).pipe(
    map((evento: HttpEvent<unknown>) => (evento instanceof HttpResponse && evento.body ? evento.clone({ body: desdeContratoServidor(evento.body) }) : evento))
  );
};
