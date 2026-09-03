import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { DialogoExitoComponent } from '../dialog-exito/dialog-exito.component';
import { MaestroDto } from '../../services/listas.service';

@Component({
  selector: 'app-formulario-anonimo',
  standalone: true,
  imports: [
    CommonModule,
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
  templateUrl: './formulario-anonimo.component.html',
  styleUrls: ['./formulario-anonimo.component.scss']
})
export class FormularioAnonimoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  tipoUsuario: 'anonimo' | 'anonimo_tercero' = 'anonimo';
  formConsentimiento: FormGroup;
  formPerfil: FormGroup;
  formRelato: FormGroup;
  formVictimario: FormGroup;
  formEvidencias: FormGroup;

  readonly tiposVbg: MaestroDto[] = [
    { id: 1, nombre: 'Violencia Psicológica' },
    { id: 2, nombre: 'Violencia Física' },
    { id: 3, nombre: 'Violencia Sexual' },
    { id: 4, nombre: 'Violencia Institucional' },
    { id: 5, nombre: 'Violencia Económica o Patrimonial' },
    { id: 6, nombre: 'Violencia Digital / Informática' },
    { id: 7, nombre: 'Discriminación o Violencia por Prejuicio' },
    { id: 8, nombre: 'Otro tipo de violencia' }
  ];

  get formVictima(): FormGroup {
    return this.formPerfil.get('victima') as FormGroup;
  }

  constructor() {
    this.formConsentimiento = this.fb.group({
      aceptaPolitica: [false, Validators.requiredTrue]
    });

    this.formPerfil = this.fb.group({
      perfil: ['anonimo', Validators.required],
      deseaDatosVictima: ['no', Validators.required],
      victima: this.fb.group({
        identificacion: [''],
        nombre: [''],
        apellidos: [''],
        correo: ['', [Validators.email]],
        genero: [''],
        cargo: ['']
      })
    });

    this.formPerfil.get('perfil')?.valueChanges.subscribe(val => {
      this.tipoUsuario = val;
    });

    this.formPerfil.get('deseaDatosVictima')?.valueChanges.subscribe(val => {
      const nombreCtrl = this.formVictima.get('nombre');
      if (val === 'si') {
        nombreCtrl?.setValidators([Validators.required]);
      } else {
        nombreCtrl?.clearValidators();
      }
      nombreCtrl?.updateValueAndValidity();
      this.formPerfil.updateValueAndValidity();
    });

    this.formRelato = this.fb.group({
      tipoLugar: ['interno', Validators.required],
      sedeCampus: ['', Validators.required],
      facultadBloqueLugar: [''],
      lugarDetalleExterno: [''],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      tipoVbg: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      deseaContacto: ['no'],
      correoContacto: [''],
      whatsappContacto: ['']
    });

    this.formRelato.get('tipoLugar')?.valueChanges.subscribe(tipo => {
      const sedeCtrl = this.formRelato.get('sedeCampus');
      const extCtrl = this.formRelato.get('lugarDetalleExterno');
      if (tipo === 'interno') {
        sedeCtrl?.setValidators([Validators.required]);
        extCtrl?.clearValidators();
      } else {
        sedeCtrl?.clearValidators();
        extCtrl?.setValidators([Validators.required]);
      }
      sedeCtrl?.updateValueAndValidity();
      extCtrl?.updateValueAndValidity();
      this.formRelato.updateValueAndValidity();
    });

    this.formVictimario = this.fb.group({
      identificacion: [''],
      nombre: [''],
      apellidos: [''],
      vinculoUniversidad: [''],
      correo: ['']
    });

    this.formEvidencias = this.fb.group({
      archivos: [null]
    });
  }

  setFechaRapida(valor: string): void {
    if (valor === 'Hoy') {
      const d = new Date();
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      this.formRelato.get('fecha')?.setValue(`${dia}/${mes}/${anio}`);
    } else {
      this.formRelato.get('fecha')?.setValue(valor);
    }
    this.formRelato.get('fecha')?.markAsDirty();
  }

  setHoraRapida(valor: string): void {
    this.formRelato.get('hora')?.setValue(valor);
    this.formRelato.get('hora')?.markAsDirty();
  }

  enviarReporte(): void {
    const codigoGenerado = 'CAS-' + Math.floor(1000 + Math.random() * 9000);

    this.dialog.open(DialogoExitoComponent, {
      data: {
        titulo: '¡Reporte Anónimo Registrado!',
        mensaje: 'Tu reporte anónimo ha sido recibido con éxito. Un profesional especializado revisará la información de forma confidencial.',
        codigo: codigoGenerado,
        labelCodigo: 'ID ÚNICO DE REPORTE ANÓNIMO',
        instruccion: 'Guarda este ID. Si en algún momento deseas activar una ruta de atención o acompañamiento institucional, inicia sesión en la plataforma e ingresa este ID para vincular tu caso.'
      },
      width: '480px',
      disableClose: true
    });
  }

  enviarQueja(): void {
    this.enviarReporte();
  }
}
