import { EnvironmentProviders, InjectionToken, Provider, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../environments/environment';
import { UadApiPort } from './contratos/uad-api.port';
import { UadMisReportesPort } from './contratos/uad-mis-reportes.port';
import { UadRadicacionPort } from './contratos/uad-radicacion.port';
import { UadHttpAdapter } from './infraestructura/uad-http.adapter';
import { UadMisReportesHttpAdapter } from './infraestructura/uad-mis-reportes-http.adapter';
import { UadMisReportesMockAdapter } from './infraestructura/mock/uad-mis-reportes-mock.adapter';
import { UadRadicacionHttpAdapter } from './infraestructura/uad-radicacion-http.adapter';
import { UadRadicacionMockAdapter } from './infraestructura/mock/uad-radicacion-mock.adapter';
import { UadMockAdapter } from './infraestructura/mock/uad-mock.adapter';
import { UadSimulacionService } from './infraestructura/mock/uad-mock-store';
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
      ? [UadSimulacionService, { provide: UadApiPort, useClass: UadMockAdapter }]
      : [{ provide: UadApiPort, useClass: UadHttpAdapter }];
  return makeEnvironmentProviders([...proveedores, UadFacade]);
}

export function usaAdaptadorMock(): boolean {
  return environment.uad.adaptador === 'mock';
}

/** `true` cuando la radicación pública está simulada: la página lo declara («Datos de demostración»). */
export const UAD_RADICACION_SIMULADA = new InjectionToken<boolean>('UAD_RADICACION_SIMULADA', { factory: () => false });

/**
 * Proveedores de la radicación **pública** (queja anónima NDA). Van en la ruta pública
 * `/uad/queja-anonima`, que no pasa por `roleGuard` ni recibe el puerto protegido `UadApiPort`.
 */
export function provideUadRadicacion(adaptador: AdaptadorUad = environment.uad.adaptador as AdaptadorUad): EnvironmentProviders {
  return makeEnvironmentProviders(
    adaptador === 'mock'
      ? [{ provide: UadRadicacionPort, useClass: UadRadicacionMockAdapter }, { provide: UAD_RADICACION_SIMULADA, useValue: true }]
      : [{ provide: UadRadicacionPort, useClass: UadRadicacionHttpAdapter }]
  );
}

/** `true` cuando «Mis reportes» está simulado: las páginas lo declaran («Datos de demostración»). */
export const UAD_MIS_REPORTES_SIMULADO = new InjectionToken<boolean>('UAD_MIS_REPORTES_SIMULADO', { factory: () => false });

/**
 * Proveedores de «Mis reportes» (rol `USUARIO`). Van en la ruta `/mis-reportes`, fuera de `/uad`: quien
 * radicó un reporte no recibe el puerto de los Equipos 3 y 4 (`UadApiPort`).
 */
export function provideUadMisReportes(adaptador: AdaptadorUad = environment.uad.adaptador as AdaptadorUad): EnvironmentProviders {
  return makeEnvironmentProviders(
    adaptador === 'mock'
      ? [{ provide: UadMisReportesPort, useClass: UadMisReportesMockAdapter }, { provide: UAD_MIS_REPORTES_SIMULADO, useValue: true }]
      : [{ provide: UadMisReportesPort, useClass: UadMisReportesHttpAdapter }]
  );
}
