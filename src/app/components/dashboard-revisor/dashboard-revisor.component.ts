import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-revisor',
  standalone: true,
  imports: [
    CommonModule, 
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
  stats = {
    total: 156,
    mujeres: 92,
    hombres: 64,
    estudiantes: 85,
    docentes: 42,
    administrativos: 29
  };

  dataSourceQuejas = [
    { id: 'CAS-1029', fecha: '2025-12-18', victima: 'Estudiante', estado: 'Indagación' },
    { id: 'CAS-0982', fecha: '2025-12-17', victima: 'Docente', estado: 'Investigación' },
    { id: 'CAS-1105', fecha: '2025-12-19', victima: 'Administrativo', estado: 'Recepción' },
  ];

  dataSourceAcompanamiento = [
    { id: 'ACO-1029', fecha: '2025-12-18', estado: 'Sin agendar' },
    { id: 'ACO-0982', fecha: '2025-12-17', estado: 'Sin agendar' },
    { id: 'ACO-1105', fecha: '2025-12-19', estado: 'Sin agendar' },
  ];
  displayedColumnsQuejas: string[] = ['id', 'fecha', 'victima', 'estado', 'accion'];
  displayedColumnsAcompanamiento: string[] = ['id', 'fecha', 'estado', 'accion'];
}
