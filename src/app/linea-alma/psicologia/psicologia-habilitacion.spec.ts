import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AlmaPermisosService } from '../shared/permisos/alma-permisos.service';
import { psicologiaHabilitadaGuard } from './psicologia-habilitada.guard';
import { ROLES_HABILITADOS_PSICOLOGIA, psicologiaHabilitadaPara } from './psicologia-habilitacion';

/** Despliegue controlado del submódulo: por ahora solo ADMIN (decisión del equipo, 2026-11-09). */
describe('habilitación temporal de Psicología', () => {
  it('hoy solo habilita a ADMIN; los demás roles de la matriz esperan la decisión del equipo', () => {
    expect(ROLES_HABILITADOS_PSICOLOGIA).toEqual(['ADMIN']);
    expect(psicologiaHabilitadaPara(['ADMIN'])).toBeTrue();
    expect(psicologiaHabilitadaPara(['PROFESIONAL'])).toBeFalse();
    expect(psicologiaHabilitadaPara(['COORDINADOR', 'REVISOR'])).toBeFalse();
    expect(psicologiaHabilitadaPara([])).toBeFalse();
  });

  it('el guard deja pasar al habilitado y manda a «Acceso denegado» al resto', () => {
    const ejecutar = (habilitada: boolean) => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: AlmaPermisosService, useValue: { psicologiaHabilitada: () => habilitada } }]
      });
      return TestBed.runInInjectionContext(() => psicologiaHabilitadaGuard({ data: {} } as never, {} as never));
    };
    expect(ejecutar(true)).toBeTrue();
    const redireccion = ejecutar(false) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(redireccion)).toBe('/acceso-denegado');
  });
});
