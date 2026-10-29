import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
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
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ModalDetalleSolicitudComponent } from '../modal-detalle-solicitud/modal-detalle-solicitud.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { RepartoModalComponent } from '../modal-reparto/modal-reparto.component';
import { Router } from '@angular/router';
import { GrupoProfesionalDto, SolicitudService } from '../../services/solicitud.service';
import { formatFechaCreacion } from '../../custom-date-adapter';
import { FiltroColumnaDirective } from '../../core/a11y/filtro-columna.directive';
import { NotificacionService } from '../../core/a11y/notificacion.service';
import { MaestroDto } from '../../services/listas.service';
import { AuthService } from '../../services/auth.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-consulta',
    imports: [
        CommonModule, FormsModule, MatTabsModule, MatTableModule,
        MatButtonModule, MatIconModule, MatChipsModule, MatCardModule,
        MatInputModule, MatFormFieldModule, MatDialogModule, MatPaginatorModule, FiltroColumnaDirective,
        MatSelectModule, MatTooltipModule
    ],
    templateUrl: './consulta.component.html',
    styleUrls: ['./consulta.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed, void', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ]
})
export class ConsultaComponent implements OnInit, AfterViewInit {
  private readonly notificacion = inject(NotificacionService);

  private solicitudService = inject(SolicitudService);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private dialog: MatDialog) { }

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['expand', 'nombre', 'documento', 'fecha', 'tipoAsignacion', 'estado', 'profesional', 'acciones'];
  expandedElement: any | null;
  expandedDetailColumns: string[] = ['expandedDetail'];

  dataSourceTodos = new MatTableDataSource<any>([]);
  dataSourceActivos = new MatTableDataSource<any>([]);
  dataSourceCerrados = new MatTableDataSource<any>([]);
  dataSourceSinRepartir = new MatTableDataSource<any>([]);
  totalElementos = 0;
  pageIndex = 0;
  pageSize = 10;

  solicitudes: any[] = [];
  tiposReparto: MaestroDto[] = [];
  gruposProfesionales: GrupoProfesionalDto[] = [];
  cargando = false;

  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    tipoAsignacion: '',
    estado: '',
    profesional: ''
  };

  get puedeGestionarSolicitudes(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'COORDINADOR']);
  }

  toggleExpand(element: any, event: Event): void {
    this.expandedElement = this.expandedElement === element ? null : element;
    event.stopPropagation();
  }

  ngOnInit() {
    this.cargarCatalogosReparto();
    this.cargarDatos(0, this.pageSize);
  }

  private cargarCatalogosReparto(): void {
    this.solicitudService.listarTiposAsignacion().subscribe({
      next: (tipos) => {
        this.tiposReparto = tipos;
        if (tipos.length === 0) {
          this.notificacion.error('No hay tipos de reparto disponibles. Solicite la configuración del catálogo.');
        }
      },
      error: (error) => {
        this.tiposReparto = [];
        this.notificacion.error('No fue posible cargar los tipos de reparto.', error);
      }
    });

    this.solicitudService.listarGruposProfesionales().subscribe({
      next: (grupos) => {
        this.gruposProfesionales = grupos.filter((grupo) => grupo.activo !== false);
        if (this.gruposProfesionales.length === 0) {
          this.notificacion.error('No hay profesionales o duplas disponibles para repartir solicitudes.');
        }
      },
      error: (error) => {
        this.gruposProfesionales = [];
        this.notificacion.error('No fue posible cargar los profesionales o duplas.', error);
      }
    });
  }

  ngAfterViewInit(): void {
    // Paginacion server-side: el paginator dispara recargas al backend.
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
        this.notificacion.error('No fue posible cargar las solicitudes. Recargue la página o intente más tarde.', err);
        this.cargando = false;
      }
    });
  }

  private mapToItem(r: any): any {
    const profesionalRaw = r.profesional || '';
    const isSinProfesional = !profesionalRaw ||
      profesionalRaw === 'Sin asignar' ||
      profesionalRaw === 'Sin repartir' ||
      profesionalRaw === 'Esperando reparto';
    const profesionalDisplay = isSinProfesional ? 'Esperando reparto' : profesionalRaw;

    const estadoRaw = r.estado || '';
    let estadoDisplay: string;
    if (estadoRaw === 'Asignada' || estadoRaw === 'Abierto en transición') {
      estadoDisplay = 'Repartida';
    } else if (estadoRaw === 'Cerrado') {
      estadoDisplay = 'Cerrado';
    } else if (!isSinProfesional) {
      estadoDisplay = 'Repartida';
    } else {
      estadoDisplay = 'Esperando reparto';
    }

    const rawTipoAsignacion = r.tipoAsignacion;
    const isSinTipoAsignacion = !rawTipoAsignacion ||
      rawTipoAsignacion === 'Sin asignar' ||
      rawTipoAsignacion === 'Sin repartir' ||
      rawTipoAsignacion === 'Esperando reparto';
    const tipoAsignacionDisplay = isSinTipoAsignacion ? 'Esperando reparto' : rawTipoAsignacion;

    let datosLocales: any = null;
    try {
      const guardado = (typeof localStorage !== 'undefined')
        ? (localStorage.getItem(`casilda_caso_${r.id}`) ||
           localStorage.getItem(`casilda_caso_${r.codigo}`) ||
           localStorage.getItem(`casilda_doc_${r.numeroDocumento}`))
        : null;
      if (guardado) {
        datosLocales = JSON.parse(guardado);
      }
    } catch {
      // Ignorar si localStorage no está accesible
    }

    const agresorIdentificacion = this.normalizarDatoOpcional(r.agresorIdentificacion || datosLocales?.agresorIdentificacion);
    const agresorNombre = this.normalizarDatoOpcional(
      r.agresorNombre || r.presuntoAgresor || datosLocales?.agresorNombre ||
      (r.presuntoPrimerNombre ? `${r.presuntoPrimerNombre} ${r.presuntoPrimerApellido || ''}`.trim() : '')
    );
    const agresorVinculoUdea = this.normalizarDatoOpcional(
      r.agresorOtroVinculoUdea || r.agresorVinculoUdea || datosLocales?.agresorVinculoUdea
    );
    const agresorVinculoVictima = this.normalizarDatoOpcional(
      r.agresorOtroVinculoVictima || r.agresorVinculoVictima || r.vinculoVictima || datosLocales?.agresorVinculoVictima
    );
    const agresorCorreo = this.normalizarDatoOpcional(r.agresorCorreo || datosLocales?.agresorCorreo);
    const agresorRemitirUad = this.normalizarDatoOpcional(r.agresorRemitirUad || datosLocales?.agresorRemitirUad);
    const tieneDatosAgresor = Boolean(
      agresorIdentificacion || agresorNombre || agresorVinculoUdea || agresorVinculoVictima || agresorCorreo
    );

    const correos = Array.isArray(r.correos) ? r.correos : [];
    const telefonos = Array.isArray(r.telefonos) ? r.telefonos : [];
    const telefonoContacto = r.celular || r.telefonoAlterno || telefonos.find((t: any) => t?.telefono)?.telefono || '';
    const correosRegistrados = correos
      .map((correo: any) => correo?.correo)
      .filter(Boolean)
      .join(', ');
    const correoContacto = correosRegistrados || r.correoInstitucional || r.correoPersonal || '';

    return {
      solicitudId: r.id,
      id: r.codigo,
      tipoSolicitud: r.tipoSolicitud || 'Directa',
      estado: r.estado || '',
      estadoDisplay,
      profesional: profesionalRaw,
      profesionalDisplay,
      fecha: formatFechaCreacion(r.fechaCreacion),
      tipoAsignacion: rawTipoAsignacion || 'Esperando reparto',
      tipoAsignacionDisplay,
      // Datos de Caso / Hechos del reporte y formulario
      descripcionHechos: r.descripcionHechos || r.descripcion || r.hechos?.[0]?.descripcion || datosLocales?.descripcionHechos || r.observaciones || 'No se registró descripción detallada.',
      lugarOcurrencia: r.lugarOcurrencia || r.lugar || datosLocales?.lugarOcurrencia || (r.tipoLugar === 'interno' ? 'Campus / Espacio Universitario' : r.tipoLugar === 'externo' ? 'Externo a la Universidad' : (r.remitenteCampus || 'No especificado')),
      relacionMisional: r.relacionMisional || datosLocales?.relacionMisional || (r.actividadMisional ? 'Sí' : 'No especificada'),
      fechaOcurrencia: r.fechaOcurrencia || r.fechaOcurrenciaRapida || r.fechaHechos || datosLocales?.fechaOcurrencia || 'No especificada',
      tiposVbg: (Array.isArray(r.tiposVbg) && r.tiposVbg.length) ? r.tiposVbg : (datosLocales?.tiposVbg?.length ? datosLocales.tiposVbg : (r.tipoViolencia ? [r.tipoViolencia] : [])),
      agresorIdentificacion,
      agresorNombre,
      agresorVinculoUdeaId: r.agresorVinculoUdeaId ?? datosLocales?.agresorVinculoUdeaId ?? null,
      agresorVinculoUdea,
      agresorOtroVinculoUdea: r.agresorOtroVinculoUdea || datosLocales?.agresorOtroVinculoUdea || '',
      agresorVinculoVictimaId: r.agresorVinculoVictimaId ?? datosLocales?.agresorVinculoVictimaId ?? null,
      agresorVinculoVictima,
      agresorOtroVinculoVictima: r.agresorOtroVinculoVictima || datosLocales?.agresorOtroVinculoVictima || '',
      agresorCorreo,
      agresorRemitirUad,
      tieneDatosAgresor,
      evidenciasResumen: r.evidenciasArchivos?.length ? `${r.evidenciasArchivos.length} archivo(s) adjunto(s)` : (r.evidencias || datosLocales?.evidenciasResumen || 'Sin archivos adjuntos'),
      // Solicitante
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
      vinculoUniversidadId: r.vinculoUniversidadId ?? null,
      vinculoUniversidad: r.vinculoUniversidad || '',
      celular: r.celular || '',
      telefonoAlterno: r.telefonoAlterno || '',
      correoInstitucional: r.correoInstitucional || '',
      correoPersonal: r.correoPersonal || '',
      correos,
      telefonos,
      telefonoContacto,
      correoContacto,
      observacionesTelefono: r.observacionesTelefono || '',
      observacionesCorreo: r.observacionesCorreo || '',
      // Remitente
      remitentePrimerNombre: r.remitentePrimerNombre || '',
      remitenteSegundoNombre: r.remitenteSegundoNombre || '',
      remitentePrimerApellido: r.remitentePrimerApellido || '',
      remitenteSegundoApellido: r.remitenteSegundoApellido || '',
      remitenteCargoId: r.remitenteCargoId ?? null,
      remitenteCargo: r.remitenteCargo || '',
      remitenteCampusId: r.remitenteCampusId ?? null,
      remitenteCampus: r.remitenteCampus || '',
      remitenteUnidadAdministrativaId: r.remitenteUnidadAdministrativaId ?? null,
      remitenteUnidadAdministrativa: r.remitenteUnidadAdministrativa || '',
      remitenteFacultadId: r.remitenteFacultadId ?? null,
      remitenteFacultad: r.remitenteFacultad || '',
      remitenteFechaSolicitud: r.remitenteFechaSolicitud || r.fecha || '',
      remitenteTipoDocumentoId: r.remitenteTipoDocumentoId ?? null,
      remitenteTipoDocumento: r.remitenteTipoDocumento || '',
      remitenteNumeroDocumento: r.remitenteNumeroDocumento || '',
      medioSolicitudId: r.medioSolicitudId ?? null,
      medioSolicitud: r.medioSolicitud || ''
    };
  }

  private normalizarDatoOpcional(valor: unknown): string {
    const texto = String(valor ?? '').trim();
    const valoresVacios = ['sin información registrada', 'no especificado', 'no especificada'];
    return valoresVacios.includes(texto.toLowerCase()) ? '' : texto;
  }

  inicializarTablas() {
    this.dataSourceTodos.data = this.solicitudes;

    this.dataSourceSinRepartir.data = this.solicitudes.filter(c =>
      c.profesionalDisplay === 'Esperando reparto' ||
      c.profesionalDisplay === 'Sin repartir' ||
      !c.profesional ||
      c.profesional === 'Sin asignar' ||
      c.profesional === 'Sin repartir'
    );

    this.dataSourceActivos.data = this.solicitudes.filter(c =>
      c.profesionalDisplay !== 'Esperando reparto' &&
      c.profesionalDisplay !== 'Sin repartir' &&
      c.profesionalDisplay !== 'Sin asignar' &&
      c.estado !== 'Cerrado'
    );

    this.dataSourceCerrados.data = this.solicitudes.filter(c =>
      c.estado === 'Cerrado'
    );

    const filterPredicate = this.createFilter();
    [this.dataSourceTodos, this.dataSourceSinRepartir, this.dataSourceActivos, this.dataSourceCerrados]
      .forEach(ds => ds.filterPredicate = filterPredicate);
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    this.propagarFiltros();
  }

  onSelectFilter(column: string, event: Event): void {
    const value = (event.target as HTMLSelectElement)?.value ?? '';
    this.applySelectFilter(column, value);
  }

  applySelectFilter(column: string, value: string) {
    this.filterValues[column] = (value === 'TODOS' || value === 'TODAS' || !value) ? '' : value.trim().toLowerCase();
    this.propagarFiltros();
  }

  private propagarFiltros() {
    const filterString = JSON.stringify(this.filterValues);
    [
      this.dataSourceTodos,
      this.dataSourceSinRepartir,
      this.dataSourceActivos,
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

      const estadoNormalizado = (data.estadoDisplay || data.estado || '').toLowerCase();
      let matchEstado = true;
      if (searchTerms.estado) {
        const term = searchTerms.estado.toLowerCase();
        if (term === 'sin repartir' || term === 'esperando reparto' || term === 'sin asignar') {
          matchEstado = estadoNormalizado.includes('sin repartir') ||
                        estadoNormalizado.includes('sin asignar') ||
                        estadoNormalizado.includes('esperando reparto') ||
                        data.profesionalDisplay === 'Esperando reparto' ||
                        data.profesionalDisplay === 'Sin repartir';
        } else if (term === 'repartida') {
          matchEstado = estadoNormalizado.includes('repartida') ||
                        estadoNormalizado.includes('asignada') ||
                        (data.profesionalDisplay !== 'Esperando reparto' && data.profesionalDisplay !== 'Sin repartir');
        } else {
          matchEstado = estadoNormalizado.includes(term);
        }
      }

      const tipoAsignacionNormalizado = (data.tipoAsignacionDisplay || data.tipoAsignacion || '').toLowerCase();
      let matchTipoAsignacion = true;
      if (searchTerms.tipoAsignacion) {
        const term = searchTerms.tipoAsignacion.toLowerCase();
        if (term === 'sin repartir' || term === 'esperando reparto' || term === 'sin asignar') {
          matchTipoAsignacion = tipoAsignacionNormalizado.includes('sin repartir') ||
                                tipoAsignacionNormalizado.includes('esperando reparto') ||
                                tipoAsignacionNormalizado.includes('sin asignar');
        } else {
          matchTipoAsignacion = tipoAsignacionNormalizado.includes(term);
        }
      }

      const profesionalNormalizado = (data.profesionalDisplay || data.profesional || '').toLowerCase();
      let matchProfesional = true;
      if (searchTerms.profesional) {
        const term = searchTerms.profesional.toLowerCase();
        if (term === 'sin repartir' || term === 'esperando reparto' || term === 'sin asignar') {
          matchProfesional = profesionalNormalizado.includes('sin repartir') ||
                             profesionalNormalizado.includes('esperando reparto') ||
                             profesionalNormalizado.includes('sin asignar');
        } else {
          matchProfesional = profesionalNormalizado.includes(term);
        }
      }

      return (!searchTerms.id || data.id?.toLowerCase().includes(searchTerms.id))
        && (!searchTerms.nombre || nombreCompleto.includes(searchTerms.nombre))
        && (!searchTerms.documento || documentoCompleto.includes(searchTerms.documento))
        && (!searchTerms.fecha || data.fecha?.toLowerCase().includes(searchTerms.fecha))
        && matchTipoAsignacion
        && matchEstado
        && matchProfesional;
    };
  }

  get opcionesTipoReparto(): string[] {
    return this.tiposReparto.map(tipo => tipo.nombre);
  }

  get opcionesTipoAsignacion(): string[] {
    return this.opcionesTipoReparto;
  }

  get opcionesProfesionales(): string[] {
    const set = new Set<string>(this.gruposProfesionales.map(grupo => grupo.nombre));
    this.solicitudes.forEach(s => {
      const prof = s.profesional;
      if (prof && prof !== 'Sin asignar' && prof !== 'Sin repartir' && prof !== 'Esperando reparto') {
        set.add(prof);
      }
    });
    return Array.from(set);
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
        const itemMapeado = this.mapToItem(result);
        Object.assign(element, itemMapeado);
        if (result.descripcionHechos) element.descripcionHechos = result.descripcionHechos;
        if (result.lugarOcurrencia) element.lugarOcurrencia = result.lugarOcurrencia;
        if (result.relacionMisional) element.relacionMisional = result.relacionMisional;
        if (result.fechaOcurrencia) element.fechaOcurrencia = result.fechaOcurrencia;
        if (result.tiposVbg) element.tiposVbg = result.tiposVbg;
        if (result.agresorIdentificacion) element.agresorIdentificacion = result.agresorIdentificacion;
        if (result.agresorNombre) element.agresorNombre = result.agresorNombre;
        if (result.agresorVinculoUdea) element.agresorVinculoUdea = result.agresorVinculoUdea;
        if (result.agresorVinculoVictima) element.agresorVinculoVictima = result.agresorVinculoVictima;
        if (result.agresorCorreo) element.agresorCorreo = result.agresorCorreo;
        if (result.agresorRemitirUad) element.agresorRemitirUad = result.agresorRemitirUad;
        if (result.evidenciasResumen) element.evidenciasResumen = result.evidenciasResumen;
        this.inicializarTablas();
      }
    });
  }

  eliminarCaso(element: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        titulo: 'Eliminar solicitud',
        mensaje: `¿Confirma que desea eliminar la solicitud asociada al caso ${element.id}?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.solicitudService.eliminar(element.solicitudId).subscribe({
          next: () => this.cargarDatos(this.pageIndex, this.pageSize),
          error: (err) => this.notificacion.error('No fue posible eliminar la solicitud. Intente de nuevo.', err)
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
        this.cargarDatos(this.pageIndex, this.pageSize);
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

}

