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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ModalDetalleSolicitudComponent } from '../modal-detalle-solicitud/modal-detalle-solicitud.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consulta',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatTableModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatCardModule,
    MatInputModule, MatDialogModule, MatPaginatorModule
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

  constructor(private dialog: MatDialog) { }

  private router = inject(Router);

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'documento', 'fecha', 'dependencia', 'profesional', 'acciones'];
  expandedElement: any | null;
  expandedDetailColumns: string[] = ['expandedDetail'];

  dataSourceActivos = new MatTableDataSource<any>([]);
  dataSourceTransicion = new MatTableDataSource<any>([]);
  dataSourceCerrados = new MatTableDataSource<any>([]);
  dataSourceSinRepartir = new MatTableDataSource<any>([]);


  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    dependencia: '',
    profesional: ''
  };

  datosSimulados = [

    {
      id: 'CAS-3001',
      estado: 'Sin asignar',
      profesional: 'Sin asignar',
      fecha: '2026-02-01',
      dependencia: 'Bienestar',

      remitenteTipoSolicitud: 'Psicosocial',
      remitentePrimerNombre: 'Laura',
      remitenteSegundoNombre: 'Marcela',
      remitentePrimerApellido: 'Gómez',
      remitenteSegundoApellido: 'Ruiz',
      remitenteCargo: 'Docente',
      remitenteCampus: 'Principal',
      remitenteDependencia: 'Bienestar',
      remitenteFacultad: 'Ingeniería',
      remitenteOtraFacultad: '',
      remitenteFechaSolicitud: '2026-02-01',
      remitenteTipoDocumento: 'CC',
      remitenteNumeroDocumento: '100200300',

      tipoDocumento: 'CC',
      numeroDocumento: '100200300',
      fechaNacimiento: null,
      primerNombre: 'Carlos',
      segundoNombre: 'Andrés',
      primerApellido: 'Gómez',
      segundoApellido: 'Ruiz',
      identidadGenero: 'Masculino',
      celular: '3001112233',
      telefonoAlterno: '6011234',
      correoInstitucional: 'c.gomez@u.edu.co',
      correoPersonal: 'carlos@gmail.com'
    },
    {
      id: 'CAS-3002',
      estado: 'Sin asignar',
      profesional: 'Sin asignar',
      fecha: '2026-02-02',
      dependencia: 'Salud',

      remitenteTipoSolicitud: 'Médica',
      remitentePrimerNombre: 'Andrés',
      remitenteSegundoNombre: '',
      remitentePrimerApellido: 'Torres',
      remitenteSegundoApellido: 'López',
      remitenteCargo: 'Administrativo',
      remitenteCampus: 'Norte',
      remitenteDependencia: 'Salud',
      remitenteFacultad: 'Medicina',
      remitenteOtraFacultad: '',
      remitenteFechaSolicitud: '2026-02-02',
      remitenteTipoDocumento: 'CC',
      remitenteNumeroDocumento: '200300400',

      tipoDocumento: 'CC',
      numeroDocumento: '200300400',
      fechaNacimiento: null,
      primerNombre: 'Daniela',
      segundoNombre: '',
      primerApellido: 'Torres',
      segundoApellido: 'López',
      identidadGenero: 'Femenino',
      celular: '3012223344',
      telefonoAlterno: '6015678',
      correoInstitucional: 'd.torres@u.edu.co',
      correoPersonal: 'daniela@gmail.com'
    },

    {
      id: 'CAS-3003',
      estado: 'Abierto activo',
      profesional: 'Ps. Ana López',
      fecha: '2026-02-03',
      dependencia: 'Bienestar',

      remitenteTipoSolicitud: 'Psicosocial',
      remitentePrimerNombre: 'Miguel',
      remitenteSegundoNombre: '',
      remitentePrimerApellido: 'Ramírez',
      remitenteSegundoApellido: 'Castro',
      remitenteCargo: 'Estudiante',
      remitenteCampus: 'Sur',
      remitenteDependencia: 'Bienestar',
      remitenteFacultad: 'Artes',
      remitenteOtraFacultad: '',
      remitenteFechaSolicitud: '2026-02-03',
      remitenteTipoDocumento: 'CC',
      remitenteNumeroDocumento: '300400500',

      tipoDocumento: 'CC',
      numeroDocumento: '300400500',
      fechaNacimiento: null,
      primerNombre: 'Miguel',
      segundoNombre: '',
      primerApellido: 'Ramírez',
      segundoApellido: 'Castro',
      identidadGenero: 'Masculino',
      celular: '3023334455',
      telefonoAlterno: '6016789',
      correoInstitucional: 'm.ramirez@u.edu.co',
      correoPersonal: 'miguel@gmail.com'
    },
    {
      id: 'CAS-3004',
      estado: 'Abierto activo',
      profesional: 'Dr. Jaime Luna',
      fecha: '2026-02-04',
      dependencia: 'Salud',

      remitenteTipoSolicitud: 'Médica',
      remitentePrimerNombre: 'Valentina',
      remitenteSegundoNombre: '',
      remitentePrimerApellido: 'Morales',
      remitenteSegundoApellido: 'Díaz',
      remitenteCargo: 'Docente',
      remitenteCampus: 'Principal',
      remitenteDependencia: 'Salud',
      remitenteFacultad: 'Medicina',
      remitenteOtraFacultad: '',
      remitenteFechaSolicitud: '2026-02-04',
      remitenteTipoDocumento: 'CC',
      remitenteNumeroDocumento: '400500600',

      tipoDocumento: 'CC',
      numeroDocumento: '400500600',
      fechaNacimiento: null,
      primerNombre: 'Valentina',
      segundoNombre: '',
      primerApellido: 'Morales',
      segundoApellido: 'Díaz',
      identidadGenero: 'Femenino',
      celular: '3034445566',
      telefonoAlterno: '6017890',
      correoInstitucional: 'v.morales@u.edu.co',
      correoPersonal: 'valentina@gmail.com'
    },

    {
      id: 'CAS-3005',
      estado: 'Abierto en transición',
      profesional: 'Ps. Ana López',
      fecha: '2026-02-05',
      dependencia: 'Bienestar',

      remitenteTipoSolicitud: 'Psicosocial',
      remitentePrimerNombre: 'Camilo',
      remitenteSegundoNombre: '',
      remitentePrimerApellido: 'Ortiz',
      remitenteSegundoApellido: 'Vega',
      remitenteCargo: 'Estudiante',
      remitenteCampus: 'Principal',
      remitenteDependencia: 'Bienestar',
      remitenteFacultad: 'Ingeniería',
      remitenteOtraFacultad: '',
      remitenteFechaSolicitud: '2026-02-05',
      remitenteTipoDocumento: 'CC',
      remitenteNumeroDocumento: '500600700',

      tipoDocumento: 'CC',
      numeroDocumento: '500600700',
      fechaNacimiento: null,
      primerNombre: 'Camilo',
      segundoNombre: '',
      primerApellido: 'Ortiz',
      segundoApellido: 'Vega',
      identidadGenero: 'Masculino',
      celular: '3045556677',
      telefonoAlterno: '6018901',
      correoInstitucional: 'c.ortiz@u.edu.co',
      correoPersonal: 'camilo@gmail.com'
    },
    {
      id: 'CAS-3006',
      estado: 'Cerrado',
      profesional: 'Abog. Elena Soler',
      fecha: '2026-02-06',
      dependencia: 'Jurídica',

      remitenteTipoSolicitud: 'Asesoría',
      remitentePrimerNombre: 'Natalia',
      remitenteSegundoNombre: '',
      remitentePrimerApellido: 'Pardo',
      remitenteSegundoApellido: 'Luna',
      remitenteCargo: 'Egresada',
      remitenteCampus: 'Norte',
      remitenteDependencia: 'Jurídica',
      remitenteFacultad: 'Derecho',
      remitenteOtraFacultad: '',
      remitenteFechaSolicitud: '2026-02-06',
      remitenteTipoDocumento: 'CC',
      remitenteNumeroDocumento: '600700800',

      tipoDocumento: 'CC',
      numeroDocumento: '600700800',
      fechaNacimiento: null,
      primerNombre: 'Natalia',
      segundoNombre: '',
      primerApellido: 'Pardo',
      segundoApellido: 'Luna',
      identidadGenero: 'Femenino',
      celular: '3056667788',
      telefonoAlterno: '6019012',
      correoInstitucional: 'n.pardo@u.edu.co',
      correoPersonal: 'natalia@gmail.com'
    }

  ];

  ngOnInit() {
    this.inicializarTablas();
  }

  inicializarTablas() {
    this.dataSourceSinRepartir.data = this.datosSimulados.filter(c =>
      c.profesional === 'Sin asignar'
    );

    this.dataSourceActivos.data = this.datosSimulados.filter(c =>
      c.estado === 'Abierto activo' && c.profesional !== 'Sin asignar'
    );

    this.dataSourceTransicion.data = this.datosSimulados.filter(c =>
      c.estado === 'Abierto en transición'
    );

    this.dataSourceCerrados.data = this.datosSimulados.filter(c =>
      c.estado === 'Cerrado'
    );
    const filterPredicate = this.createFilter();
    [this.dataSourceSinRepartir, this.dataSourceActivos, this.dataSourceTransicion, this.dataSourceCerrados]
      .forEach(ds => ds.filterPredicate = filterPredicate);
  }

  setFilterPredicates() {
    const filterPredicate = this.createFilter();
    [
      this.dataSourceSinRepartir,
      this.dataSourceActivos,
      this.dataSourceTransicion,
      this.dataSourceCerrados
    ].forEach(ds => ds.filterPredicate = filterPredicate);
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    const filterString = JSON.stringify(this.filterValues);

    [
      this.dataSourceSinRepartir,
      this.dataSourceActivos,
      this.dataSourceTransicion,
      this.dataSourceCerrados
    ].forEach(ds => {
      ds.filter = filterString;
      if (ds.paginator) ds.paginator.firstPage();
    });
  }

  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      const nombreCompleto = `
      ${data.primerNombre || ''} 
      ${data.segundoNombre || ''} 
      ${data.primerApellido || ''} 
      ${data.segundoApellido || ''}
    `.toLowerCase();

      const documentoCompleto = `
      ${data.tipoDocumento || ''} 
      ${data.numeroDocumento || ''}
    `.toLowerCase();

      return (!searchTerms.id || data.id?.toLowerCase().includes(searchTerms.id))
        && (!searchTerms.nombre || nombreCompleto.includes(searchTerms.nombre))
        && (!searchTerms.documento || documentoCompleto.includes(searchTerms.documento))
        && (!searchTerms.fecha || data.fecha?.toLowerCase().includes(searchTerms.fecha))
        && (!searchTerms.dependencia || data.dependencia?.toLowerCase().includes(searchTerms.dependencia))
        && (!searchTerms.profesional || data.profesional?.toLowerCase().includes(searchTerms.profesional));
    };
  }

  abrirModal(element: any, modo: 'editar' | 'visualizar') {
    const dialogRef = this.dialog.open(ModalDetalleSolicitudComponent, {
      width: '1000px',
      maxHeight: '95vh',
      data: { info: element, modo: modo },
      panelClass: 'custom-modal-container',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && modo === 'editar') {

        Object.assign(element, result);

        this.inicializarTablas();
      }
    });
  }

  eliminarCaso(element: any): void {

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar caso',
        mensaje: `¿Seguro que deseas eliminar el caso ${element.id}?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.datosSimulados = this.datosSimulados.filter(e => e !== element);
        this.inicializarTablas();
      }
    });
  }

  irAReparto(element: any) {
    this.router.navigate(['/reparto', element.id]);
  }

  get totalSinRepartir(): number {
    return this.dataSourceSinRepartir.data.length;
  }

  get totalCerrado(): number {
    return this.dataSourceCerrados.data.length;
  }

  get totalAbiertoActivo(): number {
    return this.dataSourceActivos.data.length;
  }

  get totalAbiertoTransicion(): number {
    return this.dataSourceTransicion.data.length;
  }
}