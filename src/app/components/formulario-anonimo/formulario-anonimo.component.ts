import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
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
import Swal from 'sweetalert2';

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

  readonly listaPsicologica: MaestroDto[] = [
    { id: 1, nombre: 'Abuso de poder y/o confianza' },
    { id: 2, nombre: 'Aislamiento forzado' },
    { id: 3, nombre: 'Constreñimiento ilegal' },
    { id: 4, nombre: 'Difusión de contenido íntimo' },
    { id: 5, nombre: 'Injurias por vías de hecho o calumnia' },
    { id: 6, nombre: 'Intimidación y amenazas' },
    { id: 7, nombre: 'Lenguaje misógino, sexista o discursos de odio' }
  ];

  readonly listaFisica: MaestroDto[] = [
    { id: 1, nombre: 'Feminicidio (Tentativa o comisión)' },
    { id: 2, nombre: 'Lesiones personales' },
    { id: 3, nombre: 'Violencia de pareja/expareja' },
    { id: 4, nombre: 'Violencia interpersonal' },
    { id: 5, nombre: 'Violencia intrafamiliar' }
  ];

  readonly listaSexual: MaestroDto[] = [
    { id: 1, nombre: 'Acceso carnal' },
    { id: 2, nombre: 'Acoso sexual' },
    { id: 3, nombre: 'Actos sexuales' },
    { id: 4, nombre: 'Violencia sexual correctiva' }
  ];

  readonly listaInstitucional: MaestroDto[] = [
    { id: 1, nombre: 'Omisión al deber de debida diligencia' },
    { id: 2, nombre: 'Omision del deber de denuncia' },
    { id: 3, nombre: 'Revictimización' }
  ];

  readonly listaPatrimonial: MaestroDto[] = [
    { id: 1, nombre: 'Control económico' },
    { id: 2, nombre: 'Daño en bien ajeno' },
    { id: 3, nombre: 'Hurto' },
    { id: 4, nombre: 'Inasistencia alimentaria' }
  ];

  readonly listaInformatica: MaestroDto[] = [
    { id: 1, nombre: 'Chantaje sexual o extorsión sexual' },
    { id: 2, nombre: 'Grooming' },
    { id: 3, nombre: 'Pornografía' },
    { id: 4, nombre: 'Sexting' },
    { id: 5, nombre: 'Violación de datos personales' }
  ];

  readonly listaPrejuicio: MaestroDto[] = [
    { id: 1, nombre: 'Discriminación por género u orientación sexual o identidad de género' }
  ];

  psicologicaSel: number[] = [];
  fisicaSel: number[] = [];
  sexualSel: number[] = [];
  institucionalSel: number[] = [];
  economicaSel: number[] = [];
  informaticaSel: number[] = [];
  prejuicioSel: number[] = [];

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
      violenciaPsicologica: ['NO'],
      violenciaFisica: ['NO'],
      violenciaSexual: ['NO'],
      violenciaInstitucional: ['NO'],
      violenciaEconomica: ['NO'],
      violenciaInformatica: ['NO'],
      violenciaPrejuicio: ['NO'],
      tipoVbg: [[], Validators.required],
      descripcion: ['', [this.validarDescripcionOpcional]]
    });

    this.configurarSincronizacionViolencia();

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

  get tieneViolenciaSeleccionada(): boolean {
    const hayChips = this.psicologicaSel.length > 0 ||
                     this.fisicaSel.length > 0 ||
                     this.sexualSel.length > 0 ||
                     this.institucionalSel.length > 0 ||
                     this.economicaSel.length > 0 ||
                     this.informaticaSel.length > 0 ||
                     this.prejuicioSel.length > 0;

    const tipos = [
      'violenciaPsicologica',
      'violenciaFisica',
      'violenciaSexual',
      'violenciaInstitucional',
      'violenciaEconomica',
      'violenciaInformatica',
      'violenciaPrejuicio'
    ];
    return hayChips || tipos.some(t => this.formRelato?.get(t)?.value === 'SI') || 
           ((this.formRelato?.get('tipoVbg')?.value?.length ?? 0) > 0);
  }

  get mostrarErrorTipoVbg(): boolean {
    const ctrl = this.formRelato?.get('tipoVbg');
    const fueTocado = !!(ctrl?.touched || ctrl?.dirty || this.formRelato?.touched);
    return !this.tieneViolenciaSeleccionada && fueTocado;
  }

  avanzarPasoRelato(stepper: MatStepper): void {
    this.formRelato.markAllAsTouched();
    const tieneVbg = this.tieneViolenciaSeleccionada;
    const tipoVbgCtrl = this.formRelato.get('tipoVbg');

    if (!tieneVbg) {
      tipoVbgCtrl?.setErrors({ required: true });
      tipoVbgCtrl?.markAsTouched();
    }

    if (this.formRelato.valid && tieneVbg) {
      stepper.next();
    } else if (typeof window !== 'undefined' && window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  }

  private validarDescripcionOpcional = (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val || typeof val !== 'string' || val.trim().length === 0) {
      return null;
    }
    return val.trim().length >= 20
      ? null
      : { minlength: { requiredLength: 20, actualLength: val.trim().length } };
  };

  isModalidadSeleccionada(id: number, arrayName: string): boolean {
    const lista = (this as any)[arrayName] as number[];
    return Array.isArray(lista) && lista.includes(id);
  }

  toggleModalidad(id: number, arrayName: string): void {
    const lista = (this as any)[arrayName] as number[];
    if (!Array.isArray(lista)) return;
    const idx = lista.indexOf(id);
    if (idx >= 0) {
      lista.splice(idx, 1);
    } else {
      lista.push(id);
    }
    this.actualizarEstadosViolenciaDesdeChips();
  }

  onCheckboxChange(event: any, valor: number, arrayName: string): void {
    const lista = (this as any)[arrayName] as number[];
    if (!Array.isArray(lista)) return;
    if (event.checked) {
      if (!lista.includes(valor)) {
        lista.push(valor);
      }
    } else {
      const idx = lista.indexOf(valor);
      if (idx >= 0) lista.splice(idx, 1);
    }
    this.actualizarEstadosViolenciaDesdeChips();
  }

  guardarBorrador(): void {
    try {
      const borrador = {
        perfil: this.formPerfil.value,
        relato: this.formRelato.value,
        victimario: this.formVictimario.value,
        psicologicaSel: this.psicologicaSel,
        fisicaSel: this.fisicaSel,
        sexualSel: this.sexualSel,
        institucionalSel: this.institucionalSel,
        economicaSel: this.economicaSel,
        informaticaSel: this.informaticaSel,
        prejuicioSel: this.prejuicioSel,
        guardadoEl: new Date().toISOString()
      };
      localStorage.setItem('casilda_borrador_anonimo', JSON.stringify(borrador));
      Swal.fire({
        icon: 'success',
        title: 'Borrador guardado',
        text: 'Tu avance ha sido guardado de forma segura en este navegador.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch {
      // Manejo preventivo si localStorage no estuviese accesible
    }
  }

  private configurarSincronizacionViolencia(): void {
    const mapeo = [
      { control: 'violenciaPsicologica', sel: 'psicologicaSel', label: 'Violencia Psicológica' },
      { control: 'violenciaFisica', sel: 'fisicaSel', label: 'Violencia Física' },
      { control: 'violenciaSexual', sel: 'sexualSel', label: 'Violencia Sexual' },
      { control: 'violenciaInstitucional', sel: 'institucionalSel', label: 'Violencia Institucional' },
      { control: 'violenciaEconomica', sel: 'economicaSel', label: 'Violencia Económica o Patrimonial' },
      { control: 'violenciaInformatica', sel: 'informaticaSel', label: 'Violencia Digital / Informática' },
      { control: 'violenciaPrejuicio', sel: 'prejuicioSel', label: 'Discriminación o Violencia por Prejuicio' },
    ];

    mapeo.forEach(m => {
      this.formRelato.get(m.control)?.valueChanges.subscribe(val => {
        if (val !== 'SI') {
          (this as any)[m.sel] = [];
        }
        this.actualizarTipoVbgDesdeRadios();
      });
    });

    this.formRelato.get('tipoVbg')?.valueChanges.subscribe(val => {
      if (Array.isArray(val)) {
        this.sincronizarRadiosDesdeTipoVbg(val);
      }
    });
  }

  private actualizarEstadosViolenciaDesdeChips(): void {
    const categorias = [
      { control: 'violenciaPsicologica', sel: this.psicologicaSel, label: 'Violencia Psicológica' },
      { control: 'violenciaFisica', sel: this.fisicaSel, label: 'Violencia Física' },
      { control: 'violenciaSexual', sel: this.sexualSel, label: 'Violencia Sexual' },
      { control: 'violenciaInstitucional', sel: this.institucionalSel, label: 'Violencia Institucional' },
      { control: 'violenciaEconomica', sel: this.economicaSel, label: 'Violencia Económica o Patrimonial' },
      { control: 'violenciaInformatica', sel: this.informaticaSel, label: 'Violencia Digital / Informática' },
      { control: 'violenciaPrejuicio', sel: this.prejuicioSel, label: 'Discriminación o Violencia por Prejuicio' },
    ];

    const tiposActivos: string[] = [];
    categorias.forEach(cat => {
      const tieneItems = cat.sel.length > 0;
      this.formRelato.get(cat.control)?.setValue(tieneItems ? 'SI' : 'NO', { emitEvent: false });
      if (tieneItems) {
        tiposActivos.push(cat.label);
      }
    });

    const tipoVbgCtrl = this.formRelato.get('tipoVbg');
    if (tipoVbgCtrl) {
      tipoVbgCtrl.setValue(tiposActivos, { emitEvent: false });
      if (tiposActivos.length > 0) {
        tipoVbgCtrl.setErrors(null);
      } else {
        tipoVbgCtrl.setErrors({ required: true });
      }
      tipoVbgCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private actualizarTipoVbgDesdeRadios(): void {
    const tiposActivos: string[] = [];
    if (this.formRelato.get('violenciaPsicologica')?.value === 'SI') tiposActivos.push('Violencia Psicológica');
    if (this.formRelato.get('violenciaFisica')?.value === 'SI') tiposActivos.push('Violencia Física');
    if (this.formRelato.get('violenciaSexual')?.value === 'SI') tiposActivos.push('Violencia Sexual');
    if (this.formRelato.get('violenciaInstitucional')?.value === 'SI') tiposActivos.push('Violencia Institucional');
    if (this.formRelato.get('violenciaEconomica')?.value === 'SI') tiposActivos.push('Violencia Económica o Patrimonial');
    if (this.formRelato.get('violenciaInformatica')?.value === 'SI') tiposActivos.push('Violencia Digital / Informática');
    if (this.formRelato.get('violenciaPrejuicio')?.value === 'SI') tiposActivos.push('Discriminación o Violencia por Prejuicio');

    const control = this.formRelato.get('tipoVbg');
    if (control) {
      control.setValue(tiposActivos, { emitEvent: false });
      if (tiposActivos.length > 0) {
        control.setErrors(null);
      } else {
        control.setErrors({ required: true });
      }
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private sincronizarRadiosDesdeTipoVbg(val: string[]): void {
    const mapa = [
      { control: 'violenciaPsicologica', label: 'Violencia Psicológica' },
      { control: 'violenciaFisica', label: 'Violencia Física' },
      { control: 'violenciaSexual', label: 'Violencia Sexual' },
      { control: 'violenciaInstitucional', label: 'Violencia Institucional' },
      { control: 'violenciaEconomica', label: 'Violencia Económica o Patrimonial' },
      { control: 'violenciaInformatica', label: 'Violencia Digital / Informática' },
      { control: 'violenciaPrejuicio', label: 'Discriminación o Violencia por Prejuicio' },
    ];

    mapa.forEach(m => {
      const ctrl = this.formRelato.get(m.control);
      const debeSerSi = val.includes(m.label);
      if (debeSerSi && ctrl?.value !== 'SI') {
        ctrl?.setValue('SI', { emitEvent: false });
      } else if (!debeSerSi && ctrl?.value === 'SI') {
        ctrl?.setValue('NO', { emitEvent: false });
      }
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
