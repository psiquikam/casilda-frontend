import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../services/auth.service';

/**
 * Ingreso al sistema. La pantalla se mantiene en una sola
 * columna de formulario, acompañada de un panel institucional informativo,
 * para reducir la carga cognitiva en momentos de estrés.
 */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm: FormGroup;
  readonly correoSoporte = 'proyectocasilda@udea.edu.co';

  hidePassword = true;
  errorMessage = '';
  loading = false;

  constructor() {
    if (this.auth.isAuthenticated()) {
      void this.router.navigate([this.auth.getDefaultRoute()]);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get emailInvalido(): boolean {
    const control = this.loginForm.get('email');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get passwordInvalido(): boolean {
    const control = this.loginForm.get('password');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  alternarPassword(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    this.auth.loginWithCredentials(email, password).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate([this.auth.getDefaultRoute()]);
      },
      error: () => {
        this.loading = false;
        this.errorMessage =
          'No pudimos validar esos datos. Revisa tu correo electrónico y tu contraseña, e inténtalo de nuevo.';
      }
    });
  }
}
