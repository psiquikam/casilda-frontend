import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

import { ModalDireccionComponent } from '../modal-direccion/modal-direccion.component';
import { ModalDiscapacidadComponent } from '../modal-discapacidad/modal-discapacidad.component';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';
import { ModalHechosComponent } from '../modal-hechos/modal-hechos.component';
import { ModalRemisionComponent } from '../modal-remision/modal-remision.component';
import { ModalActivarRutaComponent } from '../modal-activar-ruta/modal-activar-ruta.component';
import { ModalApreciacionJuridicaComponent } from '../modal-apreciacion-juridica/modal-apreciacion-juridica.component';
import { ModalApreciacionPsicologicaComponent } from '../modal-apreciacion-psicologica/modal-apreciacion-psicologica.component';
import { TablaCasosComponent } from '../tabla-casos/tabla-casos.component';
import { TablaOtrosCasosComponent } from '../tabla-otros-casos/tabla-otros-casos.component';
import { ModalCompromisosPersonaComponent } from '../modal-compromisos-persona/modal-compromisos-persona.component';
import { ModalCompromisosProfesionalesComponent } from '../modal-compromisos-profesionales/modal-compromisos-profesionales.component';
import { ModalSeguimientosComponent } from '../modal-seguimiento/modal-seguimiento.component';

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
    TablaCasosComponent,
    TablaOtrosCasosComponent,
    MatCheckboxModule,
    FormsModule
  ],
  templateUrl: './registro-atencion.component.html',
  styleUrls: ['./registro-atencion.component.scss'],
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

  casoPorAtender: any[] = [
    {
      id: '1001',
      tiempoHechos: 'Reciente',
      tipoViolencia: 'Psicológica',
      subcategoria: 'Acoso',
      descripcion: 'Seguimiento por afectación emocional',
      nombre: 'Jose Alfredo Martinez Robledo',
      documento: '1213154312',
      tipoDocumento: 'CC',
      tipoSolicitud: 'Directa',
      fecha: '2025-01-25',
      dependencia: 'Ingenieria',
      profesional: 'Sin asignar',
      facultad: 'Ingeniería',
      campus: 'Principal',
      genero: 'Masculino',
      edad: 22,
      celular: '3001234567',
      cargo: 'Estudiante',
      telefono: '6041234567',
      correoInst: 'jose@universidad.edu',
      correoPers: 'jose@gmail.com'
    },
    {
      id: '1002',
      tiempoHechos: 'Hace 6 meses',
      tipoViolencia: 'Física',
      subcategoria: 'Agresión',
      descripcion: 'Compromiso de acompañamiento médico',
      nombre: 'Laura Victoria Florez Parra',
      documento: '987654321',
      tipoDocumento: 'CC',
      tipoSolicitud: 'Directa',
      fecha: '2025-01-25',
      dependencia: 'Artes',
      profesional: 'Sin asignar',
      facultad: 'Medicina',
      campus: 'Salud',
      genero: 'Femenino',
      edad: 25,
      celular: '3019876543',
      cargo: 'Estudiante',
      telefono: '6047654321',
      correoInst: 'laura@universidad.edu',
      correoPers: 'laura@gmail.com'
    }
  ];

  casosRelacionados: any[] = [
    {
      id: '1001',
      tiempoHechos: 'Reciente',
      tipoViolencia: 'Psicológica',
      subcategoria: 'Acoso',
      descripcion: 'Seguimiento por afectación emocional',
      nombre: 'Jose Alfredo Martinez Robledo',
      documento: '1213154312',
      tipoDocumento: 'CC',
      tipoSolicitud: 'Directa',
      fecha: '2025-01-25',
      dependencia: 'Ingenieria',
      profesional: 'Sin asignar',
      facultad: 'Ingeniería',
      campus: 'Principal',
      genero: 'Masculino',
      edad: 22,
      celular: '3001234567',
      cargo: 'Estudiante',
      telefono: '6041234567',
      correoInst: 'jose@universidad.edu',
      correoPers: 'jose@gmail.com'
    },
    {
      id: '1002',
      tiempoHechos: 'Hace 6 meses',
      tipoViolencia: 'Física',
      subcategoria: 'Agresión',
      descripcion: 'Compromiso de acompañamiento médico',
      nombre: 'Laura Victoria Florez Parra',
      documento: '987654321',
      tipoDocumento: 'CC',
      tipoSolicitud: 'Directa',
      fecha: '2025-01-25',
      dependencia: 'Artes',
      profesional: 'Sin asignar',
      facultad: 'Medicina',
      campus: 'Salud',
      genero: 'Femenino',
      edad: 25,
      celular: '3019876543',
      cargo: 'Estudiante',
      telefono: '6047654321',
      correoInst: 'laura@universidad.edu',
      correoPers: 'laura@gmail.com'
    }
  ];

  dataSource = new MatTableDataSource<any>(this.casoPorAtender);
  dataSourceOtros = new MatTableDataSource<any>(this.casosRelacionados);
  displayedColumnsTablaInicial: string[] = ['expand', 'id', 'nombre', 'documento', 'fecha', 'dependencia', 'profesional', 'acciones'];
  displayedColumnsOtros: string[] = ['expand', 'id', 'nombre', 'documento', 'fecha', 'dependencia', 'profesional',];
  catalogoSeguimiento: string[] = ['Presencial', 'Telefónico', 'Virtual', 'Visita Domiciliaria'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @ViewChild('paginatorOtros') paginatorOtros!: MatPaginator;
  @ViewChild('sortOtros') sortOtros!: MatSort;

  tipoSeguimientoControl = new FormControl<string | null>(null);

  miFormulario = new FormGroup({
    tipoSeguimiento: this.tipoSeguimientoControl
  });

  modoAtencion = false;
  casoSeleccionado: any = null;
  expandedElement: any | null = null;
  expandedElementOtros: any | null = null;
  tipoSeguimientoSeleccionado?: string;

  filterValues: any = {
    id: '',
    nombre: '',
    documento: '',
    fecha: '',
    dependencia: '',
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
  compromisosPersona: any[] = [];
  compromisosProfesional: any[] = [];
  seguimientosRegistrados: any[] = [];

  psicologicaSel: string[] = [];
  fisicaSel: string[] = [];
  sexualSel: string[] = [];
  institucionalSel: string[] = [];
  economicaSel: string[] = [];

  listaSexo = ['Masculino', 'Femenino', 'Intersexual', 'Indeterminado'];
  listaEtnias = ['Ninguna', 'Indígena', 'Afrocolombiano', 'Raizal', 'Palenquero', 'Rrom/Gitano'];
  listaProgramas = ['Ingeniería', 'Derecho', 'Medicina', 'Artes', 'Ciencias Sociales', 'Educación Física'];
  listaIdentidadSexual = ['Hombre cisgénero', 'Mujer cisgénero', 'Hombre trans', 'Mujer trans', 'No binario', 'Género fluido', 'Otro'];
  listaOrientacionSexual = ['Heterosexual', 'Homosexual (GAY/LESBIANA)', 'Bisexual', 'Pansexual', 'Asexual', 'Otro'];
  listaVinculos = ['Estudiante Pregrado', 'Estudiante Posgrado', 'Docente', 'Administrativo', 'Egresado', 'Contratista', 'Visitante'];
  listaSubVinculos = ['Estudiante Pregrado', 'Estudiante Posgrado', 'Docente', 'Administrativo', 'Egresado', 'Contratista', 'Visitante'];
  listaDependencia = ['Bienestar Universitario', 'Rectoría', 'Talento Humano', 'Admisiones'];
  listaTipoViolencia = ['Violencia Psicológica', 'Violencia Sexual', 'Violencia Física', 'Violencia Económica'];
  listaSubTipoViolencia = ['Difusión de contenido íntimo', 'Intimidación y Amenazas', 'Aislamiento Forzado', 'Acoso'];
  tiposSolicitud = ['Indirecta', 'Directa'];
  formayLugar = ['Lugar 1', 'Lugar 2'];
  listaRegimenSalud = ['Contributivo', 'Subsidiado'];
  listaEPSRegimen = ['Nuevo EPS', 'Savia Salud', 'SURA'];
  tiposServicio = ['Asesoría', 'Acompañamiento', 'Seguimiento', 'Intervención'];
  tiposDoc = ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte'];
  campusM = ['Principal', 'Robledo', 'Salud', 'Norte', 'Oriente'];
  facultadesM = ['Ingeniería', 'Derecho', 'Medicina', 'Artes', 'Ciencias Sociales', 'Educación Física'];
  queForma = ['Individual', 'Colectiva', 'Otra'];
  lugarHechos = ['Campus Principal', 'Campus Salud', 'Entorno Virtual', 'Fuera de la Universidad'];
  actividadesMisionales = ['Docencia', 'Extensión', 'Investigación', 'Administrativas'];
  estadosAtencion = ['estado 1', 'estado 2', 'estado 3', 'estado 4'];
  grupoAtencion = ['grupo 1', 'grupo 2', 'grupo 3', 'grupo 4'];

  listaPsicologica = [
    'Difusión de contenido íntimo',
    'Constreñimiento ilegal',
    'Lenguaje misógino, sexista o discursos de odio',
    'Intimidación y amenazas',
    'Aislamiento forzado',
    'Abuso de poder y/o confianza',
    'Injurias por vías de hecho o calumnia'
  ];

  listaFisica = [
    'Violencia intrafamiliar',
    'Violencia de pareja/expareja',
    'Violencia interpersonal',
    'Lesiones personales',
    'Feminicidio (Tentativa o comisión)'
  ];

  listaSexual = [
    'Acoso sexual',
    'Acceso carnal',
    'Actos sexuales',
    'Violencia sexual correctiva'
  ];

  listaInstitucional = [
    'Omision del deber de denuncia',
    'Revictimización',
    'Omisión al deber de debida diligencia',
  ];

  listaPatrimonial = [
    'Inasistencia alimentaria',
    'Hurto',
    'Control económico',
    'Daño en bien ajeno',
  ];

  listaInformatica = [
    'Grooming',
    'Pornografía',
    'Sexting',
    'Chantaje sexual o extorsión sexual',
    'Violación de datos personales',
  ];

  listaPrejuicio = [
    'Discriminación por género u orientación sexual o identidad de género',
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.simularCargaBackend();

    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      const idMatch = data.idCaso.toString().toLowerCase().includes(searchTerms.idCaso);
      const tipoMatch = data.tipoViolencia.toLowerCase().includes(searchTerms.tipoViolencia);
      const descMatch = data.descripcion.toLowerCase().includes(searchTerms.descripcion);
      return idMatch && tipoMatch && descMatch;
    };

    this.dataSourceOtros.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      const idMatch = data.idCaso.toString().toLowerCase().includes(searchTerms.idCaso);
      const tipoMatch = data.tipoViolencia.toLowerCase().includes(searchTerms.tipoViolencia);
      const descMatch = data.descripcion.toLowerCase().includes(searchTerms.descripcion);
      return idMatch && tipoMatch && descMatch;
    };

    this.atencionForm.get('logroAcuerdo')?.valueChanges.subscribe(valor => {
      if (valor === 'NO') {
        this.remisionesRegistrados = [];
        this.activarRutasRegistrados = [];
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSourceOtros.paginator = this.paginatorOtros;
    this.dataSourceOtros.sort = this.sortOtros;
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onCheckboxChange(event: any, valor: string, arrayName: string) {
    const lista = this[arrayName as keyof RegistroAtencionComponent] as string[];
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
      'economicaSel': 'detalleViolenciaEconomica'
    };

    if (controlMap[arrayName]) {
      this.atencionForm.get(controlMap[arrayName])?.setValue(lista.join(', '));
    }
  }

  regresar(): void {
    this.modoAtencion = false;
    this.casoSeleccionado = null;
  }

  iniciarAtencion(caso: any): void {
    this.casoSeleccionado = caso;
    this.modoAtencion = true;
    this.atencionForm.patchValue({
      tipoSolicitud: caso.tipoSolicitud || 'Indirecta',
      documento: caso.documento || '',
      tipoViolencia: caso.tipoViolencia || ''
    });
  }

  seleccionarCaso(element: any) {
    console.log(element);
  }

  applyFilterOtros(column: string, event: Event) {
    console.log(column, event);
  }

  mostrarQuienRemite(): boolean {
    return this.atencionForm.getRawValue().tipoSolicitud === 'Indirecta';
  }

  abrirModalDireccion(): void {
    const dialogRef = this.dialog.open(ModalDireccionComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { viaPrincipal, numeroVia, letraVia, numeroCruce, placa, barrio, ciudad, complemento } = result;
        const letra = letraVia ? ` ${letraVia}` : '';
        const comp = complemento ? ` (${complemento})` : '';
        const direccionFinal = `${viaPrincipal} ${numeroVia}${letra} # ${numeroCruce} - ${placa}, ${barrio}, ${ciudad}${comp}`;
        this.atencionForm.patchValue({ direccionLugar: direccionFinal.replace(/\s+/g, ' ').trim() });
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
      tipoSolicitud: [{ value: 'Indirecta', disabled: true }, Validators.required],
      lugarNacimiento: ['', Validators.required],
      fechaHora: [{ value: new Date(), disabled: true }, Validators.required],
      personaRegistra: [{ value: 'Usuario_Sistema_01', disabled: true }, Validators.required],
      tipoServicio: ['', Validators.required],
      quienRemite: [{ value: 'Unidad de Bienestar Universitario', disabled: true }],
      formaEntrevista: ['', Validators.required],
      consentimientoArchivo: [null],
      personaAtiende: [{ value: 'Nombre del Profesional', disabled: true }, Validators.required],
      tipoDocumento: [{ value: '', disabled: true }, Validators.required],
      documento: [{ value: '', disabled: true }, [Validators.required]],
      fechaNacimiento: [{ value: '', disabled: true }, Validators.required],
      primerNombre: [{ value: '', disabled: true }, Validators.required],
      segundoNombre: [{ value: '', disabled: true }],
      primerApellido: [{ value: '', disabled: true }, Validators.required],
      segundoApellido: [{ value: '', disabled: true }],
      sexo: ['', Validators.required],
      etnia: ['', Validators.required],
      identidadSexual: ['', Validators.required],
      orientacionSexual: ['', Validators.required],
      eps: ['', Validators.required],
      regimenSalud: ['', Validators.required],
      dependencia: ['', Validators.required],
      campus: ['', Validators.required],
      facultad: ['', Validators.required],
      vinculo: ['', Validators.required],
      subVinculo: ['', Validators.required],
      programa: ['', Validators.required],
      logroAcuerdo: ['NO'],
      tipoViolencia: ['', Validators.required],
      subcategoriaViolencia: ['', Validators.required],
      tiempoOcurrido: ['', Validators.required],
      queForma: ['', Validators.required],
      lugarHechos: ['', Validators.required],
      violenciaGenero: ['', Validators.required],
      violenciaMisional: ['', Validators.required],
      actividadMisional: ['', Validators.required],
      presuntoPrimerNombre: ['', Validators.required],
      presuntoSegundoNombre: [''],
      presuntoPrimerApellido: ['', Validators.required],
      presuntoSegundoApellido: [''],
      presuntoVinculoUniversidad: ['', Validators.required],
      presuntoVinculoVictima: ['', Validators.required],
      direccionLugar: [''],
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
      estadosAtencion: ['', Validators.required],
      grupoAtencion: ['', Validators.required],
      detalleViolenciaPrejuicio: [''],
    });
  }

  simularCargaBackend(): void {
    setTimeout(() => {
      this.atencionForm.patchValue({
        tipoSolicitud: 'Indirecta',
        personaRegistra: 'Usuario_Sistema_01',
        quienRemite: 'Unidad de Bienestar Universitario',
        fechaHora: new Date(),
        tipoDocumento: 'Cédula de Ciudadanía',
        documento: '1234567890',
        fechaNacimiento: new Date(1998, 4, 15),
        primerNombre: 'Laura',
        segundoNombre: 'María',
        primerApellido: 'Gómez',
        segundoApellido: 'Restrepo'
      });
    }, 500);
  }

  subirArchivo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.atencionForm.patchValue({ consentimientoArchivo: file.name });
        this.snackBar.open(`Archivo ${file.name} cargado`, 'Cerrar', { duration: 2000 });
      }
    };
    input.click();
  }

  guardarAtencion(): void {
    if (this.atencionForm.valid) {
      const dataFinal = {
        ...this.atencionForm.getRawValue(),
        discapacidades: this.discapacidadesRegistradas,
        correosExtra: this.correoRegistrados,
        telefonosExtra: this.telefonosRegistrados,
        otrosHechos: this.hechosRegistrados,
        remisiones: this.remisionesRegistrados,
        rutas: this.activarRutasRegistrados,
        apreciacionesJuridicas: this.apreciacionesJuridicas,
        compromisosPersona: this.compromisosPersona,
        compromisosProfesional: this.compromisosProfesional,
        seguimientos: this.seguimientosRegistrados,
        apreciacionesPsicologicas: this.apreciacionesPsicologicas,
        detalleVbg: {
          psicologica: this.psicologicaSel,
          fisica: this.fisicaSel,
          sexual: this.sexualSel,
          institucional: this.institucionalSel,
          economica: this.economicaSel
        }
      };
      console.log('Datos a enviar:', dataFinal);
      this.snackBar.open('Registro guardado exitosamente', 'OK', { duration: 3000 });
    } else {
      this.atencionForm.markAllAsTouched();
      this.snackBar.open('Por favor complete los campos obligatorios', 'Cerrar', { duration: 3000 });
    }
  }
}