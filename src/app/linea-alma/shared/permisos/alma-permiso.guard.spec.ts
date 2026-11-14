import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DialogoService } from '../../../core/a11y/dialogo.service';
import { almaPermisoGuard } from './alma-permiso.guard';
import { PermisoAlma } from './alma-permisos';

describe('almaPermisoGuard', () => {
  function ejecutar(rol: string | null, permisos: PermisoAlma[]): boolean | UrlTree {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => rol !== null, hasRole: (r: string) => r === rol }
        },
        { provide: DialogoService, useValue: { aviso: () => ({ subscribe: () => undefined }) } }
      ]
    });
    const ruta = { data: { permisos } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => almaPermisoGuard(ruta, {} as RouterStateSnapshot)) as boolean | UrlTree;
  }

  function destino(resultado: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
  }

  it('deja pasar al Técnico APH a las pantallas de APH', () => {
    expect(ejecutar('TECNICO_APH', ['alma.aph.crear'])).toBeTrue();
  });

  it('rechaza al Técnico APH en las pantallas de Psicología con «Acceso denegado»', () => {
    const resultado = ejecutar('TECNICO_APH', ['alma.psicologia.consultar']);
    expect(destino(resultado)).toBe('/acceso-denegado');
  });

  it('rechaza al Profesional en la bandeja de remisiones de APH', () => {
    expect(destino(ejecutar('PROFESIONAL', ['alma.aph.bandeja']))).toBe('/acceso-denegado');
  });

  it('deja pasar al Admin a todo', () => {
    expect(ejecutar('ADMIN', ['alma.psicologia.cerrar'])).toBeTrue();
  });

  it('envía a iniciar sesión cuando no hay sesión', () => {
    expect(destino(ejecutar(null, ['alma.aph.crear']))).toBe('/login');
  });
});
