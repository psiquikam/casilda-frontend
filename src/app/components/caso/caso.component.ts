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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ModalDetalleSolicitudComponent } from '../modal-detalle-solicitud/modal-detalle-solicitud.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { RepartoModalComponent } from '../modal-reparto/modal-reparto.component';
import { Router } from '@angular/router';
import { SolicitudService } from '../../services/solicitud.service';
import { formatFechaCreacion } from '../../custom-date-adapter';

@Component({
  selector: 'app-caso',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatTableModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatCardModule,
    MatInputModule, MatDialogModule, MatPaginatorModule
  ],
  templateUrl: './caso.component.html',
  styleUrls: ['./caso.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CasoComponent implements OnInit {

  private solicitudService = inject(SolicitudService);
  private router = inject(Router);

  constructor(private dialog: MatDialog) { }

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'documento', 'fecha', 'dependencia', 'profesional', 'acciones'];
  expandedElement: any | null;
  expandedDetailColumns: string[] = ['expandedDetail'];

  dataSourceActivos = new MatTableDataSource<any>([]);
  dataSourceTransicion = new MatTableDataSource<any>([]);
  dataSourceCerrados = new MatTableDataSource<any>([]);
  dataSourceSinRepartir = new MatTableDataSource<any>([]);
  totalElementos = 0;
  pageIndex = 0;
  pageSize = 10;

  solicitudes: any[] = [];
  cargando = false;

  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    dependencia: '',
    profesional: ''
  };

  ngOnInit() {
    this.cargarDatos(0, this.pageSize);
  }

  cargarDatos(page: number, size: number) {
    this.cargando = true;
    this.solicitudService.listarPaginadas(page, size).subscribe({
      next: (respuesta) => {
        this.solicitudes = respuesta.content.map(r => this.mapToItem(r));
        this.totalElementos = respuesta.totalElements;
        this.pageIndex = respuesta.number;
        this.pageSize = respuesta.size;
        this.inicializarTablas();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.cargando = false;
      }
    });
  }

  private mapToItem(r: any): any {
    return {
      solicitudId: r.id,
      id: r.codigo,
      tipoSolicitud: r.tipoSolicitud || '',
      estado: r.estado || '',
      profesional: r.profesional || 'Sin asignar',
      fecha: formatFechaCreacion(r.fechaCreacion),
      dependencia: r.dependencia || '',
      tipoDocumentoId: r.tipoDocumentoId ?? null,
      tipoDocumento: r.tipoDocumento || '',
      numeroDocumento: r.numeroDocumento || '',
      fechaNacimiento: r.fechaNacimiento || null,
      primerNombre: r.primerNombre || '',
      segundoNombre: r.segundoNombre || '',
      primerApellido: r.primerApellido || '',
      segundoApellido: r.segundoApellido || '',
      identidadGeneroId: r.identidadGeneroId ?? null,
      identidadGenero: r.identidadGenero || '',
      celular: r.celular || '',
      telefonoAlterno: r.telefonoAlterno || '',
      correoInstitucional: r.correoInstitucional || '',
      correoPersonal: r.correoPersonal || '',
      correos: Array.isArray(r.correos) ? r.correos : [],
      telefonos: Array.isArray(r.telefonos) ? r.telefonos : [],
      remitentePrimerNombre: r.remitentePrimerNombre || '',
      remitenteSegundoNombre: r.remitenteSegundoNombre || '',
      remitentePrimerApellido: r.remitentePrimerApellido || '',
      remitenteSegundoApellido: r.remitenteSegundoApellido || '',
      remitenteCargoId: r.remitenteCargoId ?? null,
      remitenteCargo: r.remitenteCargo || '',
      remitenteCampusId: r.remitenteCampusId ?? null,
      remitenteCampus: r.remitenteCampus || '',
      remitenteDependenciaId: r.remitenteDependenciaId ?? null,
      remitenteDependencia: r.remitenteDependencia || '',
      remitenteFacultadId: r.remitenteFacultadId ?? null,
      remitenteFacultad: r.remitenteFacultad || '',
      remitenteFechaSolicitud: r.remitenteFechaSolicitud || r.fecha || '',
      remitenteTipoDocumentoId: r.remitenteTipoDocumentoId ?? null,
      remitenteTipoDocumento: r.remitenteTipoDocumento || '',
      remitenteNumeroDocumento: r.remitenteNumeroDocumento || ''
    };
  }

  inicializarTablas() {
    this.dataSourceSinRepartir.data = this.solicitudes.filter(c =>
      !c.profesional || c.profesional === 'Sin asignar'
    );

    this.dataSourceActivos.data = this.solicitudes.filter(c =>
      c.profesional && c.profesional !== 'Sin asignar' &&
      c.estado !== 'Cerrado' && c.estado !== 'Abierto en transición'
    );

    this.dataSourceTransicion.data = this.solicitudes.filter(c =>
      c.estado === 'Abierto en transición'
    );

    this.dataSourceCerrados.data = this.solicitudes.filter(c =>
      c.estado === 'Cerrado'
    );

    const filterPredicate = this.createFilter();
    [this.dataSourceSinRepartir, this.dataSourceActivos, this.dataSourceTransicion, this.dataSourceCerrados]
      .forEach(ds => ds.filterPredicate = filterPredicate);
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
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarDatos(this.pageIndex, this.pageSize);
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
        Object.assign(element, this.mapToItem(result));
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
        this.solicitudService.eliminar(element.solicitudId).subscribe({
          next: () => this.cargarDatos(this.pageIndex, this.pageSize),
          error: (err) => console.error('Error al eliminar caso:', err)
        });
      }
    });
  }

  irAReparto(element: any) {
    const dialogRef = this.dialog.open(RepartoModalComponent, {
      width: '550px',
      data: element,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.solicitudService.asignar(element.solicitudId, {
          grupoProfesionalId: result.grupoProfesionalId,
          idTipoAsignacion: result.idTipoAsignacion,
          idTipoServicio: result.idTipoServicio,
          observaciones: result.observaciones,
          fechaReparto: result.fechaReparto
        }).subscribe({
          next: () => this.cargarDatos(this.pageIndex, this.pageSize),
          error: (err) => console.error('Error al asignar caso:', err)
        });
      }
    });
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
