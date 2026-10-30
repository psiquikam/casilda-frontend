import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { DialogoService } from '../a11y/dialogo.service';
import { ConCambiosPendientes, cambiosSinGuardarGuard } from './cambios-sin-guardar.guard';

describe('cambiosSinGuardarGuard', () => {
  let dialogo: jasmine.SpyObj<DialogoService>;

  const ejecutar = (componente: ConCambiosPendientes) =>
    TestBed.runInInjectionContext(
      () =>
        cambiosSinGuardarGuard(
          componente,
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
          {} as RouterStateSnapshot
        ) as Observable<boolean>
    );

  beforeEach(() => {
    dialogo = jasmine.createSpyObj<DialogoService>('DialogoService', ['confirmar']);
    TestBed.configureTestingModule({ providers: [{ provide: DialogoService, useValue: dialogo }] });
  });

  it('deja salir sin preguntar si no hay cambios', async () => {
    expect(await firstValueFrom(ejecutar({ tieneCambiosPendientes: () => false }))).toBeTrue();
    expect(dialogo.confirmar).not.toHaveBeenCalled();
  });

  it('con cambios pendientes respeta la decisión de la persona', async () => {
    dialogo.confirmar.and.returnValue(of(false));
    expect(await firstValueFrom(ejecutar({ tieneCambiosPendientes: () => true }))).toBeFalse();

    dialogo.confirmar.and.returnValue(of(true));
    expect(await firstValueFrom(ejecutar({ tieneCambiosPendientes: () => true }))).toBeTrue();
  });
});
