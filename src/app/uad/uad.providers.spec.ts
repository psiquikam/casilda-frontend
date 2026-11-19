import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { routes } from '../app.routes';
import { roleGuard } from '../services/role.guard';
import { UadApiPort } from './contratos/uad-api.port';
import { UadHttpAdapter } from './infraestructura/uad-http.adapter';
import { UadMockAdapter } from './infraestructura/mock/uad-mock.adapter';
import { UadSimulacionService } from './infraestructura/mock/uad-mock-store';
import { UAD_ROUTES } from './routes';
import { UAD_RADICACION_SIMULADA, provideUadApi, provideUadRadicacion } from './uad.providers';
import { UadRadicacionPort } from './contratos/uad-radicacion.port';
import { UadRadicacionHttpAdapter } from './infraestructura/uad-radicacion-http.adapter';
import { UadRadicacionMockAdapter } from './infraestructura/mock/uad-radicacion-mock.adapter';
import { featureCapabilityGuard } from '../core/features/feature-capability.guard';

describe('UAD · selección de adaptador y rutas', () => {
  function inyector(adaptador: 'mock' | 'http'): EnvironmentInjector {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    return createEnvironmentInjector([provideUadApi(adaptador)], TestBed.inject(EnvironmentInjector));
  }

  it('mock: el puerto es UadMockAdapter y existe el servicio de simulación', () => {
    const inj = inyector('mock');
    expect(inj.get(UadApiPort)).toBeInstanceOf(UadMockAdapter);
    expect(inj.get(UadSimulacionService, null)).not.toBeNull();
  });

  it('http: el puerto es UadHttpAdapter y no hay simulación', () => {
    const inj = inyector('http');
    expect(inj.get(UadApiPort)).toBeInstanceOf(UadHttpAdapter);
    expect(inj.get(UadSimulacionService, null)).toBeNull();
  });

  it('/uad exige roleGuard con los roles UAD (nunca pública)', () => {
    const ruta = routes.find((r) => r.path === 'uad');
    expect(ruta?.canActivate).toContain(roleGuard);
    expect(ruta?.data?.['roles']).toEqual(['UAD_COORDINACION', 'UAD_EQUIPO_3', 'UAD_EQUIPO_4']);
  });

  it('todas las rutas hijas declaran título', () => {
    const hijas = UAD_ROUTES[0].children ?? [];
    for (const h of hijas.filter((r) => !r.redirectTo)) {
      expect(h.title).withContext(h.path ?? '').toBeTruthy();
    }
  });

  it('radicación pública: mock declara la simulación; http no', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const padre = TestBed.inject(EnvironmentInjector);
    const mock = createEnvironmentInjector([provideUadRadicacion('mock')], padre);
    expect(mock.get(UadRadicacionPort)).toBeInstanceOf(UadRadicacionMockAdapter);
    expect(mock.get(UAD_RADICACION_SIMULADA)).toBeTrue();
    const http = createEnvironmentInjector([provideUadRadicacion('http')], padre);
    expect(http.get(UadRadicacionPort)).toBeInstanceOf(UadRadicacionHttpAdapter);
    expect(http.get(UAD_RADICACION_SIMULADA)).toBeFalse();
  });

  it('/uad/queja-anonima es pública, va antes de /uad y depende del flag uadQuejaAnonima', () => {
    const indicePublica = routes.findIndex((r) => r.path === 'uad/queja-anonima');
    const indiceUad = routes.findIndex((r) => r.path === 'uad');
    expect(indicePublica).toBeGreaterThanOrEqual(0);
    expect(indicePublica).toBeLessThan(indiceUad);
    const publica = routes[indicePublica];
    expect(publica.canActivate ?? []).not.toContain(roleGuard);
    expect(publica.canMatch).toContain(featureCapabilityGuard);
    expect(publica.data?.['feature']).toBe('uadQuejaAnonima');
  });
});
