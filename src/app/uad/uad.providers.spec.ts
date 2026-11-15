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
import { provideUadApi } from './uad.providers';

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
});
