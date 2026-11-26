import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { ReprogramarCitaModalComponent } from '../modal-reprogramar-cita/modal-reprogramar-cita.component';
import { CitaDto, EstadoCitaEnum } from '../../services/solicitud.service';
import type { ResultadoCitaDto } from '../../services/solicitud.service';
import { RegistroVbgDatosService } from '../../services/registro-vbg-datos.service';
import { formatFechaHoraCita, formatOnlyDate } from '../../custom-date-adapter';
import { FiltroColumnaDirective } from '../../core/a11y/filtro-columna.directive';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { DialogoService } from '../../core/a11y/dialogo.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-cita',
    imports: [
        CommonModule, MatCardModule, MatFormFieldModule,
        MatInputModule, MatButtonModule, MatIconModule,
        MatDividerModule, MatTableModule, MatPaginatorModule, MatTooltipModule, FiltroColumnaDirective
    ],
    templateUrl: './cita.component.html',
    styleUrls: ['./cita.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed, void', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ]
})
export class CitaComponent implements OnInit, AfterViewInit {
  private readonly notificacion = inject(NotificacionService);
  private readonly dialogoServicio = inject(DialogoService);
  private readonly auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private readonly registroVbgDatos = inject(RegistroVbgDatosService);

  formatOnlyDate = formatOnlyDate;

  displayedColumns: string[] = ['expand', 'id', 'nombre', 'documento', 'fechaCita', 'estadoCita', 'tipoAtencion', 'profesional', 'tipoSolicitud', 'acciones'];
  dataSource = new MatTableDataSource<CitaDto>([]);
  expandedElement: CitaDto | null = null;
  totalElementos = 0;
  pageIndex = 0;
  pageSize = 10;

