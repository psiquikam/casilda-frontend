import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ModalDireccionComponent } from '../modal-direccion/modal-direccion.component';
import { ModalDiscapacidadComponent } from '../modal-discapacidad/modal-discapacidad.component';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';
import { ModalHechosComponent } from '../modal-hechos/modal-hechos.component';
import { ModalRemisionComponent } from '../modal-remision/modal-remision.component';
import { ModalMedidasProteccionComponent } from '../modal-medidas-proteccion/modal-medidas-proteccion.component';
import { ModalPresuntoAgresorComponent } from '../modal-presunto-agresor/modal-presunto-agresor.component';
import { ModalActivarRutaComponent } from '../modal-activar-ruta/modal-activar-ruta.component';
import { ModalApreciacionJuridicaComponent } from '../modal-apreciacion-juridica/modal-apreciacion-juridica.component';
import { ModalApreciacionPsicologicaComponent } from '../modal-apreciacion-psicologica/modal-apreciacion-psicologica.component';
import { TablaCasosComponent } from '../tabla-casos/tabla-casos.component';
import { TablaOtrosCasosComponent } from '../tabla-otros-casos/tabla-otros-casos.component';
import { ModalCompromisosPersonaComponent } from '../modal-compromisos-persona/modal-compromisos-persona.component';
import { ModalCompromisosProfesionalesComponent } from '../modal-compromisos-profesionales/modal-compromisos-profesionales.component';
import { ModalSeguimientosComponent } from '../modal-seguimiento/modal-seguimiento.component';
import { DialogoExitoComponent } from '../dialog-exito/dialog-exito.component';
import { ModalAgregarCasoComponent } from '../modal-agregar-caso/modal-agregar-caso.component';
import { AuthService } from '../../services/auth.service';
import { AtencionContextoRequestDto, AtencionRegistroRequestDto, CitaDto, CompromisoPersonaRequestDto, CompromisoProfesionalRequestDto, EstadoCitaEnum, HechoRequestDto, OtroCasoDto, RegistroAtencionCompleteRequestDto, RegistroOtroCasoRequestDto, SeguimientoAtencionRequestDto, SolicitudService, VinculoUdeAEnum } from '../../services/solicitud.service';
import { MaestroDto } from '../../services/listas.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registro-atencion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatRadioModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    TablaCasosComponent,
    TablaOtrosCasosComponent,
    MatCheckboxModule,
    FormsModule,
    ModalPresuntoAgresorComponent
  ],
  templateUrl: './registro-atencion.component.html',
  styleUrls: ['./registro-atencion.component.scss', './registro-atencion.consulta.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class RegistroAtencionComponent implements OnInit, AfterViewInit {
  atencionForm!: FormGroup;
  atencionId: number | null = null;
  activeTabIndex = 0;
  private readonly maestrosUrl = `${environment.apiBaseUrl}/maestros`;

  casoPorAtender: any[] = [];
  casosRelacionados: any[] = [];
  private otrosCasosPendientes: { _tempId: string, formResult: any, request: RegistroOtroCasoRequestDto }[] = [];
  private otrosCasosEditados: { idCaso: number, request: RegistroOtroCasoRequestDto, displayRow: any }[] = [];
  private otrosCasosEliminados: number[] = [];

  dataSource = new MatTableDataSource<any>(this.casoPorAtender);
  dataSourceOtros = new MatTableDataSource<any>(this.casosRelacionados);
  totalElementosCitas = 0;
  pageIndexCitas = 0;
  pageSizeCitas = 10;
  displayedColumnsTablaInicial: string[] = ['expand', 'id', 'nombre', 'documento', 'fecha', 'unidadAdministrativa', 'profesional', 'acciones'];
  catalogoSeguimiento: string[] = ['Presencial', 'Telefónico', 'Virtual', 'Visita Domiciliaria'];

  @ViewChild(MatSort) sort?: MatSort;

  @ViewChild('sortOtros') sortOtros?: MatSort;

  tipoSeguimientoControl = new FormControl<string | null>(null);

  miFormulario = new FormGroup({
    tipoSeguimiento: this.tipoSeguimientoControl
  });

  modoAtencion = false;
  modoVista: 'registrar' | 'consultar' = 'registrar';
  tabConsulta: 'abierta-activo' | 'abierta-transicion' | 'cerrada' = 'abierta-activo';
  busquedaConsulta = '';
  casoSeleccionado: any = null;
  cargandoOtrosCasos = false;

  consultaAtenciones: any[] = [
    { documento: '1234567890', fecha: '16 julio 2025', servicio: 'Equipo violeta', profesional: 'María González López', estado: 'abierta-activo' },
    { documento: '1234567890', fecha: '14 septiembre 2025', servicio: 'Línea Alma', profesional: 'Carlos Pérez Ruiz', estado: 'abierta-activo' },
    { documento: '1234567890', fecha: '30 octubre 2025', servicio: 'Equipo violeta', profesional: 'Ana Martínez Soto', estado: 'abierta-activo' },
    { documento: '1234567890', fecha: '2 enero 2026', servicio: 'Línea Alma', profesional: 'Luis Rodríguez Mora', estado: 'abierta-activo' },
    { documento: '1234567890', fecha: '16 enero 2026', servicio: 'Línea Alma', profesional: 'Sandra Torres Vega', estado: 'abierta-transicion' },
    { documento: '9876543210', fecha: '5 febrero 2026', servicio: 'Equipo violeta', profesional: 'Jorge Castillo Díaz', estado: 'abierta-transicion' },
    { documento: '5551112233', fecha: '20 noviembre 2025', servicio: 'Línea Alma', profesional: 'Paola Rivera Cruz', estado: 'cerrada' },
    { documento: '4449998877', fecha: '3 agosto 2025', servicio: 'Equipo violeta', profesional: 'Andrés Vargas Leal', estado: 'cerrada' },
  ];
  dataSourceConsulta = new MatTableDataSource<any>(this.consultaAtenciones);
  displayedColumnsConsulta = ['documento', 'fecha', 'servicio', 'profesional', 'opciones'];

  private readonly longitudesPorTipoDocumento: Record<string, number> = {
    CC: 10, TI: 11, CE: 7, RC: 11, NUIP: 11, NIP: 11, PA: 12
  };

  get maxLongitudDocumento(): number {
    const tipo = String(this.atencionForm?.get('tipoDocumento')?.value ?? '').toUpperCase().trim();
    if (!tipo) {
      return 12;
    }
    for (const key of Object.keys(this.longitudesPorTipoDocumento)) {
      if (tipo.includes(key)) {
        return this.longitudesPorTipoDocumento[key];
      }
    }
    return 12;
  }

  soloDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, this.maxLongitudDocumento);
    if (input.value !== limpio) {
      input.value = limpio;
      this.atencionForm.get('documento')?.setValue(limpio, { emitEvent: false });
    }
  }

  get consultaFiltrada(): any[] {
    const fuente = this.consultaAtenciones.filter(a => a.estado === this.tabConsulta);
    if (!this.busquedaConsulta.trim()) return fuente;
    const q = this.busquedaConsulta.toLowerCase();
    return fuente.filter(a =>
      a.documento.toLowerCase().includes(q) ||
      a.fecha.toLowerCase().includes(q) ||
      a.servicio.toLowerCase().includes(q) ||
      a.profesional.toLowerCase().includes(q)
    );
  }
  expandedElement: any | null = null;
  expandedElementOtros: any | null = null;
  tipoSeguimientoSeleccionado?: string;

  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    unidadAdministrativa: '',
    profesional: ''
  };

  discapacidadesRegistradas: any[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  apreciacionesJuridicas: any[] = [];
  apreciacionesPsicologicas: any[] = [];
  hechosRegistrados: any[] = [];
  remisionesRegistrados: any[] = [];
  activarRutasRegistrados: any[] = [];
  medidasRegistradas: any[] = [];
  agresoresRegistrados: any[] = [];

  compromisosPersona: any[] = [];
  compromisosProfesional: any[] = [];
  seguimientosRegistrados: any[] = [];
  guardandoCompromisos = false;
  tabErrors = new Set<string>();

  private readonly tabFieldMap: { tab: string; label: string; control: string; condition?: () => boolean }[] = [
    { tab: 'Registro de atención', label: 'Tipo de servicio', control: 'tipoServicio' },
    { tab: 'Registro de atención', label: 'Lugar de la entrevista', control: 'lugarEntrevista' },
    { tab: 'Datos de la persona', label: 'Tipo de documento', control: 'tipoDocumento' },
    { tab: 'Datos de la persona', label: 'Número de documento', control: 'documento' },
    { tab: 'Datos de la persona', label: 'Fecha de nacimiento', control: 'fechaNacimiento' },
    { tab: 'Datos de la persona', label: 'Primer nombre', control: 'primerNombre' },
    { tab: 'Datos de la persona', label: 'Primer apellido', control: 'primerApellido' },
    { tab: 'Datos de la persona', label: 'Sexo', control: 'sexo' },
    { tab: 'Datos de la persona', label: 'Etnia', control: 'etnia' },
    { tab: 'Datos de la persona', label: 'Identidad de género', control: 'identidadSexual' },
    { tab: 'Datos de la persona', label: 'Orientación sexual', control: 'orientacionSexual' },
    { tab: 'Datos de la persona', label: 'EPS', control: 'eps' },
    { tab: 'Datos de la persona', label: 'Régimen de salud', control: 'regimenSalud' },
    { tab: 'Datos de la persona', label: 'Ciudad de nacimiento', control: 'ciudadNacimiento' },
    { tab: 'Datos complementarios', label: 'Vínculo', control: 'vinculo' },
    { tab: 'Datos complementarios', label: 'Unidad Académica', control: 'unidadAcademica' },
    { tab: 'Datos complementarios', label: 'Programa', control: 'programa' },
    { tab: 'Datos complementarios', label: 'Unidad Administrativa', control: 'unidadAdministrativa' },
    { tab: 'Datos complementarios', label: 'Campus', control: 'campus' },
    { tab: 'Documentación', label: 'Tiempo ocurrido (valor)', control: 'tiempoOcurridoValor' },
    { tab: 'Documentación', label: 'Tiempo ocurrido (unidad)', control: 'tiempoOcurridoUnidad' },
    { tab: 'Documentación', label: '¿De qué forma?', control: 'queForma' },
    { tab: 'Documentación', label: 'Lugar de los hechos', control: 'lugarHechos' },
    { tab: 'Documentación', label: 'Violencia de género', control: 'violenciaGenero' },
    { tab: 'Documentación', label: 'Violencia misional', control: 'violenciaMisional' },
    {
      tab: 'Documentación', label: 'Actividad misional', control: 'actividadMisional',
      condition: () => this.atencionForm?.get('violenciaMisional')?.value === 'SI'
    },
    { tab: 'Presunto agresor', label: 'Primer nombre (agresor)', control: 'presuntoPrimerNombre' },
    { tab: 'Presunto agresor', label: 'Primer apellido (agresor)', control: 'presuntoPrimerApellido' },
    { tab: 'Presunto agresor', label: 'Vínculo con la universidad', control: 'presuntoVinculoUniversidad' },
    { tab: 'Presunto agresor', label: 'Vínculo con la víctima', control: 'presuntoVinculoVictima' },
    { tab: 'Estado de la atención', label: 'Estado de la atención', control: 'estadosAtencion' },
    { tab: 'Estado de la atención', label: 'Grupo de atención', control: 'grupoAtencion' },
  ];

  psicologicaSel: number[] = [];
  fisicaSel: number[] = [];
  sexualSel: number[] = [];
  institucionalSel: number[] = [];
  economicaSel: number[] = [];
  informaticaSel: number[] = [];
  prejuicioSel: number[] = [];

  listaSexo: string[] = [];
  listaEtnias: string[] = [];
  listaProgramas: string[] = [];
  listaIdentidadSexual: string[] = [];
  listaOrientacionSexual: string[] = [];
  listaVinculos: string[] = [];
  listaVinculosAgresorVictima: string[] = [];
  listaUnidadesAdministrativas: string[] = [];
  listaTipoViolencia: string[] = [];
  listaSubTipoViolencia: string[] = [];
  tiposSolicitud: string[] = [];
  municipiosEntrevista: MaestroDto[] = [];
  lugaresEntrevista: MaestroDto[] = [];
  listaDepartamentos: MaestroDto[] = [];
  listaDepartamentosFiltrados: MaestroDto[] = [];
  municipiosNacimiento: MaestroDto[] = [];
  municipiosNacimientoFiltrados: MaestroDto[] = [];
  municipiosResidencia: MaestroDto[] = [];
  municipiosResidenciaFiltrados: MaestroDto[] = [];
  municipiosHechos: MaestroDto[] = [];
  municipiosHechosFiltrados: MaestroDto[] = [];
  listaRegimenSalud: string[] = [];
  listaEPSRegimen: string[] = [];
  tiposServicio: string[] = [];
  tiposDoc: string[] = [];
  campusM: string[] = [];
  unidadesAcademicasM: string[] = [];
  queForma: string[] = [];
  lugarHechos: string[] = [];
  actividadesMisionales: string[] = [];
  estadosAtencion: string[] = [];
  grupoAtencion: string[] = [];
  listaTiemposOcurridoUnidad: string[] = [];
  catalogoTiemposOcurridoUnidad: MaestroDto[] = [];

  catalogoSexos: MaestroDto[] = [];
  catalogoEtnias: MaestroDto[] = [];
  catalogoProgramas: MaestroDto[] = [];
  catalogoIdentidadesSexuales: MaestroDto[] = [];
  catalogoOrientacionesSexuales: MaestroDto[] = [];
  catalogoVinculosUdea: MaestroDto[] = [];
  catalogoVinculosAgresorVictima: MaestroDto[] = [];
  catalogoUnidadesAdministrativas: MaestroDto[] = [];
  catalogoRegimenes: MaestroDto[] = [];
  catalogoEps: MaestroDto[] = [];
  catalogoTiposServicio: MaestroDto[] = [];
  catalogoCampus: MaestroDto[] = [];
  catalogoUnidadesAcademicas: MaestroDto[] = [];
  catalogoFormasOcurrencia: MaestroDto[] = [];
  catalogoLugaresOcurrencia: MaestroDto[] = [];
  catalogoActividadesMisionales: MaestroDto[] = [];

  listaPsicologica: MaestroDto[] = [];
  listaFisica: MaestroDto[] = [];
  listaSexual: MaestroDto[] = [];
  listaInstitucional: MaestroDto[] = [];
  listaPatrimonial: MaestroDto[] = [];
  listaInformatica: MaestroDto[] = [];
  listaPrejuicio: MaestroDto[] = [];

  constructor(
    private fb: FormBuilder,
    private readonly http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private readonly authService: AuthService,
    private readonly solicitudService: SolicitudService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.configurarValidacionActividadMisional();
    this.configurarUnidadAdministrativaMunicipios();
    this.cargarListasMaestras();
    this.cargarCitas();
    const nombreUsuario = this.authService.currentUser?.nombre || '';
    this.atencionForm.get('personaRegistra')?.setValue(nombreUsuario);
    this.atencionForm.get('personaAtiende')?.setValue(nombreUsuario);

    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      return (data.id || '').toString().toLowerCase().includes(searchTerms.id)
        && (data.nombre || '').toLowerCase().includes(searchTerms.nombre)
        && `${data.tipoDocumento || ''} ${data.documento || ''}`.toLowerCase().includes(searchTerms.documento)
        && (data.fecha || '').toLowerCase().includes(searchTerms.fecha)
        && (data.unidadAdministrativa || '').toLowerCase().includes(searchTerms.unidadAdministrativa)
        && (data.profesional || '').toLowerCase().includes(searchTerms.profesional);
    };

    this.dataSourceOtros.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      return (data.id || '').toString().toLowerCase().includes(searchTerms.id)
        && (data.nombre || '').toLowerCase().includes(searchTerms.nombre)
        && `${data.tipoDocumento || ''} ${data.documento || ''}`.toLowerCase().includes(searchTerms.documento)
        && (data.fecha || '').toLowerCase().includes(searchTerms.fecha)
        && (data.unidadAdministrativa || '').toLowerCase().includes(searchTerms.unidadAdministrativa)
        && (data.profesional || '').toLowerCase().includes(searchTerms.profesional);
    };

    this.atencionForm.get('logroAcuerdo')?.valueChanges.subscribe(valor => {
      if (valor === 'NO') {
        this.remisionesRegistrados = [];
        this.activarRutasRegistrados = [];
      }
    });

    this.atencionForm.get('vinculo')?.valueChanges.subscribe(valor => {
      const controlOtro = this.atencionForm.get('otroVinculo');
      if (controlOtro) {
        const idVinculo = this.resolverIdMaestro(valor, this.catalogoVinculosUdea);
        if (idVinculo === VinculoUdeAEnum.OTRO_TIPO_DE_VINCULO) {
          controlOtro.setValidators([Validators.required]);
        } else {
          controlOtro.clearValidators();
          controlOtro.setValue('');
        }
        controlOtro.updateValueAndValidity({ emitEvent: false });
      }

      // Habilitar/Deshabilitar programa según vínculo
      this.evaluarYcargarProgramas();
    });

    this.atencionForm.get('unidadAcademica')?.valueChanges.subscribe(() => {
      this.evaluarYcargarProgramas();
    });
  }

  esVinculoHabilitadoParaPrograma(): boolean {
    const vinculoVal = this.atencionForm.get('vinculo')?.value;
    if (!vinculoVal) return false;
    const idVinculo = this.resolverIdMaestro(vinculoVal, this.catalogoVinculosUdea);
    // Habilitar para "Estudiante de Pregrado" (1) o "Estudiante de Posgrado" (10)
    return idVinculo === VinculoUdeAEnum.ESTUDIANTE_PREGRADO || idVinculo === VinculoUdeAEnum.ESTUDIANTE_DE_POSGRADO;
  }


  evaluarYcargarProgramas(): void {
    const controlPrograma = this.atencionForm.get('programa');
    if (!this.esVinculoHabilitadoParaPrograma()) {
      controlPrograma?.setValue('');
      controlPrograma?.disable({ emitEvent: false });
      this.listaProgramas = [];
      return;
    }

    const unidadAcademicaVal = this.atencionForm.get('unidadAcademica')?.value;
    if (!unidadAcademicaVal) {
      controlPrograma?.setValue('');
      controlPrograma?.disable({ emitEvent: false });
      this.listaProgramas = [];
      return;
    }

    const idUnidad = this.resolverIdMaestro(unidadAcademicaVal, this.catalogoUnidadesAcademicas);
    if (!idUnidad || Number.isNaN(idUnidad)) {
      controlPrograma?.setValue('');
      controlPrograma?.disable({ emitEvent: false });
      this.listaProgramas = [];
      return;
    }

    const vinculoVal = this.atencionForm.get('vinculo')?.value;
    const idVinculo = this.resolverIdMaestro(vinculoVal, this.catalogoVinculosUdea);
    const pregrado = idVinculo === VinculoUdeAEnum.ESTUDIANTE_PREGRADO;

    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/programas?unidadAcademicaId=${idUnidad}&pregrado=${pregrado}`).subscribe({
      next: (data) => {
        this.catalogoProgramas = data;
        this.listaProgramas = this.mapNombres(data);
        controlPrograma?.enable({ emitEvent: false });
      },
      error: (err) => {
        console.error('Error cargando programas filtrados:', err);
        this.listaProgramas = [];
        controlPrograma?.disable({ emitEvent: false });
      }
    });
  }



  private configurarValidacionActividadMisional(): void {
    const controlViolenciaMisional = this.atencionForm.get('violenciaMisional');
    const controlActividadMisional = this.atencionForm.get('actividadMisional');

    if (!controlViolenciaMisional || !controlActividadMisional) {
      return;
    }

    const aplicarRegla = (valor: unknown) => {
      if (valor === 'SI') {
        controlActividadMisional.setValidators([Validators.required]);
      } else {
        controlActividadMisional.clearValidators();
        controlActividadMisional.setValue('');
      }
      controlActividadMisional.updateValueAndValidity({ emitEvent: false });
    };

    aplicarRegla(controlViolenciaMisional.value);
    controlViolenciaMisional.valueChanges.subscribe(aplicarRegla);
  }

  private cargarListasMaestras(): void {
    forkJoin({
      sexos: this.obtenerMaestro('sexos'),
      etnias: this.obtenerMaestro('etnias'),
      programas: this.obtenerMaestro('programas'),
      identidadesSexuales: this.obtenerMaestro('identidades-genero'),
      orientacionesSexuales: this.obtenerMaestro('orientaciones-sexuales'),
      vinculosUdea: this.obtenerMaestro('vinculos-udea'),
      vinculosAgresorVictima: this.obtenerMaestro('vinculos-agresor-victima'),
      unidadesAdministrativas: this.obtenerMaestro('unidades-administrativas'),
      tiposViolencia: this.obtenerMaestro('tipos-violencia'),
      tiposSolicitud: this.obtenerMaestro('tipos-solicitud'),
      departamentos: this.obtenerMaestro('departamentos'),
      regimenes: this.obtenerMaestro('regimenes'),
      eps: this.obtenerMaestro('eps'),
      tiposServicio: this.obtenerMaestro('tipos-servicio'),
      tiposIdentificacion: this.obtenerMaestro('tipos-identificacion'),
      campus: this.obtenerMaestro('campus'),
      unidadesAcademicas: this.obtenerMaestro('unidades-academicas'),
      formasOcurrencia: this.obtenerMaestro('formas-ocurrencia'),
      lugaresOcurrencia: this.obtenerMaestro('lugares-ocurrencia'),
      actividadesMisionales: this.obtenerMaestro('actividades-misionales'),
      estadosAtencion: this.obtenerMaestro('estados-atencion'),
      gruposAtencion: this.obtenerMaestro('grupos-atencion'),
      modalidadesPsicologicas: this.obtenerMaestro('modalidades-violencia/tipo/1'),
      modalidadesFisicas: this.obtenerMaestro('modalidades-violencia/tipo/2'),
      modalidadesSexuales: this.obtenerMaestro('modalidades-violencia/tipo/3'),
      modalidadesInstitucionales: this.obtenerMaestro('modalidades-violencia/tipo/4'),
      modalidadesPatrimoniales: this.obtenerMaestro('modalidades-violencia/tipo/5'),
      modalidadesInformaticas: this.obtenerMaestro('modalidades-violencia/tipo/6'),
      modalidadesPrejuicio: this.obtenerMaestro('modalidades-violencia/tipo/7'),
      tiemposOcurridoUnidad: this.obtenerMaestro('tiempos-ocurrido-unidad'),
      lugaresEntrevista: this.obtenerMaestro('lugares-entrevista')
    }).subscribe({
      next: (data) => {
        this.catalogoSexos = data.sexos;
        this.catalogoEtnias = data.etnias;
        this.catalogoProgramas = data.programas;
        this.catalogoIdentidadesSexuales = data.identidadesSexuales;
        this.catalogoOrientacionesSexuales = data.orientacionesSexuales;
        this.catalogoVinculosUdea = data.vinculosUdea;
        this.catalogoVinculosAgresorVictima = data.vinculosAgresorVictima;
        this.catalogoUnidadesAdministrativas = data.unidadesAdministrativas;
        this.catalogoRegimenes = data.regimenes;
        this.catalogoEps = data.eps;
        this.catalogoTiposServicio = data.tiposServicio;
        this.catalogoCampus = data.campus;
        this.catalogoUnidadesAcademicas = data.unidadesAcademicas;
        this.catalogoFormasOcurrencia = data.formasOcurrencia;
        this.catalogoLugaresOcurrencia = data.lugaresOcurrencia;
        this.catalogoActividadesMisionales = data.actividadesMisionales;

        this.listaSexo = this.mapNombres(data.sexos);
        this.listaEtnias = this.mapNombres(data.etnias);
        this.listaProgramas = this.mapNombres(data.programas);
        this.listaIdentidadSexual = this.mapNombres(data.identidadesSexuales);
        this.listaOrientacionSexual = this.mapNombres(data.orientacionesSexuales);
        this.listaVinculos = this.mapNombres(data.vinculosUdea);
        this.listaVinculosAgresorVictima = this.mapNombres(data.vinculosAgresorVictima);
        this.listaUnidadesAdministrativas = this.mapNombres(data.unidadesAdministrativas);
        this.listaTipoViolencia = this.mapNombres(data.tiposViolencia);
        this.listaSubTipoViolencia = this.mapNombres(data.modalidadesPsicologicas);
        this.tiposSolicitud = this.mapNombres(data.tiposSolicitud);
        this.listaDepartamentos = data.departamentos;
        this.listaDepartamentosFiltrados = data.departamentos;
        this.listaRegimenSalud = this.mapNombres(data.regimenes);
        this.listaEPSRegimen = this.mapNombres(data.eps);
        this.tiposServicio = this.mapNombres(data.tiposServicio);
        this.tiposDoc = this.mapNombres(data.tiposIdentificacion);
        this.campusM = this.mapNombres(data.campus);
        this.unidadesAcademicasM = this.mapNombres(data.unidadesAcademicas);
        this.queForma = this.mapNombres(data.formasOcurrencia);
        this.lugarHechos = this.mapNombres(data.lugaresOcurrencia);
        this.actividadesMisionales = this.mapNombres(data.actividadesMisionales);
        this.estadosAtencion = this.mapNombres(data.estadosAtencion);
        this.grupoAtencion = this.mapNombres(data.gruposAtencion);
        this.listaPsicologica = data.modalidadesPsicologicas;
        this.listaFisica = data.modalidadesFisicas;
        this.listaSexual = data.modalidadesSexuales;
        this.listaInstitucional = data.modalidadesInstitucionales;
        this.listaPatrimonial = data.modalidadesPatrimoniales;
        this.listaInformatica = data.modalidadesInformaticas;
        this.listaPrejuicio = data.modalidadesPrejuicio;
        this.catalogoTiemposOcurridoUnidad = data.tiemposOcurridoUnidad;
        this.listaTiemposOcurridoUnidad = this.mapNombres(data.tiemposOcurridoUnidad);
        this.lugaresEntrevista = data.lugaresEntrevista;
      },
      error: (error) => {
        console.error('Error cargando listas maestras de registro de atención:', error);
      }
    });
  }

  private configurarUnidadAdministrativaMunicipios(): void {
    this.atencionForm.get('departamentoNacimiento')?.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        this.listaDepartamentosFiltrados = this.listaDepartamentos.filter(d => d.nombre.toLowerCase().includes(filterValue));
      } else if (value) {
        this.atencionForm.patchValue({ ciudadNacimiento: '' });
        this.municipiosNacimiento = [];
        this.municipiosNacimientoFiltrados = [];
        this.cargarMunicipiosPorDepartamento(Number(value), 'nacimiento');
      }
    });

    this.atencionForm.get('ciudadNacimiento')?.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        this.municipiosNacimientoFiltrados = this.municipiosNacimiento.filter(m => m.nombre.toLowerCase().includes(filterValue));
      }
    });

    this.atencionForm.get('departamentoResidencia')?.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        this.listaDepartamentosFiltrados = this.listaDepartamentos.filter(d => d.nombre.toLowerCase().includes(filterValue));
      } else if (value) {
        this.atencionForm.patchValue({ ciudadResidencia: '' });
        this.municipiosResidencia = [];
        this.municipiosResidenciaFiltrados = [];
        this.cargarMunicipiosPorDepartamento(Number(value), 'residencia');
      }
    });

    this.atencionForm.get('ciudadResidencia')?.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        this.municipiosResidenciaFiltrados = this.municipiosResidencia.filter(m => m.nombre.toLowerCase().includes(filterValue));
      }
    });

    this.atencionForm.get('departamentoHechos')?.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        this.listaDepartamentosFiltrados = this.listaDepartamentos.filter(d => d.nombre.toLowerCase().includes(filterValue));
      } else if (value) {
        this.atencionForm.patchValue({ ciudadHechos: '' });
        this.municipiosHechos = [];
        this.municipiosHechosFiltrados = [];
        this.cargarMunicipiosPorDepartamento(Number(value), 'hechos');
      }
    });

    this.atencionForm.get('ciudadHechos')?.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        const filterValue = value.toLowerCase();
        this.municipiosHechosFiltrados = this.municipiosHechos.filter(m => m.nombre.toLowerCase().includes(filterValue));
      }
    });
  }

  private cargarMunicipiosPorDepartamento(departamentoId: number, destino: 'entrevista' | 'nacimiento' | 'residencia' | 'hechos'): void {
    this.http.get<MaestroDto[]>(`${this.maestrosUrl}/departamentos/${departamentoId}/ciudades`).subscribe({
      next: (lista) => {
        if (destino === 'entrevista') {
          this.municipiosEntrevista = lista;
          return;
        }

        if (destino === 'nacimiento') {
          this.municipiosNacimiento = lista;
          this.municipiosNacimientoFiltrados = lista;
          return;
        }

        if (destino === 'residencia') {
          this.municipiosResidencia = lista;
          this.municipiosResidenciaFiltrados = lista;
          return;
        }

        this.municipiosHechos = lista;
        this.municipiosHechosFiltrados = lista;
      },
      error: () => {
        if (destino === 'entrevista') {
          this.municipiosEntrevista = [];
          return;
        }

        if (destino === 'nacimiento') {
          this.municipiosNacimiento = [];
          this.municipiosNacimientoFiltrados = [];
          return;
        }

        if (destino === 'residencia') {
          this.municipiosResidencia = [];
          this.municipiosResidenciaFiltrados = [];
          return;
        }

        this.municipiosHechos = [];
        this.municipiosHechosFiltrados = [];
      }
    });
  }

  displayDepartamento(id: number): string {
    if (!id) return '';
    const dep = this.listaDepartamentos.find(d => d.id === id);
    return dep ? dep.nombre : '';
  }

  displayMunicipioNacimiento(id: number): string {
    if (!id) return '';
    const mun = this.municipiosNacimiento.find(m => m.id === id);
    return mun ? mun.nombre : '';
  }

  displayMunicipioResidencia(id: number): string {
    if (!id) return '';
    const mun = this.municipiosResidencia.find(m => m.id === id);
    return mun ? mun.nombre : '';
  }

  displayMunicipioHechos(id: number): string {
    if (!id) return '';
    const mun = this.municipiosHechos.find(m => m.id === id);
    return mun ? mun.nombre : '';
  }

  private obtenerMaestro(endpoint: string) {
    return this.http.get<MaestroDto[]>(`${this.maestrosUrl}/${endpoint}`).pipe(
      catchError((error) => {
        console.error(`Error cargando maestro ${endpoint}:`, error);
        return of([] as MaestroDto[]);
      })
    );
  }

  private mapNombres(lista: MaestroDto[]): string[] {
    return lista.map(item => item.nombre);
  }

  private resolverIdMaestro(valor: unknown, catalogo: MaestroDto[]): number {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor;
    }

    const texto = String(valor ?? '').trim();
    if (!texto) {
      return Number.NaN;
    }

    const numero = Number(texto);
    if (Number.isFinite(numero)) {
      return numero;
    }

    const textoNormalizado = texto.toLowerCase();
    const maestro = catalogo.find((item) => {
      const nombre = item.nombre?.trim().toLowerCase();
      const codigo = item.codigo?.trim().toLowerCase();
      return nombre === textoNormalizado || codigo === textoNormalizado;
    });

    return maestro?.id ?? Number.NaN;
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.sortOtros) {
      this.dataSourceOtros.sort = this.sortOtros;
    }
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  onPageChangeCitas(event: PageEvent): void {
    this.pageIndexCitas = event.pageIndex;
    this.pageSizeCitas = event.pageSize;
    this.cargarCitas(this.pageIndexCitas, this.pageSizeCitas);
  }

  onCheckboxChange(event: any, valor: number, arrayName: string) {
    const lista = this[arrayName as keyof RegistroAtencionComponent] as number[];
    if (event.checked) {
      lista.push(valor);
    } else {
      const index = lista.indexOf(valor);
      if (index >= 0) lista.splice(index, 1);
    }

    const controlMap: { [key: string]: string } = {
      'psicologicaSel': 'detalleViolenciaPsicologica',
      'fisicaSel': 'detalleViolenciaFisica',
      'sexualSel': 'detalleViolenciaSexual',
      'institucionalSel': 'detalleViolenciaInstitucional',
      'economicaSel': 'detalleViolenciaEconomica',
      'informaticaSel': 'detalleViolenciaInformatica',
      'prejuicioSel': 'detalleViolenciaPrejuicio'
    };

    if (controlMap[arrayName]) {
      this.atencionForm.get(controlMap[arrayName])?.setValue(lista.join(', '));
    }
  }

  regresar(): void {
    this.modoAtencion = false;
    this.casoSeleccionado = null;
  }

  private cargarCitas(page: number = 0, size: number = this.pageSizeCitas): void {
    this.solicitudService.listarCitasPaginadas(page, size, undefined, EstadoCitaEnum.CANCELADA).subscribe({
      next: (respuesta) => {
        const filas = respuesta.content.map((cita) => this.mapearCitaATabla(cita));
        this.casoPorAtender = filas;
        this.dataSource.data = filas;
        this.totalElementosCitas = respuesta.totalElements;
        this.pageIndexCitas = respuesta.number;
        this.pageSizeCitas = respuesta.size;
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.casoPorAtender = [];
        this.dataSource.data = [];
        this.totalElementosCitas = 0;
      }
    });
  }

  private mapearCitaATabla(cita: CitaDto): any {
    return {
      id: cita.codigoSolicitud || String(cita.solicitudId),
      solicitudId: cita.solicitudId,
      citaId: cita.id,
      nombre: cita.nombreSolicitante || '',
      documento: cita.documento || '',
      tipoDocumento: '',
      tipoSolicitud: cita.tipoSolicitud || '',
      fecha: cita.fechaCita ? cita.fechaCita.substring(0, 10) : '',
      unidadAdministrativa: cita.unidadAdministrativa || '',
      profesional: (cita as any).grupoProfesional || (cita as any).profesional || 'Sin asignar',
      unidadAcademica: cita.unidadAcademica || '',
      campus: cita.campus || '',
      genero: cita.identidadGenero || '',
      edad: null,
      celular: cita.celular || '',
      cargo: cita.estadoCita || '',
      telefono: cita.telefonoAlterno || '',
      correoInst: cita.correoInstitucional || '',
      correoPers: cita.correoPersonal || ''
    };
  }

  private obtenerPersonaAtiende(caso: any): string {
    const grupoProfesional = typeof caso?.grupoProfesional === 'string' ? caso.grupoProfesional.trim() : '';
    const profesionalAsignado = typeof caso?.profesional === 'string' ? caso.profesional.trim() : '';

    if (grupoProfesional) {
      return grupoProfesional;
    }

    if (profesionalAsignado) {
      return profesionalAsignado;
    }

    return 'Sin asignar';
  }

  iniciarAtencion(caso: any): void {
    this.casoSeleccionado = caso;
    this.modoAtencion = true;
    this.correoRegistrados = [];
    this.telefonosRegistrados = [];
    this.agresoresRegistrados = [];
    this.atencionId = null;

    this.atencionForm.patchValue({
      tipoSolicitud: caso.tipoSolicitud || 'Indirecta',
      documento: caso.documento || '',
      tipoViolencia: caso.tipoViolencia || ''
    });

    if (caso?.solicitudId) {
      this.cargarOtrosCasos(caso.solicitudId);
      this.solicitudService.obtenerPorId(caso.solicitudId).subscribe({
        next: (solicitud) => {
          this.atencionForm.patchValue({
            tipoDocumento: solicitud.tipoDocumento || this.atencionForm.get('tipoDocumento')?.value,
            documento: solicitud.numeroDocumento || caso.documento || '',
            primerNombre: solicitud.primerNombre || '',
            segundoNombre: solicitud.segundoNombre || '',
            primerApellido: solicitud.primerApellido || '',
            segundoApellido: solicitud.segundoApellido || '',
            fechaNacimiento: solicitud.fechaNacimiento ? new Date(solicitud.fechaNacimiento) : '',
            unidadAdministrativa: solicitud.remitenteUnidadAdministrativa || solicitud.unidadAdministrativa || caso.unidadAdministrativa || '',
            unidadAcademica: solicitud.remitenteUnidadAcademica || caso.unidadAcademica || '',
            campus: solicitud.remitenteCampus || caso.campus || '',
            identidadSexual: solicitud.identidadGenero || '',
            departamentoResidencia: solicitud.idDepartamentoResidencia ?? '',
            ciudadResidencia: solicitud.idCiudadResidencia ?? '',
            direccionResidencia: solicitud.direccionResidencia || ''
          });

          this.correoRegistrados = (solicitud.correos ?? []).map(c => ({
            tipoId: c.tipoId,
            tipo: c.tipo || '',
            correo: c.correo
          }));
          this.telefonosRegistrados = (solicitud.telefonos ?? []).map(t => ({
            tipoId: t.tipoId,
            tipo: t.tipo || '',
            telefono: t.telefono
          }));
        },
        error: (error) => {
          console.error('Error al cargar detalle de solicitud para la cita:', error);
        }
      });
    } else {
      this.casosRelacionados = [];
      this.dataSourceOtros.data = [];
    }
  }

  private cargarOtrosCasos(solicitudId: number): void {
    this.otrosCasosPendientes = [];
    this.otrosCasosEditados = [];
    this.otrosCasosEliminados = [];
    this.cargandoOtrosCasos = true;
    this.solicitudService.listarOtrosCasos(solicitudId).subscribe({
      next: (casos) => {
        this.casosRelacionados = casos;
        this.dataSourceOtros.data = casos;
        this.cargandoOtrosCasos = false;
      },
      error: () => {
        this.casosRelacionados = [];
        this.dataSourceOtros.data = [];
        this.cargandoOtrosCasos = false;
      }
    });
  }

  seleccionarCaso(element: any) {
    console.log(element);
  }

  applyFilterOtros(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterValues[column] = filterValue;
    this.dataSourceOtros.filter = JSON.stringify(this.filterValues);
  }

  onAgregarOtroCaso(): void {
    const dialogRef = this.dialog.open(ModalAgregarCasoComponent, {
      width: '950px',
      maxWidth: '98vw',
      disableClose: true,
      data: {
        titulo: 'Agregar Caso',
        listaOrientacionSexual: this.listaOrientacionSexual,
        queForma: this.queForma,
        lugarHechos: this.lugarHechos,
        actividadesMisionales: this.actividadesMisionales,
        listaPsicologica: this.listaPsicologica,
        listaFisica: this.listaFisica,
        listaSexual: this.listaSexual,
        listaInstitucional: this.listaInstitucional,
        listaPatrimonial: this.listaPatrimonial,
        listaInformatica: this.listaInformatica,
        listaPrejuicio: this.listaPrejuicio,
        listaVinculos: this.listaVinculos,
        listaVinculosAgresorVictima: this.listaVinculosAgresorVictima,
        listaTiemposOcurridoUnidad: this.listaTiemposOcurridoUnidad
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      const _tempId = `temp_${Date.now()}`;
      const request = this.construirRegistroOtroCasoRequest(result);
      this.otrosCasosPendientes.push({ _tempId, formResult: result, request });
      const displayRow = this.construirDisplayOtroCaso(_tempId, result);
      this.casosRelacionados = [displayRow, ...this.casosRelacionados];
      this.dataSourceOtros.data = this.casosRelacionados;
      this.snackBar.open('Caso agregado. Se guardará al registrar la atención.', 'Cerrar', { duration: 3000 });
    });
  }

  onEditarOtroCaso(caso: any): void {
    const esPendiente = !caso?.idCaso && !!caso?._tempId;
    const initialData = esPendiente
      ? this.otrosCasosPendientes.find(p => p._tempId === caso._tempId)?.formResult
      : (caso?.idCaso ? this.construirDatosInicialesOtroCaso(caso as OtroCasoDto) : null);

    if (!initialData && !esPendiente) {
      this.snackBar.open('No fue posible identificar el caso a editar.', 'Cerrar', { duration: 3500 });
      return;
    }

    const dialogRef = this.dialog.open(ModalAgregarCasoComponent, {
      width: '950px',
      maxWidth: '98vw',
      disableClose: true,
      data: {
        titulo: 'Editar Caso',
        listaOrientacionSexual: this.listaOrientacionSexual,
        queForma: this.queForma,
        lugarHechos: this.lugarHechos,
        actividadesMisionales: this.actividadesMisionales,
        listaPsicologica: this.listaPsicologica,
        listaFisica: this.listaFisica,
        listaSexual: this.listaSexual,
        listaInstitucional: this.listaInstitucional,
        listaPatrimonial: this.listaPatrimonial,
        listaInformatica: this.listaInformatica,
        listaPrejuicio: this.listaPrejuicio,
        listaVinculos: this.listaVinculos,
        listaVinculosAgresorVictima: this.listaVinculosAgresorVictima,
        listaTiemposOcurridoUnidad: this.listaTiemposOcurridoUnidad,
        initialData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      const request = this.construirRegistroOtroCasoRequest(result);

      if (esPendiente) {
        const idx = this.otrosCasosPendientes.findIndex(p => p._tempId === caso._tempId);
        if (idx >= 0) {
          this.otrosCasosPendientes[idx] = { _tempId: caso._tempId, formResult: result, request };
        }
        const displayRow = this.construirDisplayOtroCaso(caso._tempId, result);
        this.casosRelacionados = this.casosRelacionados.map(c =>
          c._tempId === caso._tempId ? displayRow : c
        );
      } else {
        const displayRow = this.construirDisplayOtroCasoExistente(caso.idCaso, result);
        const idx = this.otrosCasosEditados.findIndex(e => e.idCaso === caso.idCaso);
        if (idx >= 0) {
          this.otrosCasosEditados[idx] = { idCaso: caso.idCaso, request, displayRow };
        } else {
          this.otrosCasosEditados.push({ idCaso: caso.idCaso, request, displayRow });
        }
        this.casosRelacionados = this.casosRelacionados.map(c =>
          c.idCaso === caso.idCaso ? displayRow : c
        );
      }

      this.dataSourceOtros.data = [...this.casosRelacionados];
      this.snackBar.open('Caso actualizado. Se guardará al registrar la atención.', 'Cerrar', { duration: 2500 });
    });
  }

  onEliminarOtroCaso(caso: any): void {
    const esPendiente = !caso?.idCaso && !!caso?._tempId;

    if (esPendiente) {
      this.otrosCasosPendientes = this.otrosCasosPendientes.filter(p => p._tempId !== caso._tempId);
      this.casosRelacionados = this.casosRelacionados.filter(c => c._tempId !== caso._tempId);
    } else if (caso?.idCaso) {
      this.otrosCasosEliminados.push(caso.idCaso);
      this.otrosCasosEditados = this.otrosCasosEditados.filter(e => e.idCaso !== caso.idCaso);
      this.casosRelacionados = this.casosRelacionados.filter(c => c.idCaso !== caso.idCaso);
    } else {
      return;
    }

    this.dataSourceOtros.data = [...this.casosRelacionados];
  }

  private construirDisplayOtroCaso(_tempId: string, result: any): any {
    const violencias: string[] = [];
    if (result.violenciaPsicologica === 'SI') violencias.push('Psicológica');
    if (result.violenciaFisica === 'SI') violencias.push('Física');
    if (result.violenciaSexual === 'SI') violencias.push('Sexual');
    if (result.violenciaInstitucional === 'SI') violencias.push('Institucional');
    if (result.violenciaEconomica === 'SI') violencias.push('Económica');
    if (result.violenciaInformatica === 'SI') violencias.push('Informática');
    if (result.violenciaPrejuicio === 'SI') violencias.push('Por prejuicio');

    return {
      _tempId,
      idCaso: null,
      id: 'Pendiente',
      tiempoHechos: result.tiempoOcurrido ?? '',
      tipoViolencia: result.violenciaGenero === 'SI' ? 'Género' : result.violenciaMisional === 'SI' ? 'Misional' : '',
      subcategoriaViolencia: violencias.join(', '),
      descripcion: result.hechos?.[0]?.descripcion ?? ''
    };
  }

  private construirDisplayOtroCasoExistente(idCaso: number, result: any): any {
    const violencias: string[] = [];
    if (result.violenciaPsicologica === 'SI') violencias.push('Psicológica');
    if (result.violenciaFisica === 'SI') violencias.push('Física');
    if (result.violenciaSexual === 'SI') violencias.push('Sexual');
    if (result.violenciaInstitucional === 'SI') violencias.push('Institucional');
    if (result.violenciaEconomica === 'SI') violencias.push('Económica');
    if (result.violenciaInformatica === 'SI') violencias.push('Informática');
    if (result.violenciaPrejuicio === 'SI') violencias.push('Por prejuicio');

    return {
      idCaso,
      id: String(idCaso),
      tiempoHechos: result.tiempoOcurrido ?? '',
      tipoViolencia: result.violenciaGenero === 'SI' ? 'Género' : result.violenciaMisional === 'SI' ? 'Misional' : '',
      subcategoriaViolencia: violencias.join(', '),
      descripcion: result.hechos?.[0]?.descripcion ?? ''
    };
  }

  private construirRegistroOtroCasoRequest(result: any): RegistroOtroCasoRequestDto {
    const idOrientacionSexual = this.resolverIdMaestro(result.orientacionSexual, this.catalogoOrientacionesSexuales);
    const idIdentidadGenero = this.resolverIdMaestro(this.atencionForm.getRawValue().identidadSexual, this.catalogoIdentidadesSexuales);
    const idFormaOcurrencia = this.resolverIdMaestro(result.queForma, this.catalogoFormasOcurrencia);
    const idLugarOcurrencia = this.resolverIdMaestro(result.lugarHechos, this.catalogoLugaresOcurrencia);
    const idActividadMisional = result.violenciaMisional === 'SI'
      ? this.resolverIdMaestro(result.actividadMisional, this.catalogoActividadesMisionales)
      : Number.NaN;
    const idVinculoUniversidad = this.resolverIdMaestro(result.presuntoVinculoUniversidad, this.catalogoVinculosUdea);
    const idVinculoVictima = this.resolverIdMaestro(result.presuntoVinculoVictima, this.catalogoVinculosAgresorVictima);

    const hechos = (result.hechos ?? [])
      .map((hecho: any): HechoRequestDto | null => {
        const lugar = String(hecho?.lugar ?? '').trim();
        const descripcion = String(hecho?.descripcion ?? '').trim();
        if (!lugar || !descripcion) {
          return null;
        }

        return {
          fecha: this.formatearFechaLocalDateTime(hecho?.fecha),
          lugar,
          descripcion
        };
      })
      .filter((hecho: HechoRequestDto | null): hecho is HechoRequestDto => hecho !== null);

    return {
      caso: {
        idOrientacionSexual,
        idIdentidadGenero,
        tiempoOcurridoValor: Number(result.tiempoOcurridoValor),
        idTiempoOcurridoUnidad: this.resolverIdMaestro(result.tiempoOcurridoUnidad, this.catalogoTiemposOcurridoUnidad),
        idFormaOcurrencia,
        idLugarOcurrencia,
        violenciaGenero: result.violenciaGenero === 'SI',
        violenciaMisional: result.violenciaMisional === 'SI',
        idActividadMisional: Number.isFinite(idActividadMisional) ? idActividadMisional : null,
        modalidadesViolenciaPsicologica: result.psicologicaSel ?? [],
        modalidadesViolenciaFisica: result.fisicaSel ?? [],
        modalidadesViolenciaSexual: result.sexualSel ?? [],
        modalidadesViolenciaInstitucional: result.institucionalSel ?? [],
        modalidadesViolenciaEconomica: result.economicaSel ?? [],
        modalidadesViolenciaInformatica: result.informaticaSel ?? [],
        modalidadesViolenciaPrejuicio: result.prejuicioSel ?? [],
        agresorVictima: {
          primerNombre: String(result.presuntoPrimerNombre ?? ''),
          segundoNombre: String(result.presuntoSegundoNombre ?? ''),
          primerApellido: String(result.presuntoPrimerApellido ?? ''),
          segundoApellido: String(result.presuntoSegundoApellido ?? ''),
          idVinculoUniversidad,
          idVinculoVictima,
        }
      },
      hechos: hechos.length ? hechos : undefined
    };
  }

  private construirDatosInicialesOtroCaso(caso: OtroCasoDto): any {
    const orientacionSexual = this.resolverNombreMaestroPorId(caso.idOrientacionSexual, this.catalogoOrientacionesSexuales);
    const queForma = this.resolverNombreMaestroPorId(caso.idFormaOcurrencia, this.catalogoFormasOcurrencia);
    const lugarHechos = this.resolverNombreMaestroPorId(caso.idLugarOcurrencia, this.catalogoLugaresOcurrencia);
    const actividadMisional = this.resolverNombreMaestroPorId(caso.idActividadMisional, this.catalogoActividadesMisionales);
    const presuntoVinculoUniversidad = this.resolverNombreMaestroPorId(caso.idVinculoUniversidad, this.catalogoVinculosUdea);
    const presuntoVinculoVictima = this.resolverNombreMaestroPorId(caso.idVinculoVictima, this.catalogoVinculosAgresorVictima);

    const psicologicaSel = caso.modalidadesViolenciaPsicologica ?? [];
    const fisicaSel = caso.modalidadesViolenciaFisica ?? [];
    const sexualSel = caso.modalidadesViolenciaSexual ?? [];
    const institucionalSel = caso.modalidadesViolenciaInstitucional ?? [];
    const economicaSel = caso.modalidadesViolenciaEconomica ?? [];
    const informaticaSel = caso.modalidadesViolenciaInformatica ?? [];
    const prejuicioSel = caso.modalidadesViolenciaPrejuicio ?? [];

    return {
      orientacionSexual,
      tiempoOcurridoValor: caso.tiempoOcurridoValor ?? '',
      tiempoOcurridoUnidad: this.resolverNombreMaestroPorId(caso.idTiempoOcurridoUnidad, this.catalogoTiemposOcurridoUnidad),
      queForma,
      lugarHechos,
      violenciaGenero: caso.violenciaGenero ? 'SI' : 'NO',
      violenciaMisional: caso.violenciaMisional ? 'SI' : 'NO',
      actividadMisional,
      violenciaPsicologica: psicologicaSel.length ? 'SI' : 'NO',
      violenciaFisica: fisicaSel.length ? 'SI' : 'NO',
      violenciaSexual: sexualSel.length ? 'SI' : 'NO',
      violenciaInstitucional: institucionalSel.length ? 'SI' : 'NO',
      violenciaEconomica: economicaSel.length ? 'SI' : 'NO',
      violenciaInformatica: informaticaSel.length ? 'SI' : 'NO',
      violenciaPrejuicio: prejuicioSel.length ? 'SI' : 'NO',
      presuntoPrimerNombre: caso.presuntoPrimerNombre ?? '',
      presuntoSegundoNombre: caso.presuntoSegundoNombre ?? '',
      presuntoPrimerApellido: caso.presuntoPrimerApellido ?? '',
      presuntoSegundoApellido: caso.presuntoSegundoApellido ?? '',
      presuntoVinculoUniversidad,
      presuntoVinculoVictima,
      hechos: (caso.hechos ?? []).map((hecho) => ({
        fecha: hecho.fecha,
        lugar: hecho.lugar,
        descripcion: hecho.descripcion
      })),
      psicologicaSel,
      fisicaSel,
      sexualSel,
      institucionalSel,
      economicaSel,
      informaticaSel,
      prejuicioSel
    };
  }

  private resolverNombreMaestroPorId(id: unknown, catalogo: MaestroDto[]): string {
    const idNumerico = Number(id);
    if (!Number.isFinite(idNumerico)) {
      return '';
    }

    const maestro = catalogo.find((item) => item.id === idNumerico);
    return maestro?.nombre ?? '';
  }

  mostrarQuienRemite(): boolean {
    return this.atencionForm.getRawValue().tipoSolicitud === 'Indirecta';
  }

  esOtroVinculo(): boolean {
    const valor = this.atencionForm.get('vinculo')?.value;
    return this.resolverIdMaestro(valor, this.catalogoVinculosUdea) === VinculoUdeAEnum.OTRO_TIPO_DE_VINCULO;
  }

  abrirModalDireccion(): void {
    const dialogRef = this.dialog.open(ModalDireccionComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { viaPrincipal, numeroVia, letraVia, numeroCruce, placa, barrio, complemento } = result;
        const letra = letraVia ? ` ${letraVia}` : '';
        const comp = complemento ? `, ${complemento}` : '';
        const barr = barrio ? `, Barrio ${barrio}` : '';
        const direccionFinal = `${viaPrincipal} ${numeroVia}${letra} #${numeroCruce}-${placa}${barr}${comp}`;
        this.atencionForm.patchValue({
          direccionResidencia: direccionFinal.replace(/\s+/g, ' ').trim()
        });
      }
    });
  }

  abrirModalApreciacionJuridica(): void {
    const dialogRef = this.dialog.open(ModalApreciacionJuridicaComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apreciacionesJuridicas = [...this.apreciacionesJuridicas, result];
        this.snackBar.open('Apreciación agregada', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalApreciacionPsicologica(): void {
    const dialogRef = this.dialog.open(ModalApreciacionPsicologicaComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.apreciacionesPsicologicas = [...this.apreciacionesPsicologicas, result];
        this.snackBar.open('Apreciación agregada', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalDiscapacidad(): void {
    const dialogRef = this.dialog.open(ModalDiscapacidadComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.discapacidadesRegistradas = [...this.discapacidadesRegistradas, result];
        this.snackBar.open('Discapacidad agregada', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalCorreo(): void {
    const dialogRef = this.dialog.open(ModalCorreoComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.correoRegistrados = [...this.correoRegistrados, result];
        this.snackBar.open('Correo agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalTelefono(): void {
    const dialogRef = this.dialog.open(ModalTelefonoComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.telefonosRegistrados = [...this.telefonosRegistrados, result];
        this.snackBar.open('Telefono agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalHechos(): void {
    const dialogRef = this.dialog.open(ModalHechosComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.hechosRegistrados = [...this.hechosRegistrados, result];
        this.snackBar.open('Hecho agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalMedida(): void {
    const dialogRef = this.dialog.open(ModalMedidasProteccionComponent, {
      width: '700px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.medidasRegistradas = [...this.medidasRegistradas, result];
        this.snackBar.open('Medida de protección académica/laboral agregada', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalAgresor(): void {
    const dialogRef = this.dialog.open(ModalPresuntoAgresorComponent, {
      width: '700px',
      disableClose: true,
      data: {
        vinculosUdea: this.catalogoVinculosUdea,
        vinculosAgresor: this.catalogoVinculosAgresorVictima
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.agresoresRegistrados = [...this.agresoresRegistrados, result];
        this.snackBar.open('Presunto agresor agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalRemision(): void {
    const dialogRef = this.dialog.open(ModalRemisionComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.remisionesRegistrados = [...this.remisionesRegistrados, result];
        this.snackBar.open('Hecho agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  abrirModalRutaActivada(): void {
    const dialogRef = this.dialog.open(ModalActivarRutaComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.activarRutasRegistrados = [...this.activarRutasRegistrados, result];
        this.snackBar.open('Hecho agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }
  abrirModalCompromisosPersona(): void {
    const dialogRef = this.dialog.open(ModalCompromisosPersonaComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.compromisosPersona = [...this.compromisosPersona, result];
        this.snackBar.open('Hecho agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }
  abrirModalCompromisosProfesional(): void {
    const dialogRef = this.dialog.open(ModalCompromisosProfesionalesComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.compromisosProfesional = [...this.compromisosProfesional, result];
        this.snackBar.open('Hecho agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }
  abrirModalSeguimientos(tipoSeguimiento?: string): void {
    const dialogRef = this.dialog.open(ModalSeguimientosComponent, {
      width: '800px',
      disableClose: true,
      data: { tipoSeguimiento }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.seguimientosRegistrados = [...this.seguimientosRegistrados, result];
        this.snackBar.open('Hecho agregado', 'Cerrar', { duration: 2000 });
      }
    });
  }
  eliminarSeguimientos(i: number) {
    this.seguimientosRegistrados.splice(i, 1);
    this.seguimientosRegistrados = [...this.seguimientosRegistrados];
  }
  eliminarCompromisosProfesional(i: number) {
    this.compromisosProfesional.splice(i, 1);
    this.compromisosProfesional = [...this.compromisosProfesional];
  }
  eliminarDiscapacidad(i: number) {
    this.discapacidadesRegistradas.splice(i, 1);
    this.discapacidadesRegistradas = [...this.discapacidadesRegistradas];
  }
  eliminarCompromisosPersona(i: number) {
    this.compromisosPersona.splice(i, 1);
    this.compromisosPersona = [...this.compromisosPersona];
  }
  eliminarCorreo(i: number) {
    this.correoRegistrados.splice(i, 1);
    this.correoRegistrados = [...this.correoRegistrados];
  }
  eliminarTelefono(i: number) {
    this.telefonosRegistrados.splice(i, 1);
    this.telefonosRegistrados = [...this.telefonosRegistrados];
  }
  eliminarHechos(i: number) {
    this.hechosRegistrados.splice(i, 1);
    this.hechosRegistrados = [...this.hechosRegistrados];
  }
  eliminarRemision(i: number) {
    this.remisionesRegistrados.splice(i, 1);
    this.remisionesRegistrados = [...this.remisionesRegistrados];
  }
  eliminarRutaActivada(i: number) {
    this.activarRutasRegistrados.splice(i, 1);
    this.activarRutasRegistrados = [...this.activarRutasRegistrados];
  }
  eliminarMedida(i: number) {
    this.medidasRegistradas.splice(i, 1);
    this.medidasRegistradas = [...this.medidasRegistradas];
  }

  eliminarAgresor(i: number) {
    this.agresoresRegistrados.splice(i, 1);
    this.agresoresRegistrados = [...this.agresoresRegistrados];
  }

  formatearNombreAgresor(agresor: any): string {
    if (!agresor) return 'Desconocido';
    const partes = [agresor.primerNombre, agresor.segundoNombre, agresor.primerApellido, agresor.segundoApellido];
    const nombreCompleto = partes.filter(n => typeof n === 'string' && n.trim() !== '').join(' ');
    return nombreCompleto || 'Desconocido';
  }
  eliminarApreciacionJuridica(i: number) {
    this.apreciacionesJuridicas.splice(i, 1);
    this.apreciacionesJuridicas = [...this.apreciacionesJuridicas];
  }
  eliminarApreciacionPsicologica(i: number) {
    this.apreciacionesPsicologicas.splice(i, 1);
    this.apreciacionesPsicologicas = [...this.apreciacionesPsicologicas];
  }

  eliminarAcuerdo(index: number) {
    this.casoPorAtender.splice(index, 1);
    this.dataSource.data = [...this.casoPorAtender];
  }

  editarAcuerdo(element: any) { console.log('Editar', element); }

  initForm(): void {
    this.atencionForm = this.fb.group({
      tipoSolicitud: [{ value: 'Indirecta', disabled: true }],
      departamentoNacimiento: [''],
      ciudadNacimiento: [''],
      departamentoResidencia: [''],
      ciudadResidencia: [''],
      fechaHora: [{ value: new Date(), disabled: true }],
      personaRegistra: [{ value: '', disabled: true }],
      tipoServicio: [''],
      quienRemite: [{ value: 'Unidad de Bienestar Universitario', disabled: true }],
      lugarEntrevista: [''],
      consentimientoArchivo: [null],
      personaAtiende: [{ value: 'Sin asignar', disabled: true }],
      tipoDocumento: [{ value: '', disabled: true }],
      documento: [{ value: '', disabled: true }],
      fechaNacimiento: [{ value: '', disabled: true }],
      primerNombre: [{ value: '', disabled: true }],
      segundoNombre: [{ value: '', disabled: true }],
      primerApellido: [{ value: '', disabled: true }],
      segundoApellido: [{ value: '', disabled: true }],
      sexo: [''],
      etnia: [''],
      identidadSexual: [''],
      orientacionSexual: [''],
      eps: [''],
      regimenSalud: [''],
      unidadAdministrativa: [''],
      campus: [''],
      unidadAcademica: [''],
      vinculo: [''],
      otroVinculo: [''],
      programa: [{ value: '', disabled: true }],
      logroAcuerdo: ['NO'],
      tipoViolencia: [''],
      subcategoriaViolencia: [''],
      tiempoOcurridoValor: [''],
      tiempoOcurridoUnidad: ['meses'],
      queForma: [''],
      departamentoHechos: [''],
      ciudadHechos: [''],
      lugarHechos: [''],
      violenciaGenero: [''],
      violenciaMisional: [''],
      actividadMisional: [''],
      presuntoPrimerNombre: [''],
      presuntoSegundoNombre: [''],
      presuntoPrimerApellido: [''],
      presuntoSegundoApellido: [''],
      presuntoVinculoUniversidad: [''],
      presuntoVinculoVictima: [''],
      direccionResidencia: [''],
      violenciaPsicologica: ['NO'],
      detalleViolenciaPsicologica: [''],
      violenciaFisica: ['NO'],
      detalleViolenciaFisica: [''],
      violenciaSexual: ['NO'],
      detalleViolenciaSexual: [''],
      violenciaInstitucional: ['NO'],
      detalleViolenciaInstitucional: [''],
      violenciaEconomica: ['NO'],
      detalleViolenciaEconomica: [''],
      violenciaInformatica: ['NO'],
      detalleViolenciaInformatica: [''],
      violenciaPrejuicio: ['NO'],
      estadosAtencion: [''],
      grupoAtencion: [''],
      detalleViolenciaPrejuicio: [''],
      observacionesTelefono: [''],
      observacionesCorreo: [''],
    });
  }

  subirArchivo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.atencionForm.patchValue({ consentimientoArchivo: file });
        this.snackBar.open(`Archivo ${file.name} cargado`, 'Cerrar', { duration: 2000 });
      }
    };
    input.click();
  }

  private validarFormulario(): boolean {
    this.atencionForm.markAllAsTouched();
    this.tabErrors = new Set<string>();
    const errorsByTab: Record<string, string[]> = {};

    for (const field of this.tabFieldMap) {
      if (field.condition && !field.condition()) continue;
      const ctrl = this.atencionForm.get(field.control);
      if (ctrl && ctrl.invalid) {
        this.tabErrors.add(field.tab);
        if (!errorsByTab[field.tab]) errorsByTab[field.tab] = [];
        errorsByTab[field.tab].push(field.label);
      }
    }

    if (this.tabErrors.size > 0) {
      const partes = Object.entries(errorsByTab)
        .map(([tab, fields]) => `[${tab}]: ${fields.join(', ')}`)
        .join(' · ');
      this.snackBar.open(`Campos requeridos faltantes — ${partes}`, 'Cerrar', {
        duration: 12000,
        panelClass: ['snack-error'],
      });
      return false;
    }
    return true;
  }

  getLogicalTabIndex(visualIndex: number): number {
    const isVbgVisible = this.atencionForm.get('violenciaGenero')?.value === 'SI';
    if (isVbgVisible) {
      if (visualIndex === 6) return 7;
      if (visualIndex === 7) return 6;
      return visualIndex;
    } else {
      if (visualIndex < 4) return visualIndex;
      if (visualIndex === 4) return 5;
      if (visualIndex === 5) return 7;
      if (visualIndex === 6) return 6;
      return visualIndex + 1;
    }
  }

  guardarAtencion(tabIndex: number | null = null): void {
    const targetVisualIndex = tabIndex !== null && tabIndex !== undefined ? tabIndex : this.activeTabIndex;
    const targetTabIndex = this.getLogicalTabIndex(targetVisualIndex);
    this.guardandoCompromisos = true;
    this.construirRegistroAtencionRequest(targetTabIndex)
      .then((dataFinal) => {
        this.solicitudService.registrarPestana(targetTabIndex, dataFinal).subscribe({
          next: (atencion) => {
            this.guardandoCompromisos = false;
            this.tabErrors = new Set<string>();

            if (atencion && atencion.id) {
              this.atencionId = atencion.id;
            }

            this.dialog.open(DialogoExitoComponent, {
              width: '400px',
              data: {
                titulo: '¡Guardado Exitoso!',
                mensaje: 'Datos de la pestaña guardados exitosamente.'
              }
            });
          },
          error: (error) => {
            this.guardandoCompromisos = false;
            console.error('Error registrando atención:', error);
            const msg = 'No fue posible guardar los datos de la pestaña';
            this.snackBar.open(msg, 'Cerrar', { duration: 3500 });
          }
        });
      })
      .catch((error) => {
        this.guardandoCompromisos = false;
        console.error('Error preparando request de atención:', error);
        this.snackBar.open('No fue posible preparar el archivo o los seguimientos', 'Cerrar', { duration: 3500 });
      });
  }

  private async construirRegistroAtencionRequest(tabIndex: number): Promise<any> {
    const formRawValue = this.atencionForm.getRawValue();
    const {
      fechaHora,
      tipoServicio,
      lugarEntrevista,
      regimenSalud,
      eps,
      logroAcuerdo,
      consentimientoArchivo,
      sexo,
      etnia,
      identidadSexual,
      orientacionSexual,
      ciudadResidencia,
      direccionResidencia,
      unidadAdministrativa,
      campus,
      unidadAcademica,
      vinculo,
      programa,
      tiempoOcurridoValor,
      tiempoOcurridoUnidad,
      queForma,
      lugarHechos,
      violenciaGenero,
      violenciaMisional,
      actividadMisional,
      direccionLugar,
      presuntoPrimerNombre,
      presuntoSegundoNombre,
      presuntoPrimerApellido,
      presuntoSegundoApellido,
      presuntoVinculoUniversidad,
      presuntoVinculoVictima,
      observacionesTelefono,
      observacionesCorreo
    } = formRawValue;

    const archivoConsentimientoContenido = consentimientoArchivo instanceof File
      ? await this.solicitudService.convertirArchivoABase64(consentimientoArchivo)
      : undefined;

    const seguimientos = await this.mapearSeguimientosRequest(this.atencionId ?? 0);
    const hechos = this.mapearHechosRequest();

    const compromisosPersona = this.compromisosPersona
      .map((compromiso) => this.mapearCompromisoPersonaRequest(compromiso, this.atencionId ?? 0))
      .filter((compromiso): compromiso is CompromisoPersonaRequestDto => compromiso !== null);

    const compromisosProfesional = this.compromisosProfesional
      .map((compromiso) => this.mapearCompromisoProfesionalRequest(compromiso, this.atencionId ?? 0))
      .filter((compromiso): compromiso is CompromisoProfesionalRequestDto => compromiso !== null);

    const atencionContexto: AtencionContextoRequestDto = {
      idUnidadAdministrativa: this.resolverIdMaestro(unidadAdministrativa, this.catalogoUnidadesAdministrativas),
      idCampus: this.resolverIdMaestro(campus, this.catalogoCampus),
      idUnidadAcademica: this.resolverIdMaestro(unidadAcademica, this.catalogoUnidadesAcademicas),
      idVinculoUniversidad: this.resolverIdMaestro(vinculo, this.catalogoVinculosUdea),
      otroVinculo: this.resolverIdMaestro(vinculo, this.catalogoVinculosUdea) === VinculoUdeAEnum.OTRO_TIPO_DE_VINCULO ? formRawValue.otroVinculo : null,
      idPrograma: this.resolverIdMaestro(programa, this.catalogoProgramas),
      idEtnia: etnia ? this.resolverIdMaestro(etnia, this.catalogoEtnias) : null,
      idCiudadResidencia: ciudadResidencia ? Number(ciudadResidencia) : null,
      direccionResidencia: direccionResidencia || null
    };

    const correos = this.correoRegistrados
      .filter((c) => c?.correo && c?.tipoId)
      .map((c) => ({
        tipoId: Number(c.tipoId),
        correo: String(c.correo).trim()
      }));

    const telefonos = this.telefonosRegistrados
      .filter((t) => t?.telefono && t?.tipoId)
      .map((t) => ({
        tipoId: Number(t.tipoId),
        telefono: String(t.telefono).trim()
      }));

    const citaId = Number(this.casoSeleccionado?.citaId ?? this.casoSeleccionado?.idCita ?? this.casoSeleccionado?.idcita ?? 0);

    switch (tabIndex) {
      case 0:
        return {
          citaId,
          idAtencion: this.atencionId,
          idTipoServicio: this.resolverIdMaestro(tipoServicio, this.catalogoTiposServicio),
          idLugarEntrevista: Number(lugarEntrevista),
          archivoConsentimientoNombre: consentimientoArchivo?.name,
          archivoConsentimientoTipo: consentimientoArchivo?.type,
          archivoConsentimientoContenido
        };
      case 1:
        return {
          citaId,
          idAtencion: this.atencionId,
          idRegimen: this.resolverIdMaestro(regimenSalud, this.catalogoRegimenes),
          idEps: this.resolverIdMaestro(eps, this.catalogoEps),
          persona: {
            idSexo: this.resolverIdMaestro(sexo, this.catalogoSexos),
            idEtnia: this.resolverIdMaestro(etnia, this.catalogoEtnias),
            idCiudadResidencia: ciudadResidencia ? Number(ciudadResidencia) : null,
            direccionResidencia: direccionResidencia || null,
            correos: correos.length ? correos : undefined,
            telefonos: telefonos.length ? telefonos : undefined
          }
        };
      case 2:
        return {
          citaId,
          idAtencion: this.atencionId,
          atencionContexto,
          observacionesTelefono: observacionesTelefono || null,
          observacionesCorreo: observacionesCorreo || null
        };
      case 3:
        return {
          citaId,
          idAtencion: this.atencionId,
          caso: {
            idOrientacionSexual: this.resolverIdMaestro(orientacionSexual, this.catalogoOrientacionesSexuales),
            idIdentidadGenero: this.resolverIdMaestro(identidadSexual, this.catalogoIdentidadesSexuales),
            tiempoOcurridoValor: tiempoOcurridoValor ? Number(tiempoOcurridoValor) : 0,
            idTiempoOcurridoUnidad: this.resolverIdMaestro(tiempoOcurridoUnidad, this.catalogoTiemposOcurridoUnidad),
            idFormaOcurrencia: this.resolverIdMaestro(queForma, this.catalogoFormasOcurrencia),
            idLugarOcurrencia: this.resolverIdMaestro(lugarHechos, this.catalogoLugaresOcurrencia),
            violenciaGenero: violenciaGenero === true || violenciaGenero === 'SI',
            violenciaMisional: violenciaMisional === true || violenciaMisional === 'SI',
            idActividadMisional: actividadMisional ? this.resolverIdMaestro(actividadMisional, this.catalogoActividadesMisionales) : null
          },
          hechos: hechos.length ? hechos : undefined
        };
      case 4:
        return {
          citaId,
          idAtencion: this.atencionId,
          caso: {
            tipoViolenciaPsicologica: this.psicologicaSel.length > 0,
            tipoViolenciaFisica: this.fisicaSel.length > 0,
            tipoViolenciaSexual: this.sexualSel.length > 0,
            tipoViolenciaInstitucional: this.institucionalSel.length > 0,
            tipoViolenciaEconomicaPatrimonial: this.economicaSel.length > 0,
            tipoViolenciaSexualInformatica: this.informaticaSel.length > 0,
            tipoViolenciaPorPrejuicio: this.prejuicioSel.length > 0,
            modalidadesViolenciaPsicologica: this.psicologicaSel,
            modalidadesViolenciaFisica: this.fisicaSel,
            modalidadesViolenciaSexual: this.sexualSel,
            modalidadesViolenciaInstitucional: this.institucionalSel,
            modalidadesViolenciaEconomica: this.economicaSel,
            modalidadesViolenciaInformatica: this.informaticaSel,
            modalidadesViolenciaPrejuicio: this.prejuicioSel
          }
        };
      case 5:
        const agresoresMapped = this.agresoresRegistrados.map(a => ({
          primerNombre: a.primerNombre || null,
          segundoNombre: a.segundoNombre || null,
          primerApellido: a.primerApellido || null,
          segundoApellido: a.segundoApellido || null,
          idVinculoUniversidad: a.idVinculoUniversidad || null,
          idVinculoVictima: a.idVinculoVictima || null
        }));
        return {
          citaId,
          idAtencion: this.atencionId,
          agresores: agresoresMapped
        };
      case 6:
        const rutasMapped = this.activarRutasRegistrados.map(r => ({
          idTipoRutaActivacion: r.idTipoRutaActivacion,
          idRutaActivacion: r.idRutaActivacion
        })).filter(r => r.idTipoRutaActivacion !== undefined && r.idRutaActivacion !== undefined);

        const remisionesMapped = this.remisionesRegistrados.map(r => ({
          idTipoRemision: r.idTipoRemision,
          cual: r.cual || null,
          fecha: this.formatearFechaLocalDateTime(r.fecha)
        })).filter(r => r.idTipoRemision !== undefined);

        return {
          citaId,
          idAtencion: this.atencionId,
          logroAcuerdo: logroAcuerdo === true || logroAcuerdo === 'SI',
          rutas: rutasMapped,
          remisiones: remisionesMapped
        };
      case 7:
        return { citaId, idAtencion: this.atencionId };
      case 8:
        return {
          citaId,
          idAtencion: this.atencionId,
          otrosCasos: this.otrosCasosPendientes.length ? this.otrosCasosPendientes.map(p => p.request) : undefined,
          otrosCasosActualizar: this.otrosCasosEditados.length ? this.otrosCasosEditados.map(e => ({ idCaso: e.idCaso, ...e.request })) : undefined,
          otrosCasosEliminar: this.otrosCasosEliminados.length ? [...this.otrosCasosEliminados] : undefined
        };
      case 9:
        const medidasMapped = this.medidasRegistradas.map(m => ({
          tipoMedidaId: m.tipoMedidaId,
          subtipoMedidaId: m.subtipoMedidaId,
          responsableId: m.responsableId,
          fechaRegistro: this.formatearFechaLocalDateTime(m.fechaRegistro),
          descripcion: m.descripcion || ""
        })).filter(m => m.tipoMedidaId !== undefined && m.tipoMedidaId !== null);

        return {
          citaId,
          idAtencion: this.atencionId,
          medidas: medidasMapped
        };
      case 10:
        return {
          citaId,
          idAtencion: this.atencionId,
          compromisos: (compromisosPersona.length || compromisosProfesional.length) ? {
            persona: compromisosPersona.length ? compromisosPersona : undefined,
            profesional: compromisosProfesional.length ? compromisosProfesional : undefined
          } : undefined
        };
      case 11:
        return {
          citaId,
          idAtencion: this.atencionId,
          seguimientos: seguimientos.length ? seguimientos : undefined
        };
      case 12:
        return {
          citaId,
          idAtencion: this.atencionId,
          idEstadoAtencion: this.resolverIdMaestro(formRawValue.estadosAtencion, this.catalogoTiposServicio)
        };
      default:
        return { citaId, idAtencion: this.atencionId };
    }
  }

  private mapearHechosRequest(): HechoRequestDto[] {
    return this.hechosRegistrados
      .map((hecho): HechoRequestDto | null => {
        const lugar = String(hecho?.lugar ?? '').trim();
        const descripcion = String(hecho?.descripcion ?? '').trim();
        const fecha = this.formatearFechaLocalDateTime(hecho?.fecha) ?? String(hecho?.fecha ?? '').trim();

        if (!lugar || !descripcion) {
          return null;
        }

        return {
          fecha: fecha || null,
          lugar,
          descripcion
        };
      })
      .filter((hecho): hecho is HechoRequestDto => hecho !== null);
  }

  private async mapearSeguimientosRequest(idAtencion: number): Promise<SeguimientoAtencionRequestDto[]> {
    const seguimientos = await Promise.all(
      this.seguimientosRegistrados.map((seguimiento) => this.mapearSeguimientoRequest(seguimiento, idAtencion))
    );

    return seguimientos.filter((seguimiento): seguimiento is SeguimientoAtencionRequestDto => seguimiento !== null);
  }

  private async mapearSeguimientoRequest(seguimiento: any, idAtencion: number): Promise<SeguimientoAtencionRequestDto | null> {
    const fecha = this.formatearFechaLocalDateTime(seguimiento?.fecha);
    if (!fecha) {
      return null;
    }

    const idTipoSeguimiento = Number(seguimiento?.idtiposeguimiento);
    const idAccion = Number(seguimiento?.idaccion);
    const idActividad = Number(seguimiento?.idactividad);
    const idEstadoSeguimiento = Number(seguimiento?.idestadoseguimiento);
    const idMotivoEstadoSeguimiento = Number(seguimiento?.idmotivoestado);

    if (
      !Number.isFinite(idTipoSeguimiento)
      || !Number.isFinite(idAccion)
      || !Number.isFinite(idActividad)
      || !Number.isFinite(idEstadoSeguimiento)
      || !Number.isFinite(idMotivoEstadoSeguimiento)
    ) {
      return null;
    }

    const archivo = seguimiento?.archivo instanceof File ? seguimiento.archivo : null;
    const archivoContenido = archivo ? await this.solicitudService.convertirArchivoABase64(archivo) : undefined;

    return {
      idAtencion,
      idTipoSeguimiento,
      fecha,
      idAccion,
      idActividad,
      descripcion: String(seguimiento?.descripcion ?? ''),
      idEstadoSeguimiento,
      idMotivoEstadoSeguimiento,
      archivoNombre: archivo?.name,
      archivoTipo: archivo?.type,
      archivoContenido
    };
  }

  private mapearCompromisoPersonaRequest(compromiso: any, idAtencion: number): CompromisoPersonaRequestDto | null {
    const idTipoCompromiso = Number(compromiso?.idtipocompromiso);
    const fechaCompromiso = this.formatearFechaLocalDateTime(compromiso?.fecha);

    if (!Number.isFinite(idTipoCompromiso) || !fechaCompromiso) {
      return null;
    }

    return {
      idatencion: idAtencion,
      idtipocompromiso: idTipoCompromiso,
      fechacompromiso: fechaCompromiso
    };
  }

  private mapearCompromisoProfesionalRequest(compromiso: any, idAtencion: number): CompromisoProfesionalRequestDto | null {
    const idTipoCompromiso = Number(compromiso?.idtipocompromiso);
    const idGrupoProfesional = Number(compromiso?.idgrupoprofesional);
    const fechaCompromiso = this.formatearFechaLocalDateTime(compromiso?.fecha);

    if (!Number.isFinite(idTipoCompromiso) || !Number.isFinite(idGrupoProfesional) || !fechaCompromiso) {
      return null;
    }

    return {
      idatencion: idAtencion,
      idtipocompromiso: idTipoCompromiso,
      idgrupoprofesional: idGrupoProfesional,
      fechacompromiso: fechaCompromiso
    };
  }

  private formatearFechaLocalDateTime(fecha: unknown): string | null {
    const fechaDate = fecha instanceof Date ? fecha : new Date(String(fecha));

    if (Number.isNaN(fechaDate.getTime())) {
      return null;
    }

    const yyyy = fechaDate.getFullYear();
    const mm = String(fechaDate.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaDate.getDate()).padStart(2, '0');
    const hh = String(fechaDate.getHours()).padStart(2, '0');
    const min = String(fechaDate.getMinutes()).padStart(2, '0');
    const ss = String(fechaDate.getSeconds()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  }
}
