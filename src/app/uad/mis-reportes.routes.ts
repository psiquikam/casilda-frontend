import { Routes } from '@angular/router';
import { cambiosSinGuardarGuard } from '../core/navegacion/cambios-sin-guardar.guard';
import { provideUadMisReportes } from './uad.providers';

/**
 * Rutas de «Mis reportes» (`/mis-reportes`), para quien radicó un reporte con su sesión. El rol lo exige
 * `roleGuard` en `app.routes.ts`; el dueño de cada reporte lo filtra el servidor. Se cargan en diferido
 * para que el puerto y su mock no entren al bundle inicial.
 */
export const MIS_REPORTES_ROUTES: Routes = [
  {
    path: '',
    providers: [provideUadMisReportes()],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Mis reportes',
        loadComponent: () => import('./paginas/mis-reportes/mis-reportes.page').then((m) => m.MisReportesPage)
      },
      {
        path: ':codigo',
        title: 'Detalle del reporte',
        canDeactivate: [cambiosSinGuardarGuard],
        loadComponent: () => import('./paginas/mi-reporte/mi-reporte.page').then((m) => m.MiReportePage)
      }
    ]
  }
];
