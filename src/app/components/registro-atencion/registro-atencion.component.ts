import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { ModalDireccionComponent } from '../modal-direccion/modal-direccion.component';
import { ModalDiscapacidadComponent } from '../modal-discapacidad/modal-discapacidad.component';
import { ModalCorreoComponent } from '../modal-correo/modal-correo.component';
import { ModalTelefonoComponent } from '../modal-telefono/modal-telefono.component';
import { MatRadioModule } from '@angular/material/radio';
import { ModalHechosComponent } from '../modal-hechos/modal-hechos.component';


ModalHechosComponent
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
    MatRadioModule
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

  listaSexo = ['Masculino', 'Femenino', 'Intersexual', 'Indeterminado'];
  listaEtnias = ['Ninguna', 'Indígena', 'Afrocolombiano', 'Raizal', 'Palenquero', 'Rrom/Gitano'];
  listaProgramas = ['Ingeniería', 'Derecho', 'Medicina', 'Artes', 'Ciencias Sociales', 'Educación Física']
  listaIdentidadSexual = ['Hombre cisgénero', 'Mujer cisgénero', 'Hombre trans', 'Mujer trans', 'No binario', 'Género fluido', 'Otro'];
  listaOrientacionSexual = ['Heterosexual', 'Homosexual (GAY/LESBIANA)', 'Bisexual', 'Pansexual', 'Asexual', 'Otro'];
  listaVinculos = ['Estudiante Pregrado', 'Estudiante Posgrado', 'Docente', 'Administrativo', 'Egresado', 'Contratista', 'Visitante'];
  listaSubVinculos = ['Estudiante Pregrado', 'Estudiante Posgrado', 'Docente', 'Administrativo', 'Egresado', 'Contratista', 'Visitante'];
  listaDependencia = [];
  listaTipoViolencia = ['Violencia Psiclogica', 'Violencia Sexual', 'Violencia Física'];
  listaSubTipoViolencia = ['Difusión de contenido intimo', 'Intimidación y Amenazas', 'Aislamiento Forzado'];
  tiposSolicitud = ['Psicosocial', 'Jurídica', 'Salud', 'Académica'];
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
      celular: ['', [Validators.required, Validators.maxLength(10)]],
      telefonoAlterno: ['', Validators.required],
      correoPersonal: ['', [Validators.required, Validators.email]],
      correoInstitucional: [''],
      direccionLugar: [''],
      eps: ['', Validators.required],
      regimenSalud: ['', Validators.required],
      dependencia: ['', Validators.required],
      campus: ['', Validators.required],
      facultad: ['', Validators.required],
      vinculo: ['', Validators.required],
      subVinculo: ['', Validators.required],
      tipoViolencia: ['', Validators.required],
      subcategoriaViolencia: ['', Validators.required],
      tiempoOcurrido: ['', Validators.required],
      programa: ['', Validators.required],
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

  abrirModalDiscapacidad(): void {
    const dialogRef = this.dialog.open(ModalDiscapacidadComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.discapacidadesRegistradas.push(result);
      }
    });
  }

  eliminarDiscapacidad(index: number): void {
    this.discapacidadesRegistradas.splice(index, 1);
  }

  abrirModalDireccion(): void {
    const dialogRef = this.dialog.open(ModalDireccionComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.atencionForm.patchValue({ direccionLugar: result });
      }
    });
  }

  abrirModalCorreo(): void {
    const dialogRef = this.dialog.open(ModalCorreoComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.correoRegistrados.push(result);
      }
    });
  }

  eliminarCorreo(index: number): void {
    this.correoRegistrados.splice(index, 1);
  }

  abrirModalTelefono(): void {
    const dialogRef = this.dialog.open(ModalTelefonoComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.telefonosRegistrados.push(result);
      }
    });
  }

  eliminarTelefono(index: number): void {
    this.telefonosRegistrados.splice(index, 1);
  }

  abrirModalHechos(): void {
    const dialogRef = this.dialog.open(ModalHechosComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.hechosRegistrados.push(result);
      }
    });
  }

  eliminarHechos(index: number): void {
    this.hechosRegistrados.splice(index, 1);
  }

  subirArchivo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.atencionForm.patchValue({ consentimientoArchivo: file.name });
      }
    };
    input.click();
  }

  guardarAtencion(): void {
    if (this.atencionForm.valid) {
      const data = { ...this.atencionForm.value, discapacidades: this.discapacidadesRegistradas };
      console.log(data);
    }
  }
}