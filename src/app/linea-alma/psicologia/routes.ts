import { Routes } from '@angular/router';
import { cambiosSinGuardarGuard } from '../../core/navegacion/cambios-sin-guardar.guard';
import { almaPermisoGuard } from '../shared/permisos/alma-permiso.guard';
import { psicologiaHabilitadaGuard } from './psicologia-habilitada.guard';

/**
 * Rutas del submódulo Psicología — `/linea-alma/psicologia/*` (dueño: Jonathan; cada submódulo
 * edita solo su `routes.ts`, plan §10.2). Permisos según la matriz del plan §11, más la
 * habilitación temporal por rol (`psicologiaHabilitadaGuard`, hoy solo ADMIN).
 *
 * Supuesto Q2: mientras no exista `CAS-…`, la novedad se identifica por `idAtencion` (`ALMA-…`);
 * al generarse el caso se redirige a `casos/:numeroCaso`.
 */
export const PSICOLOGIA_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bandeja' },
  {
    path: 'bandeja',
    title: 'Bandeja de Psicología — Línea Alma',
    canActivate: [psicologiaHabilitadaGuard, almaPermisoGuard],
    data: { permisos: ['alma.psicologia.consultar'] },
    loadComponent: () => import('./pages/bandeja-psicologia/bandeja-psicologia.page').then((m) => m.BandejaPsicologiaPage)
  },
  {
    path: 'novedades/:idAtencion',
    title: 'Novedad — Línea Alma',
    canActivate: [psicologiaHabilitadaGuard, almaPermisoGuard],
    canDeactivate: [cambiosSinGuardarGuard],
    data: { permisos: ['alma.psicologia.consultar'] },
    loadComponent: () => import('./pages/novedad/novedad.page').then((m) => m.NovedadPage)
  },
  {
    path: 'casos/:numeroCaso',
    title: 'Expediente del caso — Línea Alma',
    canActivate: [psicologiaHabilitadaGuard, almaPermisoGuard],
    data: { permisos: ['alma.notasClinicas.consultar'] },
    loadComponent: () => import('./pages/caso/caso.page').then((m) => m.CasoPage)
  },
  {
    path: 'agenda',
    title: 'Mi agenda — Línea Alma',
    canActivate: [psicologiaHabilitadaGuard, almaPermisoGuard],
    data: { permisos: ['alma.psicologia.consultar'] },
    loadComponent: () => import('./pages/agenda/agenda.page').then((m) => m.AgendaPage)
  },
  {
    path: 'recontactos',
    title: 'Recontactos — Línea Alma',
    canActivate: [psicologiaHabilitadaGuard, almaPermisoGuard],
    data: { permisos: ['alma.notasClinicas.consultar'] },
    loadComponent: () => import('./pages/recontactos/recontactos.page').then((m) => m.RecontactosPage)
  }
];
