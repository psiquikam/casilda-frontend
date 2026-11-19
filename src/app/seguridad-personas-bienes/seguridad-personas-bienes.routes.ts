import { Routes } from '@angular/router';
import { roleGuard } from '../services/role.guard';

export const SEGURIDAD_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'bandeja',
    pathMatch: 'full'
  },
  {
    path: 'central',
    title: 'Central de monitoreo — SPyB',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'COORDINADOR', 'SPB_CENTRAL', 'SPB_COORDINACION', 'SPB_ANALISTA'] },
    loadComponent: () =>
      import('./pages/central-monitoreo/central-monitoreo.component').then((m) => m.CentralMonitoreoComponent)
  },
  {
    path: 'reportar',
    title: 'Reporte rápido de vigilancia — SPyB',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'SPB_VIGILANTE', 'SPB_CENTRAL', 'SPB_ANALISTA', 'SPB_COORDINACION'] },
    loadComponent: () =>
      import('./pages/vigilancia/reporte-novedad-vigilante.component').then((m) => m.ReporteNovedadVigilanteComponent)
  },
  {
    // Ruta de acceso restringido para vigilantes mediante enlace o código QR de orden
    path: 'orden/:tokenAcceso',
    title: 'Ejecución de acompañamiento — SPyB',
    loadComponent: () =>
      import('./pages/vigilancia/ejecutar-orden-vigilante.component').then((m) => m.EjecutarOrdenVigilanteComponent)
  },
  {
    path: 'bandeja',
    title: 'Consola del analista de riesgos — SPyB',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'SPB_ANALISTA', 'SPB_COORDINACION'] },
    loadComponent: () =>
      import('./pages/analista-riesgos/bandeja-analista.component').then((m) => m.BandejaAnalistaComponent)
  },
  {
    path: 'detalle/:id',
    title: 'Detalle de actuación — SPyB',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'SPB_ANALISTA', 'SPB_COORDINACION', 'SPB_CENTRAL'] },
    loadComponent: () =>
      import('./pages/analista-riesgos/detalle-registro.component').then((m) => m.DetalleRegistroComponent)
  },
  {
    path: 'indicadores',
    title: 'Indicadores SPyB — CASILDA',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'SPB_ANALISTA', 'SPB_COORDINACION'] },
    loadComponent: () =>
      import('./pages/analista-riesgos/indicadores-spyb.component').then((m) => m.IndicadoresSpybComponent)
  }
];

