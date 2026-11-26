import { Component, OnInit, inject } from '@angular/core';
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModalGestionComponent } from '../modal-gestion-contacto/modal-gestion-contacto.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContactoTelefonicoDto } from '../../services/solicitud.service';
import { formatFechaCreacion, formatFechaHoraCita, formatOnlyDate } from '../../custom-date-adapter';
import { forkJoin, Observable } from 'rxjs';
import { FiltroColumnaDirective } from '../../core/a11y/filtro-columna.directive';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { AsignacionesService, ResultadoAsignaciones } from '../../services/asignaciones.service';


@Component({
    selector: 'app-detalle-acompanamiento',
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
        MatTooltipModule, FiltroColumnaDirective
    ],
    templateUrl: './gestion-contacto.component.html',
    styleUrls: ['./gestion-contacto.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed, void', style({ height: '0px', minHeight: '0', opacity: 0 })),
            state('expanded', style({ height: '*', opacity: 1 })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ]
})
export class DetalleAcompanamientoComponent implements OnInit {
  private readonly notificacion = inject(NotificacionService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private asignacionesService = inject(AsignacionesService);

  dataSourceAsignados = new MatTableDataSource<any>([]);
  totalElementos = 0;
  pageIndex = 0;
  pageSize = 10;

  idCaso = 'Seleccione un caso';
  contactoForm!: FormGroup;
  solicitudes: any[] = [];
  cargando = false;
  usaDemostracion = false;


  displayedColumns: string[] = ['expand', 'nombre', 'documento', 'fechaCita', 'profesional', 'tipoAsignacion', 'fechaReparto', 'acciones'];
  readonly SIN_AGENDAR = 'Sin agendar';
  opcionesTipoAsignacion: string[] = [];
  opcionesProfesionales: string[] = [];
  /** Con `:id` en la ruta se muestra solo esa solicitud (enlace directo). */
  esDetalle = false;
  expandedElement: any | null;
  numIntentosMap: Record<number, number> = {};
  maxLlamadas = 2;
  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    estadoCita: '',
    tipoAsignacion: '',
    profesional: ''
  };

  ngOnInit(): void {
    this.esDetalle = !!this.route.snapshot.paramMap.get('id');
    this.cargarSolicitudes(0, this.pageSize);
    this.dataSourceAsignados.filterPredicate = this.createFilter();

    this.contactoForm = this.fb.group({
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      hora: ['08:00', Validators.required],
      jornada: [{ value: '', disabled: true }],
      resultado: ['', Validators.required],
      observacion: ['', [Validators.required, Validators.pattern(/\S/)]]
    });
  }

  cargarSolicitudes(page: number, size: number): void {
    this.cargando = true;
    const referencia = this.route.snapshot.paramMap.get('id');
    const fuente = referencia
      ? this.asignacionesService.obtener(referencia, size)
      : this.asignacionesService.listar(page, size);

    fuente.subscribe({
      next: (respuesta) => this.procesarSolicitudes(respuesta),
      error: (err) => {
        this.notificacion.error('No fue posible cargar las solicitudes. Recargue la página o intente más tarde.', err);
        this.cargando = false;
      }
    });
  }

