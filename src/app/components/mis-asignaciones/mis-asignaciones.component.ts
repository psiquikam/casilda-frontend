import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ModalGestionComponent } from '../modal-gestion-contacto/modal-gestion-contacto.component';
import { ContactoMockService, SolicitudContactoMock } from '../../services/contacto-mock.service';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { formatOnlyDate } from '../../custom-date-adapter';
import { FiltroColumnaDirective } from '../../core/a11y/filtro-columna.directive';

@Component({
  selector: 'app-mis-asignaciones',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FiltroColumnaDirective
  ],
  templateUrl: './mis-asignaciones.component.html',
  styleUrls: ['./mis-asignaciones.component.scss']
})
export class MisAsignacionesComponent implements OnInit, AfterViewInit {
  private readonly contactoMock = inject(ContactoMockService);
  private readonly dialog = inject(MatDialog);
  private readonly notificacion = inject(NotificacionService);

  misCasos: SolicitudContactoMock[] = [];
  displayedColumns: string[] = ['id', 'fechaAsignacion', 'profesional', 'solicitante', 'fechaCita', 'estado', 'accion'];
  dataSource = new MatTableDataSource<SolicitudContactoMock>([]);
  filterValues: Record<string, string> = {
    id: '',
    fechaAsignacion: '',
    profesional: '',
    solicitante: '',
    fechaCita: '',
    estado: ''
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.cargarAsignaciones();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = this.crearFiltro();
  }

  get cantidadEnEspera(): number {
    return this.misCasos.filter((caso) => caso.estado === 'En espera de cita').length;
  }

  get cantidadDesistidos(): number {
    return this.misCasos.filter((caso) => caso.estado === 'Desistido').length;
  }

  cargarAsignaciones(): void {
    this.misCasos = this.contactoMock.listarSolicitudes();
    this.dataSource.data = this.misCasos;
  }

  applyFilter(column: string, event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    this.aplicarFiltros();
  }

  applySelectFilter(column: string, value: string): void {
    this.filterValues[column] = value.trim().toLowerCase();
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.dataSource.paginator?.firstPage();
  }

  private crearFiltro(): (caso: SolicitudContactoMock, filter: string) => boolean {
    return (caso, filter) => {
      const filtros = JSON.parse(filter) as Record<string, string>;
      const fechaCita = caso.fechaCita
        ? `${caso.fechaCita} ${this.mostrarFecha(caso.fechaCita)}`
        : 'sin cita asignada';

      const valores: Record<string, string> = {
        id: caso.codigo,
        fechaAsignacion: `${caso.fechaAsignacion} ${this.mostrarFecha(caso.fechaAsignacion)}`,
        profesional: caso.profesional,
        solicitante: caso.solicitante,
        fechaCita,
        estado: caso.estado
      };

      return Object.entries(filtros).every(([columna, valor]) =>
        !valor || (valores[columna] ?? '').toLowerCase().includes(valor)
      );
    };
  }

  gestionar(caso: SolicitudContactoMock): void {
    this.dialog.open(ModalGestionComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { ...caso, soloLectura: false }
    }).afterClosed().subscribe((result) => {
      if (result) this.cargarAsignaciones();
    });
  }

  desistir(caso: SolicitudContactoMock): void {
    this.contactoMock.desistir(caso.id);
    this.cargarAsignaciones();
    this.notificacion.exito(`La solicitud ${caso.codigo} quedó marcada como desistida.`);
  }

  mostrarFecha(fecha: string | null): string {
    return fecha ? formatOnlyDate(fecha) : 'Sin cita asignada';
  }

  getEstadoClass(estado: string): string {
    return estado === 'Desistido' ? 'status-danger' : 'status-warning';
  }
}
