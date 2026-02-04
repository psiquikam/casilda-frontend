import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ModalDetalleSolicitudComponent } from '../components/modal-detalle-solicitud/modal-detalle-solicitud.component';
@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatTableModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatCardModule,
    MatInputModule, MatDialogModule
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

  private dialog = inject(MatDialog);

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
      telefono: '6012345', correoInst: 'juan.perez@U.edu.co', correoPers: 'juanp@gmail.com',
      remitentePrimerNombre: 'Juan', remitenteSegundoNombre: 'Antonio', remitentePrimerApellido: 'Pérez', remitenteSegundoApellido: 'García',
      pacientePrimerNombre: 'Juan', pacienteSegundoNombre: 'Antonio', pacientePrimerApellido: 'Pérez', pacienteSegundoApellido: 'García',
      observaciones: 'Requiere seguimiento semanal por estrés académico.', prioridad: 'Alta', ultimaAccion: 'Entrevista inicial completada'
    },
    {
      id: 'ACO-0982', nombre: 'María García', documento: '52637485', fecha: '2025-12-01',
      dependencia: 'Jurídica', profesional: 'Abog. Carlos Ruiz', estado: 'Cerrado',
      tipoSolicitud: 'Asesoría', facultad: 'Derecho', campus: 'Norte',
      genero: 'Femenino', edad: 25, celular: '3119876543', cargo: 'Egresada',
      telefono: '6019876', correoInst: 'm.garcia@U.edu.co', correoPers: 'mariag@outlook.com',
      remitentePrimerNombre: 'María', remitenteSegundoNombre: '', remitentePrimerApellido: 'García', remitenteSegundoApellido: 'López',
      pacientePrimerNombre: 'María', pacienteSegundoNombre: '', pacientePrimerApellido: 'García', pacienteSegundoApellido: 'López',
      observaciones: 'Caso cerrado tras conciliación exitosa.', prioridad: 'Baja', ultimaAccion: 'Cierre de expediente'
    },
    {
      id: 'CAS-1025', nombre: 'Andrés Mendoza', documento: '10982233', fecha: '2026-01-10',
      dependencia: 'Bienestar', profesional: 'Ps. Ana López', estado: 'Abierto en transición',
      tipoSolicitud: 'Psicosocial', facultad: 'Artes', campus: 'Sur',
      genero: 'Masculino', edad: 19, celular: '3156677889', cargo: 'Estudiante',
      telefono: '6015544', correoInst: 'a.mendoza@U.edu.co', correoPers: 'andres_m@gmail.com',
      remitentePrimerNombre: 'Andrés', remitenteSegundoNombre: 'Felipe', remitentePrimerApellido: 'Mendoza', remitenteSegundoApellido: 'Ruiz',
      pacientePrimerNombre: 'Andrés', pacienteSegundoNombre: 'Felipe', pacientePrimerApellido: 'Mendoza', pacienteSegundoApellido: 'Ruiz',
      observaciones: 'Remitido de sede Sur para atención especializada.', prioridad: 'Media', ultimaAccion: 'Remisión enviada'
    },
    {
      id: 'CAS-1030', nombre: 'Lucía Fernández', documento: '32445566', fecha: '2026-01-12',
      dependencia: 'Salud', profesional: 'Dr. Jaime Luna', estado: 'Abierto activo',
      tipoSolicitud: 'Médica', facultad: 'Medicina', campus: 'Principal',
      genero: 'Femenino', edad: 21, celular: '3209988776', cargo: 'Estudiante',
      telefono: '6012233', correoInst: 'l.fernandez@U.edu.co', correoPers: 'lucia.f@gmail.com',
      remitentePrimerNombre: 'Lucía', remitenteSegundoNombre: '', remitentePrimerApellido: 'Fernández', remitenteSegundoApellido: 'Castro',
      pacientePrimerNombre: 'Lucía', pacienteSegundoNombre: '', pacientePrimerApellido: 'Fernández', pacienteSegundoApellido: 'Castro',
      observaciones: 'Paciente con cuadro de migraña recurrente.', prioridad: 'Media', ultimaAccion: 'Exámenes ordenados'
    },
    {
      id: 'ACO-1100', nombre: 'Carlos Prado', documento: '80112233', fecha: '2026-01-15',
      dependencia: 'Jurídica', profesional: 'Abog. Elena Soler', estado: 'Abierto activo',
      tipoSolicitud: 'Asesoría', facultad: 'Administración', campus: 'Norte',
      genero: 'Masculino', edad: 35, celular: '3104433221', cargo: 'Docente',
      telefono: '6014455', correoInst: 'c.prado@U.edu.co', correoPers: 'carlosp@live.com',
      remitentePrimerNombre: 'Carlos', remitenteSegundoNombre: 'Iván', remitentePrimerApellido: 'Prado', remitenteSegundoApellido: 'Vidal',
      pacientePrimerNombre: 'Carlos', pacienteSegundoNombre: 'Iván', pacientePrimerApellido: 'Prado', pacienteSegundoApellido: 'Vidal',
      observaciones: 'Asesoría sobre propiedad intelectual de investigación.', prioridad: 'Alta', ultimaAccion: 'Revisión de contrato'
    },
    {
      id: 'CAS-1045', nombre: 'Diana Holguín', documento: '11223344', fecha: '2026-01-18',
      dependencia: 'Bienestar', profesional: 'Ps. Ana López', estado: 'Abierto en transición',
      tipoSolicitud: 'Psicosocial', facultad: 'Ciencias', campus: 'Principal',
      genero: 'Femenino', edad: 20, celular: '3187766554', cargo: 'Estudiante',
      telefono: '6017788', correoInst: 'd.holguin@U.edu.co', correoPers: 'diana.h@gmail.com',
      remitentePrimerNombre: 'Diana', remitenteSegundoNombre: 'Marcela', remitentePrimerApellido: 'Holguín', remitenteSegundoApellido: 'Torres',
      pacientePrimerNombre: 'Diana', pacienteSegundoNombre: 'Marcela', pacientePrimerApellido: 'Holguín', pacienteSegundoApellido: 'Torres',
      observaciones: 'Cambio de jornada solicitado por motivos laborales.', prioridad: 'Baja', ultimaAccion: 'Validando certificados'
    },
    {
      id: 'ACO-1215', nombre: 'Roberto Gómez', documento: '79554433', fecha: '2026-01-20',
      dependencia: 'Seguridad', profesional: 'Of. Mario Sosa', estado: 'Cerrado',
      tipoSolicitud: 'Reporte', facultad: 'Ingeniería', campus: 'Principal',
      genero: 'Masculino', edad: 42, celular: '3005544332', cargo: 'Administrativo',
      telefono: '6019900', correoInst: 'r.gomez@U.edu.co', correoPers: 'roberto.g@gmail.com',
      remitentePrimerNombre: 'Roberto', remitenteSegundoNombre: '', remitentePrimerApellido: 'Gómez', remitenteSegundoApellido: 'Sanz',
      pacientePrimerNombre: 'Roberto', pacienteSegundoNombre: '', pacientePrimerApellido: 'Gómez', pacienteSegundoApellido: 'Sanz',
      observaciones: 'Reporte de extravío de carnet institucional.', prioridad: 'Baja', ultimaAccion: 'Reposición entregada'
    },
    {
      id: 'CAS-1060', nombre: 'Sofía Reyes', documento: '10109988', fecha: '2026-01-22',
      dependencia: 'Bienestar', profesional: 'Ps. Martha Pinzón', estado: 'Abierto activo',
      tipoSolicitud: 'Psicosocial', facultad: 'Psicología', campus: 'Sur',
      genero: 'Femenino', edad: 23, celular: '3123344556', cargo: 'Estudiante',
      telefono: '6011122', correoInst: 's.reyes@U.edu.co', correoPers: 'sofi.r@outlook.com',
      remitentePrimerNombre: 'Sofía', remitenteSegundoNombre: '', remitentePrimerApellido: 'Reyes', remitenteSegundoApellido: 'Díaz',
      pacientePrimerNombre: 'Sofía', pacienteSegundoNombre: '', pacientePrimerApellido: 'Reyes', pacienteSegundoApellido: 'Díaz',
      observaciones: 'Dificultades de aprendizaje en materias cuantitativas.', prioridad: 'Media', ultimaAccion: 'Cita psicopedagogía'
    },
    {
      id: 'CAS-1080', nombre: 'Mateo Ortiz', documento: '10556644', fecha: '2026-01-25',
      dependencia: 'Salud', profesional: 'Enf. Rosa Alba', estado: 'Abierto en transición',
      tipoSolicitud: 'Médica', facultad: 'Educación', campus: 'Norte',
      genero: 'Masculino', edad: 21, celular: '3162233445', cargo: 'Estudiante',
      telefono: '6013344', correoInst: 'm.ortiz@U.edu.co', correoPers: 'mateo_o@gmail.com',
      remitentePrimerNombre: 'Mateo', remitenteSegundoNombre: 'David', remitentePrimerApellido: 'Ortiz', remitenteSegundoApellido: 'Mora',
      pacientePrimerNombre: 'Mateo', pacienteSegundoNombre: 'David', pacientePrimerApellido: 'Ortiz', pacienteSegundoApellido: 'Mora',
      observaciones: 'Validación de incapacidad externa por cirugía.', prioridad: 'Alta', ultimaAccion: 'Documentos en revisión médica'
    },
    {
      id: 'ACO-1350', nombre: 'Valentina Peña', documento: '10002233', fecha: '2026-01-28',
      dependencia: 'Bienestar', profesional: 'Ps. Ana López', estado: 'Cerrado',
      tipoSolicitud: 'Psicosocial', facultad: 'Ingeniería', campus: 'Principal',
      genero: 'Femenino', edad: 18, celular: '3198877665', cargo: 'Estudiante',
      telefono: '6018899', correoInst: 'v.pena@U.edu.co', correoPers: 'valenp@gmail.com',
      remitentePrimerNombre: 'Valentina', remitenteSegundoNombre: '', remitentePrimerApellido: 'Peña', remitenteSegundoApellido: 'Lara',
      pacientePrimerNombre: 'Valentina', pacienteSegundoNombre: '', pacientePrimerApellido: 'Peña', pacienteSegundoApellido: 'Lara',
      observaciones: 'Taller de inducción para estudiantes nuevos.', prioridad: 'Baja', ultimaAccion: 'Diploma de participación entregado'
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

  abrirModal(element: any, modo: 'editar' | 'visualizar') {
    this.dialog.open(ModalDetalleSolicitudComponent, {
      width: '1000px',
      maxHeight: '95vh',
      data: { info: element, modo: modo },
      panelClass: 'custom-modal-container',
      autoFocus: false
    });
  }
}