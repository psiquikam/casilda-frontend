import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../services/auth.service';
import type { AuthRegisterRequest } from '../../../services/auth.service';
import type { MaestroDto } from '../../../services/listas.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCheckboxModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly step1Form: FormGroup;
  readonly step2Form: FormGroup;
  readonly step3Form: FormGroup;

  vinculosUdea: MaestroDto[] = [];
  cargandoVinculos = false;
  errorVinculos = '';
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.step1Form = this.fb.group({
      primerNombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(50)]],
      segundoNombre: ['', [Validators.maxLength(50)]],
      primerApellido: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(50)]],
      segundoApellido: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(50)]],
      tipoDocumento: ['', [Validators.required]],
      documento: ['', [Validators.required, Validators.maxLength(50), Validators.pattern('^[0-9A-Za-z]+$')]]
    });

    this.step2Form = this.fb.group({
      vinculoUdeaId: [{ value: null, disabled: true }, [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.minLength(7), Validators.maxLength(15)]]
    });

    this.step3Form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', [Validators.required]],
      habeasData: [false, [Validators.requiredTrue]]
    });

    // Añadir el validador cruzado al control confirmPassword
    this.step3Form.get('confirmPassword')?.addValidators(() => {
      const pass = this.step3Form?.get('password')?.value;
      const confirm = this.step3Form?.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordMismatch: true };
    });

    // Reevaluar confirmPassword cuando password cambie
    this.step3Form.get('password')?.valueChanges.subscribe(() => {
      this.step3Form.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.cargarVinculosUdea();
  }

  cargarVinculosUdea(): void {
    this.cargandoVinculos = true;
    this.errorVinculos = '';
    this.vinculosUdea = [];
    this.step2Form.get('vinculoUdeaId')?.disable();

    this.auth.listarVinculosUdea().subscribe({
      next: (vinculos) => {
        this.vinculosUdea = vinculos
          .filter((vinculo) => Number.isInteger(vinculo.id) && vinculo.id > 0 && Boolean(vinculo.nombre?.trim()))
          .map((vinculo) => ({ ...vinculo, nombre: vinculo.nombre.trim() }));
        this.cargandoVinculos = false;

        if (this.vinculosUdea.length === 0) {
          this.errorVinculos = 'No hay vínculos institucionales disponibles. Intente cargar las opciones nuevamente.';
          return;
        }

        this.step2Form.get('vinculoUdeaId')?.enable();
      },
      error: () => {
        this.cargandoVinculos = false;
        this.errorVinculos = 'No fue posible cargar los vínculos institucionales. Verifique su conexión e intente nuevamente.';
      }
    });
  }

  get controlInvalido() {
    return (form: FormGroup, campo: string): boolean => {
      const control = form.get(campo);
      return !!control && control.invalid && (control.dirty || control.touched);
    };
  }

  alternarPassword() {
    this.hidePassword = !this.hidePassword;
  }

  alternarConfirmPassword() {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  onSubmit() {
    if (this.loading) return;

    const vinculoSeleccionado = this.step2Form.getRawValue().vinculoUdeaId;
    if (!this.vinculosUdea.some((vinculo) => vinculo.id === Number(vinculoSeleccionado))) {
      this.step2Form.get('vinculoUdeaId')?.markAsTouched();
      this.errorMessage = 'Seleccione un vínculo institucional disponible antes de crear la cuenta.';
      return;
    }

    if (this.step1Form.invalid || this.step2Form.invalid || this.step3Form.invalid) {
      this.step1Form.markAllAsTouched();
      this.step2Form.markAllAsTouched();
      this.step3Form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const identidad = this.step1Form.getRawValue();
    const contacto = this.step2Form.getRawValue();
    const seguridad = this.step3Form.getRawValue();
    const datos: AuthRegisterRequest = {
      primerNombre: identidad.primerNombre.trim(),
      segundoNombre: identidad.segundoNombre.trim() || undefined,
      primerApellido: identidad.primerApellido.trim(),
      segundoApellido: identidad.segundoApellido.trim(),
      tipoDocumento: identidad.tipoDocumento,
      documento: identidad.documento.trim(),
      vinculoUdeaId: Number(contacto.vinculoUdeaId),
      email: contacto.email.trim().toLowerCase(),
      telefono: contacto.telefono.trim(),
      password: seguridad.password,
      habeasData: true
    };

    this.auth.registrarUsuario(datos).subscribe({
      next: (respuesta) => {
        this.loading = false;
        this.successMessage = respuesta.mensaje || 'La cuenta se creó correctamente. Ya puede iniciar sesión.';
        this.step3Form.patchValue({ password: '', confirmPassword: '' });
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.mensajeErrorRegistro(error);
      }
    });
  }

  private mensajeErrorRegistro(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible crear la cuenta. Intente nuevamente.';
    }

    const cuerpo: unknown = error.error;
    if (typeof cuerpo === 'object' && cuerpo !== null) {
      const datos = cuerpo as Record<string, unknown>;
      const mensaje = datos['mensaje'] ?? datos['message'];
      if (typeof mensaje === 'string' && mensaje.trim()) return mensaje.trim();

      const errores = datos['errores'];
      if (Array.isArray(errores)) {
        const mensajes = errores
          .map((item: unknown) => {
            if (typeof item !== 'object' || item === null) return '';
            const detalle = (item as Record<string, unknown>)['mensaje'] ?? (item as Record<string, unknown>)['message'];
            return typeof detalle === 'string' ? detalle.trim() : '';
          })
          .filter(Boolean);
        if (mensajes.length > 0) return mensajes.join(' ');
      }
    }

    if (error.status === 409) return 'El correo electrónico o el documento ya están registrados.';
    if (error.status === 404) return 'No se encontró el tipo de documento o vínculo seleccionado.';
    if (error.status === 400) return 'Revise los datos ingresados y vuelva a intentarlo.';
    return 'No fue posible crear la cuenta en este momento. Intente nuevamente.';
  }
}
