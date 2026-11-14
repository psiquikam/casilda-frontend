import { Routes } from '@angular/router';
import { cambiosSinGuardarGuard } from '../../core/navegacion/cambios-sin-guardar.guard';
import { almaPermisoGuard } from '../shared/permisos/alma-permiso.guard';

/**
 * Rutas del submódulo APH — `/linea-alma/aph/*` (dueña: Hinara; cada submódulo edita solo su
 * `routes.ts`, plan §10.2). Permisos según la matriz del plan §11.
 */
export const APH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'nueva' },
  {
    path: 'nueva',
    title: 'Nueva atención — Línea Alma',
    canActivate: [almaPermisoGuard],
    canDeactivate: [cambiosSinGuardarGuard],
    data: { permisos: ['alma.aph.crear'] },
    loadComponent: () => import('./pages/nueva-atencion/nueva-atencion.page').then((m) => m.NuevaAtencionPage)
  },
  {
    path: 'remisiones',
    title: 'Remisiones recibidas — Línea Alma',
    canActivate: [almaPermisoGuard],
    data: { permisos: ['alma.aph.bandeja'] },
    loadComponent: () => import('./pages/bandeja-remisiones/bandeja-remisiones.page').then((m) => m.BandejaRemisionesPage)
  },
  {
    path: 'atenciones/:idAtencion',
    title: 'Detalle de atención — Línea Alma',
    canActivate: [almaPermisoGuard],
    data: { permisos: ['alma.aph.consultar'] },
    loadComponent: () => import('./pages/detalle-atencion/detalle-atencion.page').then((m) => m.DetalleAtencionPage)
  }
];
