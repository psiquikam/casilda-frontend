import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../environments/environment';
import { UadApiPort } from './contratos/uad-api.port';
import { UadHttpAdapter } from './infraestructura/uad-http.adapter';
import { UadMockAdapter } from './infraestructura/mock/uad-mock.adapter';
import { UadMockStore, UadSimulacionService } from './infraestructura/mock/uad-mock-store';
import { UadFacade } from './servicios/uad.facade';

export type AdaptadorUad = 'mock' | 'http';

/**
 * Elige el adaptador del puerto UAD. Pasar de mock a HTTP es cambiar `environment.uad.adaptador`,
 * **sin tocar componentes** (ver `docs/contratos/uad/README.md` §3). Se provee en las rutas UAD,
 * no en `app.config.ts`, para que el mock y sus datos no se carguen fuera del módulo.
 */
export function provideUadApi(adaptador: AdaptadorUad = environment.uad.adaptador as AdaptadorUad): EnvironmentProviders {
  const proveedores: Provider[] =
    adaptador === 'mock'
      ? [UadMockStore, UadSimulacionService, { provide: UadApiPort, useClass: UadMockAdapter }]
      : [{ provide: UadApiPort, useClass: UadHttpAdapter }];
  return makeEnvironmentProviders([...proveedores, UadFacade]);
}

export function usaAdaptadorMock(): boolean {
  return environment.uad.adaptador === 'mock';
}
