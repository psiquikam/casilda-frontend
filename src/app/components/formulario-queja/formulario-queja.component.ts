import { Component } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogoExitoComponent } from '../dialog-exito/dialog-exito.component';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-formulario-queja',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatCheckboxModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule
  ],
  templateUrl: './formulario-queja.component.html',
  styleUrls: ['./formulario-queja.component.scss']
})
export class FormularioQuejaComponent {

  tipoUsuario: 'victima_logueada' | 'tercero_logueado' = 'victima_logueada';
  formPerfil: FormGroup;
  formConsentimiento: FormGroup;
  formRelato: FormGroup;
  formVictima: FormGroup;
  formVictimario: FormGroup;
  formEvidencias: FormGroup;

  constructor(private fb: FormBuilder, private dialog: MatDialog) {
    this.formPerfil = this.fb.group({
      perfil: ['victima_logueada', Validators.required]
    });

    this.formPerfil.get('perfil')?.valueChanges.subscribe(val => {
      this.tipoUsuario = val;
      this.ajustarValidaciones(val);
    });

    this.formConsentimiento = this.fb.group({
      aceptaPolitica: [false, Validators.requiredTrue]
    });

    this.formRelato = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      nombreDeOtro: ['no'],
      deseaContacto: ['no'],
      correoContacto: [''],
      whatsappContacto: ['']
    });

    this.formVictima = this.fb.group({
      identificacion: [''],
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.email]],
      genero: ['', Validators.required],
      cargo: ['', Validators.required],
    });

    this.formVictimario = this.fb.group({
      identificacion: [''],
      nombre: [''],
      apellidos: [''],
      correo: ['']
    });

    this.formEvidencias = this.fb.group({
      archivos: [null]
    });

    this.ajustarValidaciones('victima_logueada');
  }

  enviarQueja() {
    const codigoGenerado = 'CAS-' + Math.floor(1000 + Math.random() * 9000);

    this.dialog.open(DialogoExitoComponent, {
      data: {
        titulo: '¡Queja Registrada!',
        mensaje: 'Tu queja ha sido recibida. Un profesional se pondrá en contacto contigo pronto.',
        codigo: codigoGenerado
      },
      width: '450px',
      disableClose: true
    });
  }

  ajustarValidaciones(perfil: string) {
    const campos = ['nombre', 'apellidos', 'genero', 'cargo'];

    campos.forEach(nombreCampo => {
      const control = this.formVictima.get(nombreCampo);

      if (perfil === 'victima_logueada') {
        control?.clearValidators();
      } else if (perfil === 'tercero_logueado') {
        control?.setValidators([Validators.required]);
      }
      control?.updateValueAndValidity();
    });
  }
}