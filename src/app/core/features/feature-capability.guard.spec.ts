import { TestBed } from '@angular/core/testing';
import { Route, Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { featureCapabilityGuard } from './feature-capability.guard';

describe('featureCapabilityGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('permite cargar una capacidad habilitada', () => {
    const route: Route = { data: { feature: 'publicTrackingPrototype' } };

    const result = TestBed.runInInjectionContext(() => featureCapabilityGuard(route, []));

    expect(result).toBeTrue();
  });

  it('redirige una capacidad deshabilitada sin cargar su componente', () => {
    const route: Route = { data: { feature: 'publicTrackingPrototype' } };
    const router = TestBed.inject(Router);
    const previousValue = environment.features.publicTrackingPrototype;
    environment.features.publicTrackingPrototype = false;

    const result = TestBed.runInInjectionContext(() => featureCapabilityGuard(route, []));

    environment.features.publicTrackingPrototype = previousValue;
    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/funcionalidad-no-disponible');
  });
});
