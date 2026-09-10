import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

export interface DistributionBar {
  label: string;
  count: number;
  porcentaje: number;
  icon?: string;
  colorClass?: string;
  customColor?: string;
}

@Component({
  selector: 'app-dashboard-revisor',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTableModule,
    RouterLink
  ],
  templateUrl: './dashboard-revisor.component.html',
  styleUrls: ['./dashboard-revisor.component.scss']
})
export class DashboardRevisorComponent {
  // Periodo seleccionado
  periodoSeleccionado = 'Año 2026 — Semestre 1';

  // Métricas inclusivas de caracterización y volumen
  stats = {
    total: 156,
    // Identidad de género inclusiva (no binaria, mujeres, hombres, disidencias)
    genero: [
      { label: 'Mujeres (Cis/Trans)', count: 88, porcentaje: 56.4, icon: 'female', colorKey: 'female' },
      { label: 'Personas No Binarias', count: 24, porcentaje: 15.4, icon: 'diversity_1', colorKey: 'nonbinary' },
      { label: 'Hombres (Cis/Trans)', count: 36, porcentaje: 23.1, icon: 'male', colorKey: 'male' },
      { label: 'Disidencias / Otras Identidades', count: 8, porcentaje: 5.1, icon: 'transgender', colorKey: 'diverse' }
    ],
    // Vínculo institucional UdeA
    vinculo: [
      { label: 'Estudiantes', count: 85, porcentaje: 54.5, icon: 'school', colorClass: 'student' },
      { label: 'Docentes', count: 42, porcentaje: 26.9, icon: 'history_edu', colorClass: 'teacher' },
      { label: 'Personal Administrativo', count: 21, porcentaje: 13.5, icon: 'badge', colorClass: 'admin' },
      { label: 'Egresados y Contratistas', count: 8, porcentaje: 5.1, icon: 'engineering', colorClass: 'contractor' }
    ],
    // Modalidades de violencia VBG
    modalidades: [
      { label: 'Violencia Psicológica', count: 72, porcentaje: 46.2, icon: 'psychology' },
      { label: 'Discriminación por Género u Orientación', count: 44, porcentaje: 28.2, icon: 'diversity_3' },
      { label: 'Violencia y Acoso Sexual', count: 31, porcentaje: 19.9, icon: 'shield' },
      { label: 'Violencia Física', count: 18, porcentaje: 11.5, icon: 'healing' },
      { label: 'Violencia Económica y Patrimonial', count: 12, porcentaje: 7.7, icon: 'account_balance' }
    ],
    // Estado del trámite
    estados: [
      { label: 'Citas Asignadas (Psicología / Derecho)', count: 52, porcentaje: 33.3, colorClass: 'progress-citas' },
      { label: 'En Recepción e Indagación Inicial', count: 48, porcentaje: 30.8, colorClass: 'progress-recepcion' },
      { label: 'En Acompañamiento Activo (Expediente)', count: 41, porcentaje: 26.3, colorClass: 'progress-activo' },
      { label: 'Cierre con Acuerdos y Remisión', count: 15, porcentaje: 9.6, colorClass: 'progress-cierre' }
    ],
    // Sedes y Campus UdeA
    sedes: [
      { label: 'Medellín (Ciudad Universitaria)', count: 94, porcentaje: 60.3, icon: 'apartment' },
      { label: 'Robledo y Área de la Salud', count: 31, porcentaje: 19.9, icon: 'local_hospital' },
      { label: 'Seccional Oriente (El Carmen)', count: 17, porcentaje: 10.9, icon: 'nature' },
      { label: 'Seccional Urabá (Apartadó)', count: 14, porcentaje: 9.0, icon: 'water' }
    ],
    // KPIs de operación
    kpis: {
      tiempoRespuesta: '< 24 h',
      medidasProteccion: 19,
      citasActivas: 52,
      satisfaccionAcompanamiento: '96%'
    }
  };

  dataSourceQuejas = [
    { id: 'CAS-1029', fecha: '2026-02-18', victima: 'Estudiante', identidad: 'Persona No Binaria', estado: 'Indagación' },
    { id: 'CAS-0982', fecha: '2026-02-17', victima: 'Docente', identidad: 'Mujer', estado: 'Investigación' },
    { id: 'CAS-1105', fecha: '2026-02-19', victima: 'Administrativo', identidad: 'Hombre Trans', estado: 'Recepción' },
    { id: 'CAS-1120', fecha: '2026-02-20', victima: 'Estudiante', identidad: 'Mujer Trans', estado: 'Atención Activa' }
  ];

  dataSourceAcompanamiento = [
    { id: 'ACO-1029', fecha: '2026-02-18', tipo: 'Psicosocial', identidad: 'Persona No Binaria', estado: 'Cita Agendada' },
    { id: 'ACO-0982', fecha: '2026-02-17', tipo: 'Jurídico', identidad: 'Mujer', estado: 'Sin agendar' },
    { id: 'ACO-1105', fecha: '2026-02-19', tipo: 'Integral', identidad: 'Hombre', estado: 'En seguimiento' },
    { id: 'ACO-1142', fecha: '2026-02-21', tipo: 'Psicosocial', identidad: 'Género Fluido', estado: 'Cita Agendada' }
  ];

  displayedColumnsQuejas: string[] = ['id', 'fecha', 'victima', 'identidad', 'estado', 'accion'];
  displayedColumnsAcompanamiento: string[] = ['id', 'fecha', 'tipo', 'identidad', 'estado', 'accion'];
}
