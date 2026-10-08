import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

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
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly step1Form: FormGroup;
  readonly step2Form: FormGroup;
  readonly step3Form: FormGroup;

  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  errorMessage = '';

  constructor() {
    this.step1Form = this.fb.group({
      primerNombre: ['', [Validators.required, Validators.minLength(2)]],
      segundoNombre: [''],
      primerApellido: ['', [Validators.required, Validators.minLength(2)]],
      segundoApellido: [''],
      tipoDocumento: ['', [Validators.required]],
      documento: ['', [Validators.required, Validators.pattern('^[0-9A-Za-z]+$')]]
    });

    this.step2Form = this.fb.group({
      relacionUniversidad: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern('^[0-9]*$')]]
    });

    this.step3Form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
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
    if (this.step1Form.invalid || this.step2Form.invalid || this.step3Form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    // Recopilar información de todos los pasos
    const formData = {
      ...this.step1Form.value,
      ...this.step2Form.value,
      ...this.step3Form.value
    };

    // Remover la confirmación de contraseña para no imprimirla si no es necesario, aunque aquí solo mostramos todo
    console.log('--- DATOS DEL REGISTRO ---');
    console.log(JSON.stringify(formData, null, 2));

    // Simular registro y redirección
    setTimeout(() => {
      this.loading = false;
      void this.router.navigate(['/login']);
    }, 2000);
  }
}
