import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { ReprogramarCitaModalComponent } from '../modal-reprogramar-cita/modal-reprogramar-cita.component';
import { SolicitudService, CitaDto, EstadoCitaEnum } from '../../services/solicitud.service';

export function getSpanishPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Elementos por página:';
  paginatorIntl.nextPageLabel = 'Siguiente';
  paginatorIntl.previousPageLabel = 'Anterior';
  paginatorIntl.firstPageLabel = 'Primera página';
  paginatorIntl.lastPageLabel = 'Última página';
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
  selector: 'app-cita',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTableModule, MatPaginatorModule, MatTooltipModule,
    MatProgressSpinnerModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() }
  ],
  templateUrl: './cita.component.html',
  styleUrls: ['./cita.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CitaComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private solicitudService = inject(SolicitudService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'fecha', 'dependencia', 'acciones'];
  dataSource = new MatTableDataSource<CitaDto>([]);
  expandedElement: CitaDto | null = null;

  cargando = false;

  filterValues = { id: '', nombre: '', fecha: '', dependencia: '' };

  ngOnInit() {
    this.dataSource.filterPredicate = this.createFilter();
    this.cargarCitas();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargarCitas(): void {
    this.cargando = true;
    this.solicitudService.listarCitas().subscribe({
      next: (citas) => {
        this.dataSource.data = citas.filter(c => c.idEstadoCita !== EstadoCitaEnum.CANCELADA);
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    (this.filterValues as any)[column] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  createFilter(): (data: CitaDto, filter: string) => boolean {
    return (data: CitaDto, filter: string): boolean => {
      const f = JSON.parse(filter);
      return (data.codigoSolicitud || '').toLowerCase().includes(f.id)
        && (data.nombreSolicitante || '').toLowerCase().includes(f.nombre)
        && (data.fechaCita || '').toLowerCase().includes(f.fecha)
        && (data.dependencia || '').toLowerCase().includes(f.dependencia);
    };
  }

  reprogramarCita(cita: CitaDto) {
    this.abrirModalGestion(cita, 'reprogramar');
  }

  cancelarCita(cita: CitaDto) {
    this.abrirModalGestion(cita, 'cancelar');
  }

  private abrirModalGestion(cita: CitaDto, accion: 'cancelar' | 'reprogramar') {
    const dialogRef = this.dialog.open(ReprogramarCitaModalComponent, {
      width: '600px',
      data: {
        caso: { ...cita, fecha: cita.fechaCita ? cita.fechaCita.split(' ')[0] : '' },
        accion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const citaId = cita.id;
      if (result.accion === 'cancelar') {
        const f = result.formulario;
        this.solicitudService.cancelarCita(citaId, {
          idMotivoEstadoCita: f.idMotivoEstadoCita,
          observaciones: f.observaciones
        }).subscribe({
          next: () => this.cargarCitas(),
          error: (err) => console.error('Error al cancelar cita:', err)
        });
      } else {
        const f = result.formulario;
        this.solicitudService.reprogramarCita(citaId, {
          fechaCita: f.fechaCita,
          horaCita: f.horaCita,
          idMotivoEstadoCita: f.idMotivoEstadoCita,
          observaciones: f.observaciones
        }).subscribe({
          next: () => this.cargarCitas(),
          error: (err) => console.error('Error al reprogramar cita:', err)
        });
      }
    });
  }

  regresar() {
    this.router.navigate(['/consulta']);
  }
}
