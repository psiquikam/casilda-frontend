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
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
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
    }, { validators: this.passwordsMatchValidator });
  }

  private passwordsMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
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
    
    // Simular registro y redirección
    setTimeout(() => {
      this.loading = false;
      void this.router.navigate(['/login']);
    }, 2000);
  }
}
