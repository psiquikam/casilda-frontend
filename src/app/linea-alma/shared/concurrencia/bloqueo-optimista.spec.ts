import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ErrorAlma } from '../http/alma-error';
import { BloqueoOptimista } from './bloqueo-optimista';

interface Novedad {
  idAtencion: string;
  version: number;
  tomadaPor: string | null;
}

/** J-0.4 / J-3.1 — versión en cada acción, 409 recarga y se informa, nunca se reintenta solo. */
describe('BloqueoOptimista (RNF-ALMA-001)', () => {
  const v1: Novedad = { idAtencion: 'ALMA-2026-000001', version: 1, tomadaPor: null };
  const v2: Novedad = { ...v1, version: 2, tomadaPor: 'Otra profesional' };
  const conflicto = () =>
    new HttpErrorResponse({ status: 409, error: { codigo: 'NOVEDAD_YA_TOMADA', mensaje: 'Ya fue tomada.', detalles: {} } });

  it('carga el recurso y expone su versión', () => {
    const bloqueo = new BloqueoOptimista<Novedad>({ recargar: () => of(v1) });
    bloqueo.cargar().subscribe();
    expect(bloqueo.recurso()).toEqual(v1);
    expect(bloqueo.version()).toBe(1);
    expect(bloqueo.ocupado()).toBeFalse();
  });

  it('ejecuta la acción con la versión vigente y adopta la respuesta versionada', () => {
    const bloqueo = new BloqueoOptimista<Novedad>({ recargar: () => of(v1) });
    bloqueo.establecer(v1);
    const accion = jasmine.createSpy('accion').and.returnValue(of({ ...v1, version: 2, tomadaPor: 'Yo' }));
    bloqueo.ejecutar(accion).subscribe();
    expect(accion).toHaveBeenCalledWith(1);
    expect(bloqueo.version()).toBe(2);
    expect(bloqueo.recurso()?.tomadaPor).toBe('Yo');
  });

  it('con `aplicar` deriva el recurso cuando la respuesta no es el recurso completo', () => {
    const bloqueo = new BloqueoOptimista<Novedad>({ recargar: () => of(v1) });
    bloqueo.establecer(v1);
    bloqueo.ejecutar(() => of({ nuevaVersion: 5 }), (r, actual) => ({ ...actual, version: r.nuevaVersion })).subscribe();
    expect(bloqueo.version()).toBe(5);
  });

  it('ante un 409 registra el conflicto, avisa, recarga la versión más reciente y relanza el error', () => {
    const alConflicto = jasmine.createSpy('alConflicto');
    const bloqueo = new BloqueoOptimista<Novedad>({ recargar: () => of(v2), alConflicto });
    bloqueo.establecer(v1);
    let recibido: ErrorAlma | undefined;
    bloqueo.ejecutar(() => throwError(conflicto)).subscribe({ error: (e: ErrorAlma) => (recibido = e) });
    expect(recibido?.tipo).toBe('conflicto');
    expect(recibido?.codigo).toBe('NOVEDAD_YA_TOMADA');
    expect(alConflicto).toHaveBeenCalledTimes(1);
    expect(bloqueo.conflicto()?.codigo).toBe('NOVEDAD_YA_TOMADA');
    expect(bloqueo.recurso()).toEqual(v2);
    expect(bloqueo.ocupado()).toBeFalse();
  });

  it('un error que no es 409 no recarga ni marca conflicto', () => {
    const recargar = jasmine.createSpy('recargar').and.returnValue(of(v2));
    const bloqueo = new BloqueoOptimista<Novedad>({ recargar });
    bloqueo.establecer(v1);
    bloqueo.ejecutar(() => throwError(() => new HttpErrorResponse({ status: 500 }))).subscribe({ error: () => undefined });
    expect(recargar).not.toHaveBeenCalled();
    expect(bloqueo.conflicto()).toBeNull();
    expect(bloqueo.recurso()).toEqual(v1);
  });

  it('no ejecuta nada si todavía no hay recurso cargado', () => {
    const bloqueo = new BloqueoOptimista<Novedad>({ recargar: () => of(v1) });
    const accion = jasmine.createSpy('accion');
    let fallo = false;
    bloqueo.ejecutar(accion).subscribe({ error: () => (fallo = true) });
    expect(accion).not.toHaveBeenCalled();
    expect(fallo).toBeTrue();
  });

  it('la siguiente acción limpia el conflicto anterior', () => {
    const bloqueo = new BloqueoOptimista<Novedad>({ recargar: () => of(v2) });
    bloqueo.establecer(v1);
    bloqueo.ejecutar(() => throwError(conflicto)).subscribe({ error: () => undefined });
    bloqueo.ejecutar(() => of({ ...v2, version: 3 })).subscribe();
    expect(bloqueo.conflicto()).toBeNull();
    expect(bloqueo.version()).toBe(3);
  });
});
