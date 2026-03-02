import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { ModalDireccionComponent } from '../modal-direccion/modal-direccion.component';
import { ModalDiscapacidadComponent } from '../modal-discapacidad/modal-discapacidad.component';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';
import { ModalHechosComponent } from '../modal-hechos/modal-hechos.component';
import { ModalRemisionComponent } from '../modal-remision/modal-remision.component';
import { ModalActivarRutaComponent } from '../modal-activar-ruta/modal-activar-ruta.component';
import { ModalApreciacionJuridicaComponent } from '../modal-apreciacion-juridica/modal-apreciacion-juridica.component';
import { ModalApreciacionPsicologicaComponent } from '../modal-apreciacion-psicologica/modal-apreciacion-psicologica.component';

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
    MatTooltipModule
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

  acuerdosCompromisos: any[] = [
    { idCaso: '1001', tiempoHechos: 'Reciente', tipoViolencia: 'Psicológica', subcategoria: 'Acoso', descripcion: 'Seguimiento por afectación emocional' },
    { idCaso: '1002', tiempoHechos: 'Hace 6 meses', tipoViolencia: 'Física', subcategoria: 'Agresión', descripcion: 'Compromiso de acompañamiento médico' },
    { idCaso: '1003', tiempoHechos: 'Hace 1 año', tipoViolencia: 'Sexual', subcategoria: 'Intimidación', descripcion: 'Remisión a atención especializada' }
  ];

  dataSource = new MatTableDataSource<any>(this.acuerdosCompromisos);
  displayedColumnsTablaInicial = ['expand', 'idCaso', 'tipoViolencia', 'descripcion', 'acciones'];
  displayedColumnsAcuerdos: string[] = ['idCaso', 'tiempoHechos', 'tipoViolencia', 'subcategoria', 'descripcion', 'acciones'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  modoAtencion = false;
  casoSeleccionado: any = null;
  expandedElement: any | null = null;

  filterValues: any = {
    idCaso: '',
    tipoViolencia: '',
    descripcion: ''
  };

  discapacidadesRegistradas: any[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  apreciacionesJuridicas: any[] = [];
  apreciacionesPsicologicas: any[] = [];
  hechosRegistrados: any[] = [];
  remisionesRegistrados: any[] = [];
  activarRutasRegistrados: any[] = [];

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
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues[column] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
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
      documento: caso.idCaso || '',
      tipoViolencia: caso.tipoViolencia || ''
    });
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
    const dialogRef = this.dialog.open(ModalApreciacionJuridicaComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.apreciacionesJuridicas.push(res); });
  }

  abrirModalApreciacionPsicologica(): void {
    const dialogRef = this.dialog.open(ModalApreciacionPsicologicaComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.apreciacionesPsicologicas.push(res); });
  }

  abrirModalDiscapacidad(): void {
    const dialogRef = this.dialog.open(ModalDiscapacidadComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.discapacidadesRegistradas.push(res); });
  }

  abrirModalCorreo(): void {
    const dialogRef = this.dialog.open(ModalCorreoComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.correoRegistrados.push(res); });
  }

  abrirModalTelefono(): void {
    const dialogRef = this.dialog.open(ModalTelefonoComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.telefonosRegistrados.push(res); });
  }

  abrirModalHechos(): void {
    const dialogRef = this.dialog.open(ModalHechosComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.hechosRegistrados.push(res); });
  }

  abrirModalRemision(): void {
    const dialogRef = this.dialog.open(ModalRemisionComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.remisionesRegistrados.push(res); });
  }

  abrirModalRutaActivada(): void {
    const dialogRef = this.dialog.open(ModalActivarRutaComponent, { width: '800px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.activarRutasRegistrados.push(res); });
  }

  eliminarDiscapacidad(i: number) { this.discapacidadesRegistradas.splice(i, 1); }
  eliminarCorreo(i: number) { this.correoRegistrados.splice(i, 1); }
  eliminarTelefono(i: number) { this.telefonosRegistrados.splice(i, 1); }
  eliminarHechos(i: number) { this.hechosRegistrados.splice(i, 1); }
  eliminarRemision(i: number) { this.remisionesRegistrados.splice(i, 1); }
  eliminarRutaActivada(i: number) { this.activarRutasRegistrados.splice(i, 1); }
  
  eliminarAcuerdo(index: number) {
    this.acuerdosCompromisos.splice(index, 1);
    this.dataSource.data = [...this.acuerdosCompromisos];
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
      violenciaGenero: ['', Validators.required],
      presuntoPrimerNombre: ['', Validators.required],
      presuntoSegundoNombre: [''],
      presuntoPrimerApellido: ['', Validators.required],
      presuntoSegundoApellido: [''],
      presuntoVinculoUniversidad: ['', Validators.required],
      presuntoVinculoVictima: ['', Validators.required],
      direccionLugar: ['']
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
        apreciacionesPsicologicas: this.apreciacionesPsicologicas
      };
      console.log('Datos a enviar:', dataFinal);
      this.snackBar.open('Registro guardado exitosamente', 'OK', { duration: 3000 });
    } else {
      this.atencionForm.markAllAsTouched();
      this.snackBar.open('Por favor complete los campos obligatorios', 'Cerrar', { duration: 3000 });
    }
  }
}