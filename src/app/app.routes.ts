import { Routes } from '@angular/router';
import { FormularioQuejaComponent } from './components/formulario-queja/formulario-queja.component';
import { SeguimientoTramiteComponent } from './components/seguimiento-tramite/seguimiento-tramite.component';
import { DashboardRevisorComponent } from './components/dashboard-revisor/dashboard-revisor.component';
import { GestionUsuariosComponent } from './components/gestion-usuarios/gestion-usuarios.component';
import { DetalleRevisorComponent } from './components/detalle-revisor/detalle-revisor.component';
import { LoginComponent } from './components/auth/login/login.component';
import { authGuard } from './services/auth.guard';
import { roleGuard } from './services/role.guard';
import { AccesoDenegadoComponent } from './components/acceso-denegado/acceso-denegado.component';
import { FormularioAcompanamientoComponent } from './components/formulario-acompanamiento/formulario-acompanamiento.component';
import { GestionListasComponent } from './components/gestion-listas/gestion-listas.component';
import { RepartoAcompanamientoComponent } from './components/reparto-acompanamiento/reparto-acompanamiento.component';
import { MisAsignacionesComponent } from './components/mis-asignaciones/mis-asignaciones.component';
import { DetalleAcompanamientoComponent } from './components/detalle-acompanamiento/detalle-acompanamiento.component';
import { ConsultaComponent } from './components/consulta/consulta.component';
import { RegistroAtencionComponent } from './components/registro-atencion/registro-atencion.component';
import { CitaComponent } from './components/cita/cita.component';
   
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'seguimiento', component: SeguimientoTramiteComponent },
  { path: 'detalle-revisor/:id', component: DetalleRevisorComponent, canActivate: [authGuard] },

  {
    path: 'gestion-usuarios',
    component: GestionUsuariosComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] }
  },

  {
    path: 'dashboard-revisor',
    component: DashboardRevisorComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] }
  },

  {
    path: 'nueva-queja',
    component: FormularioQuejaComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor', 'Usuario'] }
  },

  {
    path: 'solicitud-acompanamiento',
    component: FormularioAcompanamientoComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor', 'Usuario'] }
  },

  {
    path: 'gestion-sistema',
    component: GestionListasComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] }
  },

  {
    path: 'reparto/:codigo',
    component: RepartoAcompanamientoComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] }
  },

  {
    path: 'mis-asignaciones',
    component: MisAsignacionesComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] }
  },

  {
    path: 'detalle-acompanamiento/:id',
    component: DetalleAcompanamientoComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] }
  },

  {
    path: 'consulta',
    component: ConsultaComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] }
  },

  {
    path: 'registro-atencion',
    component: RegistroAtencionComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] }
  },

  {
    path: 'cita',
    component: CitaComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin', 'Revisor'] }
  },

  { path: 'acceso-denegado', component: AccesoDenegadoComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];