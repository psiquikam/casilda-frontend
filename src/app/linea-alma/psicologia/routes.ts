import { Routes } from '@angular/router';
import { almaPermisoGuard } from '../shared/permisos/alma-permiso.guard';

/**
 * Rutas del submódulo Psicología — `/linea-alma/psicologia/*` (dueño: Jonathan).
 *
 * **STUBS creados en H-0.1** para que ambas secciones sean navegables con roles distintos y el
 * guard devuelva «Acceso denegado» al Técnico APH. Jonathan reemplaza cada `loadComponent` por su
 * pantalla (J-1.1, J-1.2, J-2.1) y es el único que edita este archivo desde ahora.
 */
const STUB = () => import('./pages/psicologia-pendiente.page').then((m) => m.PsicologiaPendientePage);

export const PSICOLOGIA_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bandeja' },
  {
    path: 'bandeja',
    title: 'Bandeja de Psicología — Línea Alma',
    canActivate: [almaPermisoGuard],
    data: { permisos: ['alma.psicologia.consultar'], pantalla: 'Bandeja compartida con semáforo SLA (J-1.1)' },
    loadComponent: STUB
  },
  {
    path: 'novedades/:idAtencion',
    title: 'Novedad — Línea Alma',
    canActivate: [almaPermisoGuard],
    data: { permisos: ['alma.psicologia.consultar'], pantalla: 'Gestión de la novedad (J-1.2, J-1.3, J-1.4)' },
    loadComponent: STUB
  },
  {
    path: 'casos/:numeroCaso',
    title: 'Expediente del caso — Línea Alma',
    canActivate: [almaPermisoGuard],
    data: { permisos: ['alma.psicologia.consultar'], pantalla: 'Expediente del caso (J-1.5, J-1.6, J-2.1)' },
    loadComponent: STUB
  }
];
