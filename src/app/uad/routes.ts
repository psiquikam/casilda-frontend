import { Routes } from '@angular/router';
import { cambiosSinGuardarGuard } from '../core/navegacion/cambios-sin-guardar.guard';
import { provideUadApi } from './uad.providers';

/**
 * Rutas del módulo UAD Equipos 3 y 4 (`/uad/*`). El acceso por rol lo exige `roleGuard` en
 * `app.routes.ts` (roles `UAD_*`; ADMIN por la regla general). **Ninguna ruta es pública.**
 * El puerto `UadApiPort` (mock o HTTP) se provee aquí, no en la raíz.
 */
export const UAD_ROUTES: Routes = [
  {
    path: '',
    providers: [provideUadApi()],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'noticias' },
      {
        path: 'noticias',
        title: 'Noticias disciplinarias — UAD',
        loadComponent: () => import('./paginas/bandeja-noticias/bandeja-noticias.page').then((m) => m.BandejaNoticiasPage)
      },
      {
        path: 'noticias/:noticiaId',
        title: 'Evaluación preliminar — UAD',
        canDeactivate: [cambiosSinGuardarGuard],
        loadComponent: () => import('./paginas/evaluacion-noticia/evaluacion-noticia.page').then((m) => m.EvaluacionNoticiaPage)
      },
      {
        path: 'casos',
        title: 'Bandeja de casos — UAD',
        loadComponent: () => import('./paginas/bandeja-casos/bandeja-casos.page').then((m) => m.BandejaCasosPage)
      }
    ]
  }
];
