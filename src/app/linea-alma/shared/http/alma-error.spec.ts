import { HttpErrorResponse } from '@angular/common/http';
import { esErrorAlma, interpretarErrorAlma } from './alma-error';

function http(status: number, error: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('interpretarErrorAlma', () => {
  it('clasifica cada estado HTTP del contrato', () => {
    expect(interpretarErrorAlma(http(0)).tipo).toBe('red');
    expect(interpretarErrorAlma(http(401)).tipo).toBe('sin-sesion');
    expect(interpretarErrorAlma(http(403)).tipo).toBe('sin-permiso');
    expect(interpretarErrorAlma(http(404)).tipo).toBe('no-encontrado');
    expect(interpretarErrorAlma(http(409)).tipo).toBe('conflicto');
    expect(interpretarErrorAlma(http(422)).tipo).toBe('regla-negocio');
    expect(interpretarErrorAlma(http(400)).tipo).toBe('validacion');
    expect(interpretarErrorAlma(http(503)).tipo).toBe('servidor');
  });

  it('usa un mensaje propio y neutro para los códigos de negocio conocidos', () => {
    const e = interpretarErrorAlma(http(422, { codigo: 'CONSENTIMIENTO_REQUERIDO', mensaje: 'texto técnico del servidor' }));
    expect(e.codigo).toBe('CONSENTIMIENTO_REQUERIDO');
    expect(e.mensaje).toContain('consentimiento');
    expect(e.mensaje).not.toContain('texto técnico');
  });

  it('el conflicto de remisión ya tomada explica qué ocurrió sin culpar a nadie', () => {
    const e = interpretarErrorAlma(http(409, { codigo: 'REMISION_YA_TOMADA', mensaje: 'x', detalles: { tomadaEn: '2026-11-06T09:00:00-05:00' } }));
    expect(e.tipo).toBe('conflicto');
    expect(e.mensaje).toMatch(/Otra persona del equipo/);
    expect(e.detalles['tomadaEn']).toBeDefined();
  });

  it('no filtra detalles técnicos en un error 5xx', () => {
    const e = interpretarErrorAlma(http(500, { message: 'NullPointerException en AtencionService' }));
    expect(e.mensaje).not.toContain('NullPointer');
    expect(e.mensaje).toContain('lo que escribió no se perdió');
  });

  it('extrae los errores por campo de `detalles` y de `validationErrors`', () => {
    const deContrato = interpretarErrorAlma(http(400, { codigo: 'VALIDACION', mensaje: 'Revise.', detalles: { 'persona.numeroIdentificacion': 'Escriba el número.' } }));
    expect(deContrato.camposInvalidos['persona.numeroIdentificacion']).toBe('Escriba el número.');

    const deBackend = interpretarErrorAlma(http(400, { message: 'inválido', validationErrors: { motivo: 'Falta el motivo.' } }));
    expect(deBackend.camposInvalidos['motivo']).toBe('Falta el motivo.');
  });

  it('es idempotente: un error ya traducido se devuelve igual', () => {
    const primero = interpretarErrorAlma(http(404));
    expect(esErrorAlma(primero)).toBeTrue();
    expect(interpretarErrorAlma(primero)).toBe(primero);
  });

  it('un valor que no es HTTP produce un error genérico en vez de romper', () => {
    expect(interpretarErrorAlma(new Error('boom')).tipo).toBe('servidor');
  });
});
