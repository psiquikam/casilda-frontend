import { Routes } from '@angular/router';
import { cambiosSinGuardarGuard } from '../core/navegacion/cambios-sin-guardar.guard';
import { provideUadRadicacion } from './uad.providers';

/**
 * Ruta **pública** de la queja anónima ante la UAD (`/uad/queja-anonima`). Se carga en diferido desde
 * `app.routes.ts` para que el puerto de radicación y su mock no entren al bundle inicial.
 * No usa `roleGuard`: la queja anónima no exige ni asocia sesión (UAD-NOT-04).
 */
export const QUEJA_ANONIMA_ROUTES: Routes = [
  {
    path: '',
    title: 'Queja anónima ante la UAD',
    providers: [provideUadRadicacion()],
    canDeactivate: [cambiosSinGuardarGuard],
    loadComponent: () => import('./paginas/queja-anonima/queja-anonima.page').then((m) => m.QuejaAnonimaPage)
  }
];
