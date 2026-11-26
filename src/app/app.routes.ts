import { Routes } from '@angular/router';
import { featureCapabilityGuard } from './core/features/feature-capability.guard';
import { authGuard } from './services/auth.guard';
import { roleGuard } from './services/role.guard';
import { cambiosSinGuardarGuard } from './core/navegacion/cambios-sin-guardar.guard';
import { ROLES_UAD } from './services/auth.service';

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
    path: 'registro',
    title: 'Registro',
    loadComponent: () => import('./components/auth/register/register.component').then((m) => m.RegisterComponent)
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
    // «Reportar Caso» de Mis Solicitudes (rol USUARIO): mismo formulario multipaso del
    // canal público, en modo autenticado (ver ModoReporte en formulario-anonimo.component.ts).
    path: 'reportar-caso',
    title: 'Reportar caso',
    canActivate: [roleGuard],
    data: { roles: ['USUARIO'], modoReporte: 'autenticado' },
    loadComponent: () => import('./components/formulario-anonimo/formulario-anonimo.component').then((m) => m.FormularioAnonimoComponent)
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
    // Gestor de contenidos del home (rol GESTOR_CONTENIDO, rol_id 6). Admin entra
    // por la regla general de `roleGuard`. Las tres vistas comparten carga diferida.
    path: 'gestion-contenidos',
    canActivate: [roleGuard],
    data: { roles: ['GESTOR_CONTENIDO'] },
    children: [
      {
        path: '',
        title: 'Contenidos del inicio',
        loadComponent: () => import('./components/gestion-contenidos/gestion-contenidos.component').then((m) => m.GestionContenidosComponent)
      },
      {
        path: 'nuevo',
        title: 'Nuevo contenido del inicio',
        canDeactivate: [cambiosSinGuardarGuard],
        loadComponent: () => import('./components/gestion-contenidos/editor-contenido/editor-contenido.component').then((m) => m.EditorContenidoComponent)
      },
      {
        path: ':id',
        title: 'Editar contenido del inicio',
        canDeactivate: [cambiosSinGuardarGuard],
        loadComponent: () => import('./components/gestion-contenidos/editor-contenido/editor-contenido.component').then((m) => m.EditorContenidoComponent)
      }
    ]
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
    title: 'Nueva solicitud',
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
    title: 'Bandeja de contacto',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'], feature: 'assignmentsPrototype' },
    loadComponent: () => import('./components/gestion-contacto/gestion-contacto.component').then((m) => m.DetalleAcompanamientoComponent)
  },
  {
    path: 'detalle-acompanamiento/:id',
    title: 'Gestión de contacto',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'] },
    loadComponent: () => import('./components/gestion-contacto/gestion-contacto.component').then((m) => m.DetalleAcompanamientoComponent)
  },
  {
    path: 'consulta',
    title: 'Bandeja de reparto',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR'] },
    loadComponent: () => import('./components/consulta/consulta.component').then((m) => m.ConsultaComponent)
  },
  {
    path: 'registro-caso',
    pathMatch: 'full',
    title: 'Registrar primera atención',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL'] },
    loadComponent: () => import('./components/registro-caso/registro-caso.component').then((m) => m.RegistroCasoComponent)
  },
  {
    path: 'caso',
    pathMatch: 'full',
    redirectTo: 'registro-atencion'
  },
  {
    path: 'registro-atencion',
    title: 'Casos',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'] },
    loadComponent: () => import('./components/equipo-atencion-casos/casos-equipo.component').then((m) => m.CasosEquipoComponent)
  },
  {
    path: 'cita',
    title: 'Citas y agendamiento',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'PROFESIONAL', 'REVISOR'] },
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
    // Módulo Línea Alma, submódulos APH (Hinara) y Psicología (Jonathan): cada uno con su `routes.ts`.
    // El permiso fino por pantalla lo impone `almaPermisoGuard`; `roleGuard` solo exige sesión.
    path: 'linea-alma/aph',
    canActivate: [roleGuard],
    data: { roles: ['COORDINADOR', 'PROFESIONAL', 'TECNICO_APH', 'REVISOR'] },
    loadChildren: () => import('./linea-alma/aph/routes').then((m) => m.APH_ROUTES)
  },
  {
    path: 'linea-alma/psicologia',
    canActivate: [roleGuard],
    data: { roles: ['COORDINADOR', 'PROFESIONAL', 'TECNICO_APH', 'REVISOR'] },
    loadChildren: () => import('./linea-alma/psicologia/routes').then((m) => m.PSICOLOGIA_ROUTES)
  },
  {
    path: 'seguridad',
    loadChildren: () => import('./seguridad-personas-bienes/seguridad-personas-bienes.routes').then((m) => m.SEGURIDAD_ROUTES)
  },
  {
    // «Mis reportes» de quien radicó con su sesión (rol USUARIO; ADMIN por la regla general de `roleGuard`).
    // El dueño de cada reporte lo filtra el servidor. Detrás del flag `uadMisReportes` (apagado en producción
    // hasta que Backend despliegue la Entrega 3). Contrato: docs/contratos/uad/openapi-uad.yaml.
    path: 'mis-reportes',
    canMatch: [featureCapabilityGuard],
    canActivate: [roleGuard],
    data: { roles: ['USUARIO'], feature: 'uadMisReportes' },
    loadChildren: () => import('./uad/mis-reportes.routes').then((m) => m.MIS_REPORTES_ROUTES)
  },
  {
    // Queja anónima ante la UAD (NDA): ruta PÚBLICA, declarada antes de `uad` para no pasar por su
    // `roleGuard`. Detrás del flag `uadQuejaAnonima` (apagado en producción hasta que exista el endpoint).
    path: 'uad/queja-anonima',
    canMatch: [featureCapabilityGuard],
    data: { feature: 'uadQuejaAnonima' },
    loadChildren: () => import('./uad/queja-anonima.routes').then((m) => m.QUEJA_ANONIMA_ROUTES)
  },
  {
    // Módulo UAD Equipos 3 y 4 (bandejas NDI/NDA, evaluación preliminar y casos). Roles del catálogo
    // propuesto (aún no creados en el backend); ADMIN entra por la regla general de `roleGuard`.
    // Contrato: docs/contratos/uad/openapi-uad.yaml.
    path: 'uad',
    canActivate: [roleGuard],
    data: { roles: [...ROLES_UAD] },
    loadChildren: () => import('./uad/routes').then((m) => m.UAD_ROUTES)
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
