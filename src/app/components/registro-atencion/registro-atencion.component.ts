import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material Imports
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
import { MatTableModule } from '@angular/material/table';

// Modales
import { ModalDireccionComponent } from '../modal-direccion/modal-direccion.component';
import { ModalDiscapacidadComponent } from '../modal-discapacidad/modal-discapacidad.component';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';
import { ModalHechosComponent } from '../modal-hechos/modal-hechos.component';
import { ModalRemisionComponent } from '../modal-remision/modal-remision.component';
import { ModalActivarRutaComponent } from '../modal-activar-ruta/modal-activar-ruta.component';

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
    MatTableModule
  ],
  templateUrl: './registro-atencion.component.html',
  styleUrls: ['./registro-atencion.component.scss']
})
export class RegistroAtencionComponent implements OnInit {
  atencionForm!: FormGroup;

  discapacidadesRegistradas: any[] = [];
  correoRegistrados: any[] = [];
  telefonosRegistrados: any[] = [];
  hechosRegistrados: any[] = [];
  remisionesRegistrados: any[] = [];
  activarRutasRegistrados: any[] = [];

  displayedColumnsHechos: string[] = ['fecha', 'descripcion', 'acciones'];

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
  tiposSolicitud = ['Psicosocial', 'Jurídica', 'Salud', 'Académica'];
  tiposServicio = ['Asesoría', 'Acompañamiento', 'Seguimiento', 'Intervención'];
  tiposDoc = ['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjería', 'Pasaporte'];
  campusM = ['Principal', 'Robledo', 'Salud', 'Norte', 'Oriente'];
  facultadesM = ['Ingeniería', 'Derecho', 'Medicina', 'Artes', 'Ciencias Sociales', 'Educación Física'];
  listaRegimen = ['Contributivo', 'Subsidiado', 'Especial', 'Excepción'];
  acuerdosCompromisos: any[] = [
    {
      idCaso: 'CAS-1001',
      tiempoHechos: 'Reciente',
      tipoViolencia: 'Psicológica',
      subcategoria: 'Acoso',
      descripcion: 'Seguimiento por afectación emocional'
    },
    {
      idCaso: 'CAS-1002',
      tiempoHechos: 'Hace 6 meses',
      tipoViolencia: 'Física',
      subcategoria: 'Agresión',
      descripcion: 'Compromiso de acompañamiento médico'
    },
    {
      idCaso: 'CAS-1003',
      tiempoHechos: 'Hace 1 año',
      tipoViolencia: 'Sexual',
      subcategoria: 'Intimidación',
      descripcion: 'Remisión a atención especializada'
    }
  ];

  displayedColumnsAcuerdos: string[] = [
    'idCaso',
    'tiempoHechos',
    'tipoViolencia',
    'subcategoria',
    'descripcion',
    'acciones'
  ];

  editarAcuerdo(element: any) {
    console.log('Editar', element);
  }

  eliminarAcuerdo(index: number) {
    this.acuerdosCompromisos.splice(index, 1);
  }


  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.atencionForm = this.fb.group({
      tipoSolicitud: ['', Validators.required],
      personaAtiende: ['', Validators.required],
      lugarNacimiento: ['', Validators.required],
      fechaHora: [new Date(), Validators.required],
      personaRegistra: ['', Validators.required],
      tipoServicio: ['', Validators.required],
      quienRemite: ['', Validators.required],
      formaEntrevista: ['', Validators.required],
      consentimientoArchivo: [null],

      tipoDocumento: ['', Validators.required],
      documento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      fechaNacimiento: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      sexo: ['', Validators.required],
      etnia: ['', Validators.required],
      identidadSexual: ['', Validators.required],
      orientacionSexual: ['', Validators.required],

      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      telefonoAlterno: [''],
      correoPersonal: ['', [Validators.required, Validators.email]],
      correoInstitucional: ['', [Validators.email]],
      direccionLugar: [''],
      eps: ['', Validators.required],
      regimenSalud: ['', Validators.required],

      dependencia: ['', Validators.required],
      campus: ['', Validators.required],
      facultad: ['', Validators.required],
      vinculo: ['', Validators.required],
      subVinculo: ['', Validators.required],
      programa: ['', Validators.required],

      tipoViolencia: ['', Validators.required],
      subcategoriaViolencia: ['', Validators.required],
      tiempoOcurrido: ['', Validators.required],
      hechos: ['', [Validators.required, Validators.minLength(20)]],
      violenciaGenero: ['', Validators.required],

      presuntoPrimerNombre: ['', Validators.required],
      presuntoSegundoNombre: [''],
      presuntoPrimerApellido: ['', Validators.required],
      presuntoSegundoApellido: [''],
      presuntoVinculoUniversidad: ['', Validators.required],
      presuntoVinculoVictima: ['', Validators.required],
    });
  }


  abrirModalDireccion(): void {
    const dialogRef = this.dialog.open(ModalDireccionComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.atencionForm.patchValue({ direccionLugar: result });
    });
  }

  abrirModalDiscapacidad(): void {
    const dialogRef = this.dialog.open(ModalDiscapacidadComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.discapacidadesRegistradas.push(res); });
  }

  abrirModalCorreo(): void {
    const dialogRef = this.dialog.open(ModalCorreoComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.correoRegistrados.push(res); });
  }

  abrirModalTelefono(): void {
    const dialogRef = this.dialog.open(ModalTelefonoComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.telefonosRegistrados.push(res); });
  }

  abrirModalHechos(): void {
    const dialogRef = this.dialog.open(ModalHechosComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.hechosRegistrados.push(res); });
  }

  abrirModalRemision(): void {
    const dialogRef = this.dialog.open(ModalRemisionComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.remisionesRegistrados.push(res); });
  }

  abrirModalRutaActivada(): void {
    const dialogRef = this.dialog.open(ModalActivarRutaComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.activarRutasRegistrados.push(res); });
  }


  eliminarDiscapacidad(i: number) { this.discapacidadesRegistradas.splice(i, 1); }
  eliminarCorreo(i: number) { this.correoRegistrados.splice(i, 1); }
  eliminarTelefono(i: number) { this.telefonosRegistrados.splice(i, 1); }
  eliminarHechos(i: number) { this.hechosRegistrados.splice(i, 1); }
  eliminarRemision(i: number) { this.remisionesRegistrados.splice(i, 1); }
  eliminarRutaActivada(i: number) { this.activarRutasRegistrados.splice(i, 1); }


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
        ...this.atencionForm.value,
        discapacidades: this.discapacidadesRegistradas,
        correosExtra: this.correoRegistrados,
        telefonosExtra: this.telefonosRegistrados,
        otrosHechos: this.hechosRegistrados,
        remisiones: this.remisionesRegistrados,
        rutas: this.activarRutasRegistrados
      };
      console.log('Datos a enviar:', dataFinal);
      this.snackBar.open('Registro guardado exitosamente', 'OK', { duration: 3000 });
    } else {
      this.atencionForm.markAllAsTouched();
      this.snackBar.open('Por favor complete los campos obligatorios', 'Cerrar', { duration: 3000 });
    }
  }
}