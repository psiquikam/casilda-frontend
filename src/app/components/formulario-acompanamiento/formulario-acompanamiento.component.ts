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
      //Datos remitente
      remitentePrimerNombre: [''],
      remitenteSegundoNombre: [''],
      remitentePrimerApellido: [''],
      remitenteSegundoApellido: [''],
      cargo: [''],

      primerNombre: ['', [Validators.required, Validators.minLength(2)]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required, Validators.minLength(2)]],
      segundoApellido: [''],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      tipoReporte: ['', Validators.required],
      tipoSolicitud: [''],
      fechaSolicitud: [new Date()],
      dependencia: ['', Validators.required],
      identidadGenero: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      celularAlterno: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      correoInstitucional: ['', [Validators.required, Validators.email]],
      correoPersonal: ['', [Validators.required, Validators.email]],
      facultad: ['', Validators.required],
      campus: ['', Validators.required]
    });
  }

  setupConditionalValidation(): void {
    this.acompanamientoForm.get('tipoReporte')?.valueChanges.subscribe(tipo => {
      const fields = [
        'remitentePrimerNombre', 'remitentePrimerApellido', 
        'tipoSolicitud', 'cargo', 'campus', 'dependencia'
      ];
      
      fields.forEach(f => {
        const control = this.acompanamientoForm.get(f);
        if (tipo === 'indirecta') {
          control?.setValidators([Validators.required]);
        } else {
          control?.clearValidators();
          control?.reset();
        }
        control?.updateValueAndValidity();
      });
    });
  }

  enviarSolicitud(): void {
    if (this.acompanamientoForm.valid) {
      const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
      this.dialog.open(DialogoExitoComponent, {
        width: '400px',
        data: {
          titulo: '¡Acompañamiento Registrado!',
          mensaje: 'Tu solicitud ha sido recibida correctamente.',
          codigo: `ACO-${numeroAleatorio}`
        }
      });
      this.acompanamientoForm.reset({ fechaSolicitud: new Date() });
    } else {
      this.snackBar.open('Complete todos los campos obligatorios', 'Cerrar', { duration: 3000 });
    }
  }

  cancelar(): void {
    if (confirm('¿Desea limpiar el formulario?')) {
      this.acompanamientoForm.reset({ fechaSolicitud: new Date() });
    }
  }
}