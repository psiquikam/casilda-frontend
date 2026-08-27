import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-mis-asignaciones',
    imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, RouterLink],
    templateUrl: './mis-asignaciones.component.html',
    styleUrls: ['./mis-asignaciones.component.scss']
})
export class MisAsignacionesComponent {
  // Datos simulados de los casos asignados al profesional logueado
  misCasos = [
    { id: 'ACO-1029', fecha: '2025-12-18', victima: 'Laura V.', estado: 'Sin cita'},
    { id: 'ACO-0982', fecha: '2025-12-10', victima: 'Carlos D.', estado: 'Vencido'},
    { id: 'ACO-1105', fecha: '2025-12-19', victima: 'Ana M.', estado: 'Con cita'},
    { id: 'ACO-1200', fecha: '2025-12-20', victima: 'Pedro S.', estado: 'Cerrado'},
  ];

  displayedColumns: string[] = ['id', 'fecha', 'victima', 'estado', 'accion'];

  // Función para definir colores de los estados
  getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'sin cita': return 'status-warning';
      case 'con cita': return 'status-info';
      case 'vencido': return 'status-danger';
      case 'cerrado': return 'status-success';
      default: return '';
    }
  }
}