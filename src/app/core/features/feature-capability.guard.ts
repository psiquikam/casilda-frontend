import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export type FeatureKey = keyof typeof environment.features;

export const featureCapabilityGuard: CanMatchFn = (route) => {
  const router = inject(Router);
  const feature = route.data?.['feature'] as FeatureKey | undefined;

  return feature && environment.features[feature]
    ? true
    : router.createUrlTree(['/funcionalidad-no-disponible']);
};
