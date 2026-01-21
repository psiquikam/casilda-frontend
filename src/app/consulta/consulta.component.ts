import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatTableModule, 
    MatButtonModule, MatIconModule, MatChipsModule, MatCardModule,
    MatInputModule, RouterLink
  ],
  templateUrl: './consulta.component.html',
  styleUrls: ['./consulta.component.scss']
})
export class ConsultaComponent implements OnInit {
  
  displayedColumns: string[] = ['id', 'nombre', 'documento', 'fecha', 'dependencia', 'profesional', 'acciones'];
  
  dataSourceActivos = new MatTableDataSource<any>([]);
  dataSourceTransicion = new MatTableDataSource<any>([]);
  dataSourceCerrados = new MatTableDataSource<any>([]);

  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    profesional: ''
  };

  datosSimulados = [
    { id: 'CAS-1020', nombre: 'Juan Pérez', documento: '10203040', fecha: '2025-11-15', dependencia: 'Bienestar', profesional: 'Ps. Ana López', estado: 'Abierto activo' },
    { id: 'ACO-0982', nombre: 'María García', documento: '52637485', fecha: '2025-12-01', dependencia: 'Jurídica', profesional: 'Abog. Carlos Ruiz', estado: 'Abierto activo' },
    { id: 'CAS-1105', nombre: 'Luis Torres', documento: '71829304', fecha: '2025-12-10', dependencia: 'Bienestar', profesional: 'Sin asignar', estado: 'Abierto en transición' },
    { id: 'ACO-1200', nombre: 'Elena Cano', documento: '43526172', fecha: '2025-11-20', dependencia: 'Salud', profesional: 'Ps. Martha Soler', estado: 'Cerrado' }
  ];

  ngOnInit() {
    this.inicializarTablas();
  }

  inicializarTablas() {
    const activos = this.datosSimulados.filter(c => c.estado === 'Abierto activo');
    const transicion = this.datosSimulados.filter(c => c.estado === 'Abierto en transición');
    const cerrados = this.datosSimulados.filter(c => c.estado === 'Cerrado');

    this.dataSourceActivos.data = activos;
    this.dataSourceTransicion.data = transicion;
    this.dataSourceCerrados.data = cerrados;

    this.dataSourceActivos.filterPredicate = this.createFilter();
    this.dataSourceTransicion.filterPredicate = this.createFilter();
    this.dataSourceCerrados.filterPredicate = this.createFilter();
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    
    const filterString = JSON.stringify(this.filterValues);
    this.dataSourceActivos.filter = filterString;
    this.dataSourceTransicion.filter = filterString;
    this.dataSourceCerrados.filter = filterString;
  }

  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      return data.id.toLowerCase().includes(searchTerms.id)
        && data.nombre.toLowerCase().includes(searchTerms.nombre)
        && data.documento.toLowerCase().includes(searchTerms.documento)
        && data.profesional.toLowerCase().includes(searchTerms.profesional);
    };
  }
}