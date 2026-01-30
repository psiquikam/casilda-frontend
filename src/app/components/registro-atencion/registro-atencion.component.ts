import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
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
import { MatDialog } from '@angular/material/dialog';
import { ModalDireccionComponent } from '../modal-direccion/modal-direccion.component';

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
  ],
  templateUrl: './registro-atencion.component.html',
  styleUrls: ['./registro-atencion.component.scss']
})
export class RegistroAtencionComponent implements OnInit {
  atencionForm!: FormGroup;

  tiposDoc = ['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Tarjeta de Identidad', 'Pasaporte'];
  tiposSolicitud = ['Queja', 'Reclamo', 'Sugerencia', 'Denuncia'];
  tiposServicio = ['Asesoría Jurídica', 'Acompañamiento Psicosocial', 'Intervención Directa'];
  facultadesM = ['Ingeniería', 'Artes y Humanidades', 'Ciencias de la Salud', 'Ciencias Económicas'];
  campusM = ['Sede Principal', 'Sede Norte', 'Campus Deportivo', 'Sede Virtual'];
  dependencias = ['Bienestar Universitario', 'Secretaría General', 'Rectoría', 'Talento Humano'];

  etnias = ['Ninguna', 'Afrodescendiente', 'Indígena', 'Rrom', 'Palenquero'];
  sexos = ['Masculino', 'Femenino', 'Intersexual'];
  identidadesSexual = ['Hombre Cis', 'Mujer Cis', 'Hombre Trans', 'Mujer Trans', 'No binario'];
  regimenesSalud = ['Contributivo', 'Subsidiado', 'Especial', 'Excepción'];
  vinculosU = ['Estudiante', 'Docente', 'Administrativo', 'Egresado', 'Contratista'];

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
      fechaHora: [new Date(), Validators.required],
      personaRegistra: ['', Validators.required],
      tipoServicio: ['', Validators.required],
      quienRemite: ['', Validators.required],
      formaEntrevista: ['', Validators.required],
      consentimientoArchivo: [null],

      // TAB 2: Datos de la persona
      documento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      tipoDocumento: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      celular: ['', [Validators.required, Validators.maxLength(10)]],
      telefonoAlterno: [''],
      etnia: ['', Validators.required],
      sexo: ['', Validators.required],
      identidadSexual: ['', Validators.required],
      orientacionSexual: [''],
      tipoCorreo: ['Personal'],
      descripcionPersona: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      direccionLugar: [''],

      // TAB 3: Datos complementarios
      eps: ['', Validators.required],
      regimenSalud: ['', Validators.required],
      vinculoUni: ['', Validators.required],
      subCategoriaVinculo: [''],
      facultad: ['', Validators.required],
      programa: [''],
      dependencia: ['', Validators.required],
      campus: ['', Validators.required],
      tipoDiscapacidad: ['Ninguna'],
      discapacidad: ['No aplica'],

      // TAB 4: Documentación
      tipoViolencia: ['', Validators.required],
      subcategoriaViolencia: ['', Validators.required],
      tiempoOcurrido: ['', Validators.required],
      hechos: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  abrirModalDireccion(): void {
    const dialogRef = this.dialog.open(ModalDireccionComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.atencionForm.patchValue({ direccionLugar: result });
        this.snackBar.open('Dirección cargada correctamente', 'Cerrar', { duration: 2000 });
      }
    });
  }
  subirArchivo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.atencionForm.patchValue({ consentimientoArchivo: file.name });
        this.snackBar.open(`Archivo cargado: ${file.name}`, 'OK', { duration: 3000 });
      }
    };
    input.click();
  }

  cancelar(): void {
    if (confirm('¿Está seguro de cancelar? Se perderán los datos no guardados.')) {
      this.atencionForm.reset();
      this.initForm();
    }
  }

  guardarAtencion(): void {
    if (this.atencionForm.valid) {
      console.log('--- ENVIANDO REGISTRO ---');
      console.log(this.atencionForm.value);
      this.snackBar.open('Atención registrada exitosamente', 'Éxito', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    } else {
      this.marcarComoTocados(this.atencionForm);
      this.snackBar.open('Por favor verifique los campos obligatorios en todos los tabs', 'Error', {
        duration: 4000
      });
    }
  }

  private marcarComoTocados(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.marcarComoTocados(control as FormGroup);
      }
    });
  }
}