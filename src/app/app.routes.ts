import { Routes } from '@angular/router';
import { featureCapabilityGuard } from './core/features/feature-capability.guard';
import { authGuard } from './services/auth.guard';
import { roleGuard } from './services/role.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./components/casilda-home/casilda-home.component').then((m) => m.CasildaHomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'seguimiento',
    canMatch: [featureCapabilityGuard],
    data: { feature: 'publicTrackingPrototype' },
    loadComponent: () => import('./components/seguimiento-tramite/seguimiento-tramite.component').then((m) => m.SeguimientoTramiteComponent)
  },
  {
    path: 'detalle-revisor/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./components/detalle-revisor/detalle-revisor.component').then((m) => m.DetalleRevisorComponent)
  },
  {
    path: 'gestion-usuarios',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./components/gestion-usuarios/gestion-usuarios.component').then((m) => m.GestionUsuariosComponent)
  },
  {
    path: 'dashboard-revisor',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'], feature: 'reviewerDashboardPrototype' },
    loadComponent: () => import('./components/dashboard-revisor/dashboard-revisor.component').then((m) => m.DashboardRevisorComponent)
  },
  {
    path: 'nueva-queja',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor', 'Usuario'], feature: 'complaintIntakePrototype' },
    loadComponent: () => import('./components/formulario-queja/formulario-queja.component').then((m) => m.FormularioQuejaComponent)
  },
  {
    path: 'solicitud-acompanamiento',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor', 'Usuario'] },
    loadComponent: () => import('./components/formulario-acompanamiento/formulario-acompanamiento.component').then((m) => m.FormularioAcompanamientoComponent)
  },
  {
    path: 'gestion-sistema',
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./components/gestion-listas/gestion-listas.component').then((m) => m.GestionListasComponent)
  },
  {
    path: 'mis-asignaciones',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'], feature: 'assignmentsPrototype' },
    loadComponent: () => import('./components/mis-asignaciones/mis-asignaciones.component').then((m) => m.MisAsignacionesComponent)
  },
  {
    path: 'detalle-acompanamiento/:id',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] },
    loadComponent: () => import('./components/gestion-contacto/gestion-contacto.component').then((m) => m.DetalleAcompanamientoComponent)
  },
  {
    path: 'consulta',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] },
    loadComponent: () => import('./components/consulta/consulta.component').then((m) => m.ConsultaComponent)
  },
  {
    path: 'registro-caso',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] },
    loadComponent: () => import('./components/registro-caso/registro-caso.component').then((m) => m.RegistroCasoComponent)
  },
  {
    path: 'caso',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] },
    loadComponent: () => import('./components/caso/caso.component').then((m) => m.CasoComponent)
  },
  {
    path: 'registro-atencion',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] },
    loadComponent: () => import('./components/registro-atencion/registro-atencion.component').then((m) => m.RegistroAtencionComponent)
  },
  {
    path: 'cita',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] },
    loadComponent: () => import('./components/cita/cita.component').then((m) => m.CitaComponent)
  },
  {
    path: 'linea-alma/atencion-pr',
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] },
    loadComponent: () => import('./components/linea-alma/atencion-pr/atencion-pr.component').then((m) => m.AtencionPrComponent)
  },
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./components/acceso-denegado/acceso-denegado.component').then((m) => m.AccesoDenegadoComponent)
  },
  {
    path: 'funcionalidad-no-disponible',
    loadComponent: () => import('./components/funcionalidad-no-disponible/funcionalidad-no-disponible.component').then((m) => m.FuncionalidadNoDisponibleComponent)
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
