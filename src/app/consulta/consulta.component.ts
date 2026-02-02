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
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatTableModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatCardModule,
    MatInputModule, RouterLink
  ],
  templateUrl: './consulta.component.html',
  styleUrls: ['./consulta.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ConsultaComponent implements OnInit {

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'documento', 'fecha', 'dependencia', 'profesional', 'acciones'];
  expandedElement: any | null;
  expandedDetailColumns: string[] = ['expandedDetail'];

  dataSourceActivos = new MatTableDataSource<any>([]);
  dataSourceTransicion = new MatTableDataSource<any>([]);
  dataSourceCerrados = new MatTableDataSource<any>([]);

  filterValues: any = { id: '', nombre: '', documento: '', profesional: '' };

  datosSimulados = [
    {
      id: 'CAS-1020', nombre: 'Juan Pérez', documento: '10203040', fecha: '2025-11-15',
      dependencia: 'Bienestar', profesional: 'Ps. Ana López', estado: 'Abierto activo',
      tipoSolicitud: 'Psicosocial', facultad: 'Ingeniería', campus: 'Principal',
      genero: 'Masculino', edad: 22, celular: '3001234567', cargo: 'Estudiante',
      telefono: '6012345', correoInst: 'juan.perez@U.edu.co', correoPers: 'juanp@gmail.com'
    },
    {
      id: 'ACO-0982', nombre: 'María García', documento: '52637485', fecha: '2025-12-01',
      dependencia: 'Jurídica', profesional: 'Abog. Carlos Ruiz', estado: 'Cerrado',
      tipoSolicitud: 'Asesoría', facultad: 'Derecho', campus: 'Norte',
      genero: 'Femenino', edad: 25, celular: '3119876543', cargo: 'Egresada',
      telefono: '6019876', correoInst: 'm.garcia@U.edu.co', correoPers: 'mariag@outlook.com'
    },
    {
      id: 'CAS-1105', nombre: 'Luis Torres', documento: '71829304', fecha: '2025-12-10',
      dependencia: 'Bienestar', profesional: 'Sin asignar', estado: 'Abierto en transición',
      tipoSolicitud: 'Apoyo Económico', facultad: 'Artes', campus: 'Robledo',
      genero: 'Masculino', edad: 19, celular: '3205554433', cargo: 'Estudiante',
      telefono: '6041122', correoInst: 'l.torres@U.edu.co', correoPers: 'luist12@gmail.com'
    },
    {
      id: 'ACO-1200', nombre: 'Elena Cano', documento: '43526172', fecha: '2025-11-20',
      dependencia: 'Salud', profesional: 'Ps. Martha Soler', estado: 'Cerrado',
      tipoSolicitud: 'Salud Mental', facultad: 'Medicina', campus: 'Salud',
      genero: 'Femenino', edad: 28, celular: '3157778899', cargo: 'Docente',
      telefono: '6048899', correoInst: 'elena.cano@U.edu.co', correoPers: 'elecano@yahoo.es'
    },
    {
      id: 'CAS-2030', nombre: 'Ricardo Luna', documento: '80999111', fecha: '2026-01-05',
      dependencia: 'Deportes', profesional: 'Ps. Ana López', estado: 'Abierto activo',
      tipoSolicitud: 'Alto Rendimiento', facultad: 'Educación Física', campus: 'Principal',
      genero: 'Masculino', edad: 21, celular: '3012223344', cargo: 'Estudiante',
      telefono: '6024455', correoInst: 'r.luna@U.edu.co', correoPers: 'ricluna@gmail.com'
    },
    {
      id: 'CAS-2055', nombre: 'Sofía Valdés', documento: '1000222333', fecha: '2026-01-12',
      dependencia: 'Bienestar', profesional: 'Sin asignar', estado: 'Abierto en transición',
      tipoSolicitud: 'Inclusión', facultad: 'Ciencias Sociales', campus: 'Norte',
      genero: 'Femenino', edad: 20, celular: '3124445566', cargo: 'Estudiante',
      telefono: '6033322', correoInst: 's.valdes@U.edu.co', correoPers: 'sofi.v@hotmail.com'
    }
  ];

  ngOnInit() {
    this.inicializarTablas();
  }

  inicializarTablas() {
    this.dataSourceActivos.data = this.datosSimulados.filter(c => c.estado === 'Abierto activo');
    this.dataSourceTransicion.data = this.datosSimulados.filter(c => c.estado === 'Abierto en transición');
    this.dataSourceCerrados.data = this.datosSimulados.filter(c => c.estado === 'Cerrado');

    const filterPredicate = this.createFilter();
    this.dataSourceActivos.filterPredicate = filterPredicate;
    this.dataSourceTransicion.filterPredicate = filterPredicate;
    this.dataSourceCerrados.filterPredicate = filterPredicate;
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