import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalGestionComponent } from '../modal-gestion-contacto/modal-gestion-contacto.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SolicitudService, ContactoTelefonicoDto } from '../../services/solicitud.service';
import { forkJoin, Observable } from 'rxjs';


export function getSpanishPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Items:';
  paginatorIntl.nextPageLabel = 'Siguiente';
  paginatorIntl.previousPageLabel = 'Anterior';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} – ${endIndex} de ${length}`;
  };
  return paginatorIntl;
}

@Component({
  selector: 'app-detalle-acompanamiento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() }
  ],
  templateUrl: './gestion-contacto.component.html',
  styleUrls: ['./gestion-contacto.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DetalleAcompanamientoComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private solicitudService = inject(SolicitudService);

  dataSourceActivos = new MatTableDataSource<any>([]);
  dataSourceTransicion = new MatTableDataSource<any>([]);
  dataSourceCerrados = new MatTableDataSource<any>([]);
  dataSourceSinRepartir = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  idCaso: string = 'Seleccione un caso';
  contactoForm!: FormGroup;
  solicitudes: any[] = [];
  cargando = false;


  displayedColumns: string[] = ['expand', 'id', 'nombre', 'documento', 'fecha', 'dependencia', 'profesional', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: any | null;
  numIntentosMap: Record<number, number> = {};
  maxLlamadas = 2;
  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    dependencia: '',
    profesional: ''
  };

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.dataSource.filterPredicate = this.createFilter();

    this.contactoForm = this.fb.group({
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      hora: ['08:00', Validators.required],
      jornada: [{ value: '', disabled: true }],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.solicitudService.listarTodas().subscribe({
      next: (solicitudes) => {
        const mapped = solicitudes.map(s => ({
          id: s.id,
          solicitudId: s.id,
          codigo: s.codigo,
          profesional: s.profesional,
          tipoDocumento: s.tipoDocumento,
          nombre: s.nombreSolicitante,
          documento: s.documentoSolicitante,
          fecha: s.fechaCreacion ? String(s.fechaCreacion).substring(0, 10) : '',
          dependencia: s.remitenteDependencia || s.dependencia || '',
          tipoSolicitud: s.tipoSolicitud,
          campus: s.remitenteCampus || '',
          facultad: s.remitenteFacultad || '',
          celular: s.celular || '',
          correoInst: s.correoInstitucional || ''
        }));
        this.dataSource.data = mapped;
        this.cargando = false;

        const asignados = mapped.filter(e => e.profesional && e.profesional !== 'Sin asignar');
        if (asignados.length === 0) return;
        const calls: Record<string, Observable<ContactoTelefonicoDto[]>> = {};
        asignados.forEach(e => { calls[String(e.id)] = this.solicitudService.listarContactos(e.id); });
        forkJoin(calls).subscribe({
          next: (results) => {
            Object.keys(results).forEach(idStr => {
              this.numIntentosMap[Number(idStr)] = results[idStr].length;
            });
          },
          error: () => {}
        });
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.cargando = false;
      }
    });
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

  abrirModalGestion(caso: any) {
    const dialogRef = this.dialog.open(ModalGestionComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { ...caso, soloLectura: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarSolicitudes();
      }
    });
  }

  abrirHistorial(caso: any) {
    this.dialog.open(ModalGestionComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { ...caso, soloLectura: true }
    });
  }

  regresar() {
    this.router.navigate(['/consulta']);
  }
}