  private procesarSolicitudes(respuesta: ResultadoAsignaciones): void {
    const mapped = respuesta.solicitudes.map(s => ({
      id: s.id,
      solicitudId: s.id,
      solicitudAsignada: s,
      estadoId: Number(s.idEstadoSolicitud ?? 0),
      codigo: s.codigo,
      profesional: s.profesional,
      tipoDocumento: s.tipoDocumento,
      nombre: s.nombreSolicitante,
      documento: s.documentoSolicitante,
      fecha: s.fechaHoraReparto
        ? formatFechaCreacion(s.fechaHoraReparto)
        : s.fechaReparto ? `${formatOnlyDate(s.fechaReparto)} (hora no disponible)` : 'Sin fecha de reparto',
      fechaCita: '',
      estadoCita: '',
      tieneCitaProgramada: false,
      citaCargando: true,
      citaError: false,
      tipoAsignacion: s.tipoAsignacion || '',
      unidadAdministrativa: s.remitenteUnidadAdministrativa || s.unidadAdministrativa || '',
      tipoSolicitud: s.tipoSolicitud,
      campus: s.remitenteCampus || '',
      facultad: s.remitenteUnidadAcademica || '',
      celular: s.celular || '',
      correoInst: s.correoInstitucional || ''
    }));

    this.dataSourceAsignados.data = mapped;
    this.opcionesTipoAsignacion = [...new Set(mapped.map(e => e.tipoAsignacion).filter(Boolean))].sort();
    this.opcionesProfesionales = [...new Set(mapped.map(e => e.profesional).filter(Boolean))].sort();
    this.totalElementos = respuesta.totalElementos;
    this.pageIndex = respuesta.pagina;
    this.pageSize = respuesta.tamano;
    this.usaDemostracion = respuesta.usaDemostracion;
    this.cargando = false;

    if (mapped.length === 0) return;
    const calls: Record<string, Observable<ContactoTelefonicoDto[]>> = {};
    mapped.forEach(e => {
      calls[String(e.id)] = this.asignacionesService.listarContactos(e.solicitudAsignada);
      this.asignacionesService.obtenerUltimaCita(e.solicitudAsignada).subscribe({
        next: (cita) => {
          e.fechaCita = cita.fechaCita ? formatFechaHoraCita(cita.fechaCita) : '';
          e.estadoCita = cita.estadoCita || '';
          e.tieneCitaProgramada = cita.tieneCitaProgramada;
          e.citaCargando = false;
          this.actualizarCitaEnTabla(e);
        },
        error: (error) => {
          e.citaCargando = false;
          e.citaError = true;
          this.actualizarCitaEnTabla(e);
          this.notificacion.error('No fue posible consultar la última cita de una solicitud.', error);
        }
      });
    });
    forkJoin(calls).subscribe({
      next: (results) => {
        Object.keys(results).forEach(idStr => {
          this.numIntentosMap[Number(idStr)] = results[idStr].length;
        });
      },
      error: (error) => {
        this.numIntentosMap = {};
        this.notificacion.error('No fue posible cargar el historial de contactos.', error);
      }
    });
  }

  private actualizarCitaEnTabla(fila: unknown): void {
    if (this.dataSourceAsignados.data.includes(fila)) {
      this.dataSourceAsignados.data = [...this.dataSourceAsignados.data];
    }
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    const filterString = JSON.stringify(this.filterValues);

    this.dataSourceAsignados.filter = filterString;
  }

  applySelectFilter(column: string, value: string): void {
    this.filterValues[column] = value ?? '';
    this.dataSourceAsignados.filter = JSON.stringify(this.filterValues);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarSolicitudes(this.pageIndex, this.pageSize);
  }

  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      const nombreCompleto = String(data.nombre || '').toLowerCase();

      const documentoCompleto = `
      ${data.tipoDocumento || ''}
      ${data.documento || ''}
    `.toLowerCase();

      return (!searchTerms.id || String(data.id ?? '').toLowerCase().includes(searchTerms.id))
        && (!searchTerms.nombre || nombreCompleto.includes(searchTerms.nombre))
        && (!searchTerms.documento || documentoCompleto.includes(searchTerms.documento))
        && (!searchTerms.fecha || data.fecha?.toLowerCase().includes(searchTerms.fecha))
        && (!searchTerms.estadoCita || (!data.citaCargando && !data.citaError && !data.tieneCitaProgramada))
        && (!searchTerms.tipoAsignacion || data.tipoAsignacion === searchTerms.tipoAsignacion)
        && (!searchTerms.profesional || data.profesional === searchTerms.profesional);
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
        this.cargarSolicitudes(this.pageIndex, this.pageSize);
      }
    });
  }

  abrirDesistimiento(caso: any) {
    const dialogRef = this.dialog.open(ModalGestionComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { ...caso, soloLectura: false, modo: 'desistimiento' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarSolicitudes(this.pageIndex, this.pageSize);
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

  regresar(): void {
    void this.router.navigate(['/mis-asignaciones']);
  }
}
