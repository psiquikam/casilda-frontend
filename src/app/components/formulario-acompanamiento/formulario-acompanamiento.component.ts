import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';

import { ListasService } from '../../services/listas.service';
import { DialogoExitoComponent } from '../dialog-exito/dialog-exito.component';

@Component({
  selector: 'app-formulario-acompanamiento',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatRadioModule, 
    MatDialogModule, MatTabsModule
  ],
  templateUrl: './formulario-acompanamiento.component.html',
  styleUrls: ['./formulario-acompanamiento.component.scss']
})
export class FormularioAcompanamientoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private listasService = inject(ListasService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  acompanamientoForm!: FormGroup;
  tiposSolicitud: string[] = [];
  campusLista: string[] = [];
  dependencias: string[] = [];
  facultades: string[] = [];
  tiposDocumento: string[] = [];

  constructor() {
    this.listasService.listas$
      .pipe(takeUntilDestroyed())
      .subscribe(data => {
        this.tiposSolicitud = data.tiposSolicitud;
        this.campusLista = data.campus;
        this.dependencias = data.dependencias;
        this.facultades = data.facultades;
        this.tiposDocumento = data.tiposDocumento;
      });
  }

  ngOnInit(): void {
    this.initForm();
    this.setupConditionalValidation();
  }

  initForm(): void {
    this.acompanamientoForm = this.fb.group({
      tipoReporte: ['', Validators.required],

      remitenteTipoSolicitud: [''],
      remitentePrimerNombre: [''],
      remitenteSegundoNombre: [''],
      remitentePrimerApellido: [''],
      remitenteSegundoApellido: [''],
      remitenteCargo: [''],
      remitenteCampus: [''],
      remitenteDependencia: [''],
      remitenteFacultad: [''],
      remitenteOtraFacultad: [''],
      remitenteFechaSolicitud: [new Date()],
      remitenteTipoDocumento: [''],
      remitenteNumeroDocumento: [''],

      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      fechaNacimiento: [null, Validators.required],
      primerNombre: ['', [Validators.required, Validators.minLength(2)]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required, Validators.minLength(2)]],
      segundoApellido: [''],
      identidadGenero: ['', Validators.required],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      telefonoAlterno: ['', [Validators.pattern('^[0-9]{10}$')]],
      correoInstitucional: ['', [Validators.required, Validators.email]],
      correoPersonal: ['', [Validators.required, Validators.email]]
    });
  }

  setupConditionalValidation(): void {
    this.acompanamientoForm.get('tipoReporte')?.valueChanges.subscribe(tipo => {
      const remitenteFields = [
        'remitenteTipoSolicitud', 'remitentePrimerNombre', 'remitentePrimerApellido',
        'remitenteCargo', 'remitenteCampus', 'remitenteDependencia', 'remitenteFacultad',
        'remitenteFechaSolicitud', 'remitenteTipoDocumento', 'remitenteNumeroDocumento'
      ];
      
      remitenteFields.forEach(f => {
        const control = this.acompanamientoForm.get(f);
        if (tipo === 'indirecta') {
          control?.setValidators([Validators.required]);
        } else {
          control?.clearValidators();
          control?.setValue(f === 'remitenteFechaSolicitud' ? new Date() : '');
        }
        control?.updateValueAndValidity();
      });
    });
  }

  enviarSolicitud(): void {
    if (this.acompanamientoForm.valid) {
      const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
      const payload = this.acompanamientoForm.value;

      console.log('Enviando solicitud:', payload);

      this.dialog.open(DialogoExitoComponent, {
        width: '400px',
        data: {
          titulo: '¡Solicitud Creada!',
          mensaje: 'Tu requerimiento ha sido registrado en el sistema.',
          codigo: `REQ-${numeroAleatorio}`
        }
      });
      
      this.acompanamientoForm.reset({ 
        remitenteFechaSolicitud: new Date() 
      });
    } else {
      this.acompanamientoForm.markAllAsTouched();
      this.snackBar.open('Por favor, revisa los campos marcados en rojo', 'Cerrar', { duration: 3000 });
    }
  }

  cancelar(): void {
    if (confirm('¿Desea limpiar todos los campos del formulario?')) {
      this.acompanamientoForm.reset({ 
        remitenteFechaSolicitud: new Date() 
      });
    }
  }
}