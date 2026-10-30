import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['listarVinculosUdea', 'registrarUsuario']);
    auth.listarVinculosUdea.and.returnValue(of([
      { id: 8, codigo: 'EST', nombre: 'Estudiante' },
      { id: 12, codigo: 'DOC', nombre: 'Docente' }
    ]));
    auth.registrarUsuario.and.returnValue(of({
      mensaje: 'Usuario creado exitosamente.',
      usuarioId: 23,
      email: 'persona@udea.edu.co'
    }));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the UdeA links from the service', () => {
    expect(component).toBeTruthy();
    expect(auth.listarVinculosUdea).toHaveBeenCalled();
    expect(component.vinculosUdea.map(({ id }) => id)).toEqual([8, 12]);
    expect(component.step2Form.get('vinculoUdeaId')?.enabled).toBeTrue();
  });

  it('allows the second surname to be empty and validates it when provided', () => {
    const segundoApellido = component.step1Form.get('segundoApellido');
    expect(segundoApellido?.valid).toBeTrue();

    segundoApellido?.setValue('A');
    expect(segundoApellido?.hasError('minlength')).toBeTrue();

    segundoApellido?.setValue('Lo');
    expect(segundoApellido?.valid).toBeTrue();

    segundoApellido?.setValue('A'.repeat(51));
    expect(segundoApellido?.hasError('maxlength')).toBeTrue();
  });

  it('sends the API payload without confirmation password and shows success', () => {
    component.step1Form.setValue({
      primerNombre: ' Ana ',
      segundoNombre: '',
      primerApellido: ' Pérez ',
      segundoApellido: ' Gómez ',
      tipoDocumento: 'CC',
      documento: '123ABC'
    });
    component.step2Form.setValue({
      vinculoUdeaId: 8,
      email: 'PERSONA@UDEA.EDU.CO',
      telefono: '3001234567'
    });
    component.step3Form.setValue({
      password: 'ClaveSegura123',
      confirmPassword: 'ClaveSegura123',
      habeasData: true
    });

    component.onSubmit();

    expect(auth.registrarUsuario).toHaveBeenCalledOnceWith({
      primerNombre: 'Ana',
      segundoNombre: undefined,
      primerApellido: 'Pérez',
      segundoApellido: 'Gómez',
      tipoDocumento: 'CC',
      documento: '123ABC',
      vinculoUdeaId: 8,
      email: 'persona@udea.edu.co',
      telefono: '3001234567',
      password: 'ClaveSegura123',
      habeasData: true
    });
    expect(component.successMessage).toBe('Usuario creado exitosamente.');
    expect(component.loading).toBeFalse();
    expect(component.step3Form.get('confirmPassword')?.value).toBe('');
  });

  it('omits the second surname from the API payload when left blank', () => {
    component.step1Form.setValue({
      primerNombre: 'Ana',
      segundoNombre: '',
      primerApellido: 'Pérez',
      segundoApellido: '',
      tipoDocumento: 'CC',
      documento: '123ABC'
    });
    component.step2Form.setValue({
      vinculoUdeaId: 8,
      email: 'ana@udea.edu.co',
      telefono: '3001234567'
    });
    component.step3Form.setValue({
      password: 'ClaveSegura123',
      confirmPassword: 'ClaveSegura123',
      habeasData: true
    });

    component.onSubmit();

    const payload = auth.registrarUsuario.calls.mostRecent().args[0];
    expect('segundoApellido' in payload).toBeFalse();
    expect(payload.primerApellido).toBe('Pérez');
  });

  it('shows backend validation errors and unlocks the form to retry', () => {
    auth.registrarUsuario.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { mensaje: 'El correo ya está registrado.' }
    })));
    component.step1Form.setValue({
      primerNombre: 'Ana',
      segundoNombre: '',
      primerApellido: 'Pérez',
      segundoApellido: 'Gómez',
      tipoDocumento: 'CC',
      documento: '123ABC'
    });
    component.step2Form.setValue({
      vinculoUdeaId: 8,
      email: 'persona@udea.edu.co',
      telefono: '3001234567'
    });
    component.step3Form.setValue({
      password: 'ClaveSegura123',
      confirmPassword: 'ClaveSegura123',
      habeasData: true
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('El correo ya está registrado.');
    expect(component.loading).toBeFalse();
  });

  it('shows an actionable error when loading the links fails', () => {
    auth.listarVinculosUdea.and.returnValue(throwError(() => new Error('offline')));

    component.cargarVinculosUdea();

    expect(component.errorVinculos).toContain('No fue posible cargar');
    expect(component.step2Form.get('vinculoUdeaId')?.disabled).toBeTrue();
  });
});
