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
import { SolicitudService } from '../../services/solicitud.service';


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

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  idCaso: string = 'Seleccione un caso';
  contactoForm!: FormGroup;
  cargando = false;

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'fecha', 'dependencia', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  expandedElement: any | null;
  filterValues = { id: '', nombre: '', fecha: '', dependencia: '' };

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
        this.dataSource.data = solicitudes.map(s => ({
          id: s.id,
          solicitudId: s.id,
          codigo: s.codigo,
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
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.cargando = false;
      }
    });
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    (this.filterValues as any)[column] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      return String(data.id).toLowerCase().includes(searchTerms.id)
        && (data.nombre || '').toLowerCase().includes(searchTerms.nombre)
        && (data.fecha || '').toLowerCase().includes(searchTerms.fecha)
        && (data.dependencia || '').toLowerCase().includes(searchTerms.dependencia);
    };
  }

  abrirModalGestion(caso: any) {
    const dialogRef = this.dialog.open(ModalGestionComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: caso
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarSolicitudes();
      }
    });
  }

  regresar() {
    this.router.navigate(['/consulta']);
  }
}

