import { Routes } from '@angular/router';
import { featureCapabilityGuard } from './core/features/feature-capability.guard';
import { authGuard } from './services/auth.guard';
import { roleGuard } from './services/role.guard';

export const routes: Routes = [
  {
    path: 'home',
    title: 'Inicio',
    loadComponent: () => import('./components/casilda-home/casilda-home.component').then((m) => m.CasildaHomeComponent)
  },
  {
    path: 'inicio',
    title: 'Inicio operativo',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard-home/dashboard-home.component').then((m) => m.DashboardHomeComponent)
  },
  {
    path: 'dashboard',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./components/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'formulario-anonimo',
    title: 'Reporte anónimo de VBG',
    loadComponent: () => import('./components/formulario-anonimo/formulario-anonimo.component').then((m) => m.FormularioAnonimoComponent)
  },
  {
    path: 'reporte-anonimo',
    redirectTo: 'formulario-anonimo',
    pathMatch: 'full'
  },
  {
    path: 'seguimiento',
    title: 'Seguimiento de trámite',
    canMatch: [featureCapabilityGuard],
    data: { feature: 'publicTrackingPrototype' },
    loadComponent: () => import('./components/seguimiento-tramite/seguimiento-tramite.component').then((m) => m.SeguimientoTramiteComponent)
  },
  {
    path: 'detalle-revisor/:id',
    title: 'Detalle de la solicitud',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'REVISOR'] },
    loadComponent: () => import('./components/detalle-revisor/detalle-revisor.component').then((m) => m.DetalleRevisorComponent)
  },
  {
    path: 'gestion-usuarios',
    title: 'Gestión de usuarios',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./components/gestion-usuarios/gestion-usuarios.component').then((m) => m.GestionUsuariosComponent)
  },
  {
    path: 'dashboard-revisor',
    title: 'Panel de indicadores',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'REVISOR'], feature: 'reviewerDashboardPrototype' },
    loadComponent: () => import('./components/dashboard-revisor/dashboard-revisor.component').then((m) => m.DashboardRevisorComponent)
  },
  {
    path: 'nueva-queja',
    title: 'Registro de queja',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR', 'USUARIO'], feature: 'complaintIntakePrototype' },
    loadComponent: () => import('./components/formulario-queja/formulario-queja.component').then((m) => m.FormularioQuejaComponent)
  },
  {
    path: 'solicitud-acompanamiento',
    title: 'Solicitud de acompañamiento',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR', 'USUARIO'] },
    loadComponent: () => import('./components/formulario-acompanamiento/formulario-acompanamiento.component').then((m) => m.FormularioAcompanamientoComponent)
  },
  {
    path: 'gestion-sistema',
    title: 'Gestión de listas maestras',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./components/gestion-listas/gestion-listas.component').then((m) => m.GestionListasComponent)
  },
  {
    path: 'mis-asignaciones',
    title: 'Mis asignaciones',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'], feature: 'assignmentsPrototype' },
    loadComponent: () => import('./components/mis-asignaciones/mis-asignaciones.component').then((m) => m.MisAsignacionesComponent)
  },
  {
    path: 'detalle-acompanamiento/:id',
    title: 'Gestión de contacto',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'] },
    loadComponent: () => import('./components/gestion-contacto/gestion-contacto.component').then((m) => m.DetalleAcompanamientoComponent)
  },
  {
    path: 'consulta',
    title: 'Consulta de solicitudes',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'] },
    loadComponent: () => import('./components/consulta/consulta.component').then((m) => m.ConsultaComponent)
  },
  {
    path: 'registro-caso',
    title: 'Registro de caso',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'] },
    loadComponent: () => import('./components/registro-caso/registro-caso.component').then((m) => m.RegistroCasoComponent)
  },
  {
    path: 'caso',
    title: 'Casos',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'] },
    loadComponent: () => import('./components/caso/caso.component').then((m) => m.CasoComponent)
  },
  {
    path: 'registro-atencion',
    title: 'Registro de atención',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'] },
    loadComponent: () => import('./components/registro-atencion/registro-atencion.component').then((m) => m.RegistroAtencionComponent)
  },
  {
    path: 'cita',
    title: 'Agenda de citas',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'] },
    loadComponent: () => import('./components/cita/cita.component').then((m) => m.CitaComponent)
  },
  {
    path: 'linea-alma/atencion-pr',
    title: 'Atención de primer respondiente — Línea ALMA',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'] },
    loadComponent: () => import('./components/linea-alma/atencion-pr/atencion-pr.component').then((m) => m.AtencionPrComponent)
  },
  {
    path: 'acceso-denegado',
    title: 'Acceso denegado',
    loadComponent: () => import('./components/acceso-denegado/acceso-denegado.component').then((m) => m.AccesoDenegadoComponent)
  },
  {
    path: 'funcionalidad-no-disponible',
    title: 'Funcionalidad no disponible',
    loadComponent: () => import('./components/funcionalidad-no-disponible/funcionalidad-no-disponible.component').then((m) => m.FuncionalidadNoDisponibleComponent)
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
