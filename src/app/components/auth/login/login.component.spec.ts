import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatIconTestingModule } from '@angular/material/icon/testing';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, MatIconTestingModule],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe asociar cada campo con su etiqueta y su autocompletado', () => {
    const email: HTMLInputElement = fixture.nativeElement.querySelector('input[formcontrolname="email"]');
    const password: HTMLInputElement = fixture.nativeElement.querySelector('input[formcontrolname="password"]');

    expect(email.getAttribute('autocomplete')).toBe('username');
    expect(password.getAttribute('autocomplete')).toBe('current-password');
    expect(email.id).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`label[for="${email.id}"]`)).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`label[for="${password.id}"]`)).toBeTruthy();
  });

  it('debe describir el botón de visibilidad de la contraseña para lectores de pantalla', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('button[mat-icon-button]');

    expect(toggle.getAttribute('aria-label')).toBe('Mostrar la contraseña');

    component.alternarPassword();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-label')).toBe('Ocultar la contraseña');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('debe anunciar el estado de verificación en una región aria-live', () => {
    const estado: HTMLElement = fixture.nativeElement.querySelector('.login__estado');

    expect(estado.getAttribute('aria-live')).toBe('polite');
    expect(estado.getAttribute('role')).toBe('status');
  });

  it('debe permitir regresar al inicio desde el login', () => {
    const volver: HTMLAnchorElement = fixture.nativeElement.querySelector('.login__volver');

    expect(volver).toBeTruthy();
    expect(volver.getAttribute('href')).toBe('/home');
    expect(volver.textContent).toContain('Volver al inicio');
  });

  it('no debe ofrecer acceso público a la consulta de casos', () => {
    const enlaces: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));

    expect(enlaces.some((a) => a.getAttribute('href')?.includes('seguimiento'))).toBeFalse();
  });

  it('no debe enviar el formulario cuando los datos son inválidos', () => {
    component.onSubmit();

    expect(component.loading).toBeFalse();
    expect(component.loginForm.touched).toBeTrue();
  });
});