  cargando = false;

  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    profesional: '',
    tipoSolicitud: '',
    estadoCita: '',
  };

  ngOnInit() {
    if (this.auth.isRevisor() && !this.auth.hasAnyRole(['ADMIN', 'COORDINADOR', 'PROFESIONAL'])) {
      this.displayedColumns = this.displayedColumns.filter((columna) => columna !== 'acciones');
    }
    this.dataSource.filterPredicate = this.createFilter();
    this.cargarCitas(0, this.pageSize);
  }

  ngAfterViewInit() {}

  cargarCitas(page: number, size: number): void {
    this.cargando = true;
    this.registroVbgDatos.listarCitasPaginadas(page, size).subscribe({
      next: (respuesta) => {
        this.dataSource.data = respuesta.content;
        this.totalElementos = respuesta.totalElements;
        this.pageIndex = respuesta.number;
        this.pageSize = respuesta.size;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.notificacion.error('No fue posible cargar las citas.', error);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarCitas(this.pageIndex, this.pageSize);
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    (this.filterValues as any)[column] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  createFilter(): (data: CitaDto, filter: string) => boolean {
    return (data: CitaDto, filter: string): boolean => {
      const f = JSON.parse(filter);
      return String(data.id ?? '').toLowerCase().includes(f.id)
        && (data.nombreSolicitante || '').toLowerCase().includes(f.nombre)
        && `${data.tipoDocumento || ''} ${data.documento || ''}`.toLowerCase().includes(f.documento)
        && this.fechaHoraCita(data.fechaCita).toLowerCase().includes(f.fecha)
        && (data.profesional || '').toLowerCase().includes(f.profesional)
        && (data.tipoSolicitud || '').toLowerCase().includes(f.tipoSolicitud)
        && (this.nombreEstadoCita(data) || '').toLowerCase().includes(f.estadoCita);
    };
  }

  estaCitaCaducada(fechaCitaStr: string | null | undefined): boolean {
    if (!fechaCitaStr) return false;
    const formatoBackend = fechaCitaStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    const fecha = formatoBackend
      ? new Date(
          Number(formatoBackend[3]),
          Number(formatoBackend[2]) - 1,
          Number(formatoBackend[1]),
          Number(formatoBackend[4]),
          Number(formatoBackend[5])
        )
      : new Date(fechaCitaStr);
    return !Number.isNaN(fecha.getTime()) && fecha.getTime() <= Date.now();
  }

  fechaHoraCita(fecha: string | null | undefined): string {
    return formatFechaHoraCita(fecha);
  }

  esCitaPendiente(cita: CitaDto): boolean {
    return cita.idEstadoCita === EstadoCitaEnum.PROGRAMADA
      || cita.idEstadoCita === EstadoCitaEnum.REPROGRAMADA;
  }

  puedeReprogramarCita(cita: CitaDto): boolean {
    return this.esCitaPendiente(cita);
  }

  puedeRegistrarResultado(cita: CitaDto): boolean {
    return this.esCitaPendiente(cita) && this.estaCitaCaducada(cita.fechaCita);
  }

  puedeRegistrarAtencionSeguimiento(cita: CitaDto): boolean {
    return cita.tipoAtencion === 'SEGUIMIENTO'
      && cita.idEstadoCita === EstadoCitaEnum.ATENDIDA
      && cita.casoId != null;
  }

  esPrimeraCita(cita: CitaDto): boolean {
    return cita.tipoAtencion !== 'SEGUIMIENTO' && cita.casoId == null && !cita.solicitudTieneCaso;
  }

  mostrarRegistroPrimeraAtencion(cita: CitaDto): boolean {
    return this.esPrimeraCita(cita)
      && (this.esCitaPendiente(cita) || cita.idEstadoCita === EstadoCitaEnum.ATENDIDA);
  }

  puedeAbrirRegistroPrimeraAtencion(cita: CitaDto): boolean {
    if (!this.esPrimeraCita(cita)) {
      return false;
    }
    return cita.idEstadoCita === EstadoCitaEnum.ATENDIDA
      || this.puedeRegistrarResultado(cita);
  }

  abrirRegistroPrimeraAtencion(cita: CitaDto): void {
    if (!this.puedeAbrirRegistroPrimeraAtencion(cita)) {
      return;
    }
    this.router.navigate(['/registro-caso'], { state: { cita } });
  }

  nombreEstadoCita(cita: CitaDto): string {
    return cita.idEstadoCita === EstadoCitaEnum.PROGRAMADA
      || cita.estadoCita?.toLowerCase() === 'programada'
      || cita.estadoCita?.toLowerCase() === 'creada'
      ? 'Programada'
      : cita.estadoCita;
  }

  registrarResultadoCita(cita: CitaDto, resultado: ResultadoCitaDto): void {
    if (!this.puedeRegistrarResultado(cita)) {
      return;
    }

    const atendida = resultado === 'ATENDIDA';
    this.dialogoServicio.confirmar({
      titulo: atendida ? '¿Confirmar cita atendida?' : '¿Registrar inasistencia?',
      mensaje: atendida
        ? cita.tipoAtencion === 'SEGUIMIENTO'
          ? 'La cita quedará como atendida. Luego podrá agregar una nueva atención al caso existente.'
          : cita.solicitudTieneCaso
            ? 'La cita quedará como atendida. Esta solicitud ya tiene un caso y no se creará otro.'
            : 'La cita quedará como atendida y habilitará el registro inicial del caso con su código.'
        : 'La cita quedará como inasistencia. No se creará un caso; programe otra cita después de contactar a la persona.',
      textoConfirmar: atendida ? 'Marcar cita atendida' : 'Registrar inasistencia',
      iconoConfirmar: atendida ? 'check_circle' : 'event_busy',
      textoCancelar: 'Volver'
    }).subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }

      this.registroVbgDatos.registrarResultadoCita(cita.id, resultado).subscribe({
        next: () => this.cargarCitas(this.pageIndex, this.pageSize),
        error: (error) => this.notificacion.error('No fue posible registrar el resultado de la cita.', error)
      });
    });
  }

  registrarAtencionSeguimiento(cita: CitaDto): void {
    if (!this.puedeRegistrarAtencionSeguimiento(cita)) {
      return;
    }
    this.router.navigate(['/registro-atencion'], {
      queryParams: { casoId: cita.casoId, citaId: cita.id }
    });
  }

  reprogramarCita(cita: CitaDto) {
    if (!this.puedeReprogramarCita(cita)) return;
    this.abrirModalGestion(cita, 'reprogramar');
  }

  cancelarCita(cita: CitaDto) {
    if (!this.esCitaPendiente(cita)) return;
    this.abrirModalGestion(cita, 'cancelar');
  }

  private abrirModalGestion(cita: CitaDto, accion: 'cancelar' | 'reprogramar') {
    const dialogRef = this.dialog.open(ReprogramarCitaModalComponent, {
      width: '600px',
      data: {
        caso: { ...cita, fecha: formatOnlyDate(cita.fechaCita) },
        accion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const citaId = cita.id;
      if (result.accion === 'cancelar') {
        const f = result.formulario;
        this.registroVbgDatos.cancelarCita(citaId, {
          idMotivoEstadoCita: f.idMotivoEstadoCita,
          observaciones: f.observaciones
        }).subscribe({
          next: () => this.cargarCitas(this.pageIndex, this.pageSize),
          error: (err) => this.notificacion.error('No fue posible cancelar la cita. Intente de nuevo.', err)
        });
      } else {
        const f = result.formulario;
        this.registroVbgDatos.reprogramarCita(citaId, {
          fechaCita: f.fechaCita,
          horaCita: f.horaCita,
          idMotivoEstadoCita: f.idMotivoEstadoCita,
          observaciones: f.observaciones
        }).subscribe({
          next: () => this.cargarCitas(this.pageIndex, this.pageSize),
          error: (err) => this.notificacion.error('No fue posible reprogramar la cita. Intente de nuevo.', err)
        });
      }
    });
  }

  regresar() {
    this.router.navigate(['/inicio']);
  }
}
