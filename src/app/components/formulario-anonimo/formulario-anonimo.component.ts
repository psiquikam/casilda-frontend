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

  readonly rolesUdeaVictimario: string[] = [
    'Estudiante',
    'Docente',
    'Personal Administrativo',
    'Personal Directivo',
    'Contratista / Proveedor'
  ];

  readonly campusOptions: string[] = [
    'Campus Apartadó (Seccional Urabá)',
    'Campus Carepa (Seccional Urabá)',
    'Campus Turbo (Seccional Urabá)',
    'Campus Ciudad Universitaria (Medellín)',
    'Campus Robledo (Medellín)',
    'Campus Edificio San Ignacio (Medellín)',
    'Campus Facultad de Medicina (Área de la Salud)',
    'Campus Facultad de Enfermería (Área de la Salud)',
    'Campus Facultad de Odontología (Área de la Salud)',
    'Campus Facultad Nacional de Salud Pública (Área de la Salud)',
    'Campus El Carmen de Viboral (Seccional Oriente)',
    'Campus Caucasia (Seccional Bajo Cauca)',
    'Campus Puerto Berrío (Seccional Magdalena Medio)',
    'Campus Andes (Seccional Suroeste)',
    'Campus Yarumal (Sede Norte)',
    'Campus Santa Fe de Antioquia (Sede Occidente)',
    'Campus Sonsón (Sede Sonsón)',
    'Campus Segovia (Sede Nordeste)',
    'Campus Amalfi (Sede Nordeste)',
    'Otro campus o sede universitaria'
  ];

  readonly REGEX_NUMEROS_IDENTIFICACION = /^[0-9]{5,15}$/;
  readonly REGEX_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  readonly REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  readonly REGEX_TELEFONO = /^[0-9]{7,12}$/;

  get formVictima(): FormGroup {
    return this.formPerfil.get('victima') as FormGroup;
  }

  get tieneCorreoVictimaAfectada(): boolean {
    const perfil = this.formPerfil?.get('perfil')?.value;
    const deseaDatosVictima = this.formPerfil?.get('deseaDatosVictima')?.value;
    const correoCtrl = this.formVictima?.get('correo');
    const valor = correoCtrl?.value?.trim();

    return perfil === 'anonimo' &&
           deseaDatosVictima === 'si' &&
           !!valor &&
           !!correoCtrl?.valid;
  }

  get esVictimarioUdea(): boolean {
    const vinculo = this.formVictimario?.get('vinculoUniversidad')?.value;
    return this.rolesUdeaVictimario.includes(vinculo);
  }

  get contactoRequeridoInvalido(): boolean {
    return !!(this.formPerfil?.hasError('contactInfoRequired') && 
      this.formPerfil.get('deseaContacto')?.value === 'si');
  }

  soloNumeros(event: Event, controlName: string, parentGroup: FormGroup): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '');
    if (input.value !== limpio) {
      input.value = limpio;
    }
    parentGroup.get(controlName)?.setValue(limpio);
  }

  soloLetras(event: Event, controlName: string, parentGroup: FormGroup): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (input.value !== limpio) {
      input.value = limpio;
    }
    parentGroup.get(controlName)?.setValue(limpio);
  }

  constructor() {
    this.formConsentimiento = this.fb.group({
      aceptaPolitica: [false, Validators.requiredTrue]
    });

    this.formPerfil = this.fb.group({
      perfil: ['anonimo', Validators.required],
      deseaDatosVictima: ['no', Validators.required],
      victima: this.fb.group({
        identificacion: ['', [Validators.pattern(this.REGEX_NUMEROS_IDENTIFICACION)]],
        nombre: [''],
        apellidos: ['', [Validators.pattern(this.REGEX_LETRAS)]],
        correo: ['', [Validators.email, Validators.pattern(this.REGEX_EMAIL)]],
        genero: [''],
        cargo: ['']
      }),
      deseaContacto: ['no', Validators.required],
      correoContacto: ['', [Validators.email, Validators.pattern(this.REGEX_EMAIL)]],
      whatsappContacto: ['', [Validators.pattern(this.REGEX_TELEFONO)]]
    }, {
      validators: (group) => this.validarMedioContacto(group as FormGroup)
    });

    this.formPerfil.get('perfil')?.valueChanges.subscribe(val => {
      this.tipoUsuario = val;
      this.formPerfil.updateValueAndValidity();
    });

    this.formPerfil.get('deseaDatosVictima')?.valueChanges.subscribe(val => {
      const nombreCtrl = this.formVictima.get('nombre');
      const cargoCtrl = this.formVictima.get('cargo');
      if (val === 'si') {
        nombreCtrl?.setValidators([
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(60),
          Validators.pattern(this.REGEX_LETRAS)
        ]);
        cargoCtrl?.setValidators([Validators.required]);
        const correoVictima = this.formVictima.get('correo')?.value;
        const correoVictimaValido = this.formVictima.get('correo')?.valid;
        if (correoVictima && correoVictimaValido && this.formPerfil.get('perfil')?.value === 'anonimo') {
          this.formPerfil.get('correoContacto')?.setValue(correoVictima, { emitEvent: false });
        }
      } else {
        nombreCtrl?.clearValidators();
        cargoCtrl?.clearValidators();
      }
      nombreCtrl?.updateValueAndValidity();
      cargoCtrl?.updateValueAndValidity();
      this.formPerfil.updateValueAndValidity();
    });

    this.formVictima.get('correo')?.valueChanges.subscribe(val => {
      if (this.formPerfil.get('perfil')?.value === 'anonimo') {
        const correoValido = this.formVictima.get('correo')?.valid;
        if (val && correoValido) {
          this.formPerfil.get('correoContacto')?.setValue(val, { emitEvent: false });
        } else if (!val) {
          this.formPerfil.get('correoContacto')?.setValue('', { emitEvent: false });
        }
        this.formPerfil.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.formPerfil.get('deseaContacto')?.valueChanges.subscribe(val => {
      if (val === 'no') {
        this.formPerfil.get('correoContacto')?.setValue('', { emitEvent: false });
        this.formPerfil.get('whatsappContacto')?.setValue('', { emitEvent: false });
      } else if (val === 'si') {
        const correoVictima = this.formVictima.get('correo')?.value;
        const correoVictimaValido = this.formVictima.get('correo')?.valid;
        if (correoVictima && correoVictimaValido && this.formPerfil.get('perfil')?.value === 'anonimo') {
          this.formPerfil.get('correoContacto')?.setValue(correoVictima, { emitEvent: false });
        }
      }
      this.formPerfil.updateValueAndValidity();
    });

    this.formRelato = this.fb.group({
      tipoLugar: ['interno', Validators.required],
      sedeCampus: ['', Validators.required],
      facultad: [''],
      bloque: [''],
      espacio: [''],
      lugarDetalleExterno: [''],
      fecha: ['', Validators.required],
      hora: [''],
      tipoVbg: [[], Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(20)]]
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
      identificacion: ['', [Validators.pattern(this.REGEX_NUMEROS_IDENTIFICACION)]],
      nombre: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      apellidos: ['', [Validators.pattern(this.REGEX_LETRAS)]],
      vinculoUniversidad: [''],
      remitirUad: ['no'],
      correo: ['']
    });

    this.formVictimario.get('vinculoUniversidad')?.valueChanges.subscribe(val => {
      if (!this.rolesUdeaVictimario.includes(val)) {
        this.formVictimario.get('remitirUad')?.setValue('no');
      }
    });

    this.formEvidencias = this.fb.group({
      archivos: [null]
    });
  }

  private validarMedioContacto(group: FormGroup): { [key: string]: any } | null {
    const deseaContacto = group.get('deseaContacto')?.value;
    if (deseaContacto === 'si') {
      const perfil = group.get('perfil')?.value;
      const deseaDatosVictima = group.get('deseaDatosVictima')?.value;
      const correoVictimaCtrl = group.get('victima.correo');
      const correoVictimaValido = (perfil === 'anonimo' && deseaDatosVictima === 'si' && correoVictimaCtrl?.valid)
        ? correoVictimaCtrl?.value?.trim()
        : '';
      
      const correoContactoCtrl = group.get('correoContacto');
      const correoContactoValido = (correoContactoCtrl?.valid && correoContactoCtrl?.value?.trim()) ? correoContactoCtrl.value.trim() : '';

      const correo = correoContactoValido || correoVictimaValido;

      const whatsappCtrl = group.get('whatsappContacto');
      const whatsappValido = (whatsappCtrl?.valid && whatsappCtrl?.value?.trim()) ? whatsappCtrl.value.trim() : '';

      if (!correo && !whatsappValido) {
        return { contactInfoRequired: true };
      }
    }
    return null;
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
