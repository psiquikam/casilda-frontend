import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DialogoExitoComponent } from '../dialog-exito/dialog-exito.component';

import { ListasService } from '../../services/listas.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-formulario-acompanamiento',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatSnackBarModule
  ],
  templateUrl: './formulario-acompanamiento.component.html',
  styleUrls: ['./formulario-acompanamiento.component.scss']
})
export class FormularioAcompanamientoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private listasService = inject(ListasService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog)

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
    this.acompanamientoForm = this.fb.group({
      tipoSolicitud: ['', Validators.required],
      campus: ['', Validators.required],
      dependencia: ['', Validators.required],
      facultad: ['', Validators.required],
      tipoDocumento: ['', Validators.required],

      primerNombre: ['', [Validators.required, Validators.minLength(2)]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required, Validators.minLength(2)]],
      segundoApellido: [''],
      cargo: ['', Validators.required],
      fechaSolicitud: [new Date(), Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      identidadGenero: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      telefonoAlterno: [''],
      correoInstitucional: ['', [Validators.required, Validators.email]],
      correoPersonal: ['', [Validators.required, Validators.email]]
    });
  }

  enviarSolicitud() {
    if (this.acompanamientoForm.valid) {
      const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
      const nuevoCodigo = `ACO-${numeroAleatorio}`;

      this.dialog.open(DialogoExitoComponent, {
        width: '400px',
        data: {
          titulo: '¡Acompañamiento Registrado!',
          mensaje: 'Tu solicitud de acompañamiento ha sido recibida. Un profesional se pondrá en contacto contigo pronto.',
          codigo: nuevoCodigo
        }
      });

      this.acompanamientoForm.reset({ fechaSolicitud: new Date() });
    }
  }
}