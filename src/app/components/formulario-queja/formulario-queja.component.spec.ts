import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';

import { FormularioQuejaComponent } from './formulario-queja.component';

describe('FormularioQuejaComponent', () => {
  let component: FormularioQuejaComponent;
  let fixture: ComponentFixture<FormularioQuejaComponent>;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioQuejaComponent],
      providers: [
        provideNoopAnimations()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormularioQuejaComponent);
    component = fixture.componentInstance;
    dialog = fixture.debugElement.injector.get(MatDialog);
    spyOn(dialog, 'open').and.returnValue({} as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with victima_logueada profile by default', () => {
    expect(component.tipoUsuario).toBe('victima_logueada');
    expect(component.formPerfil.get('perfil')?.value).toBe('victima_logueada');
  });

  it('should switch to tercero_logueado and set required validations on victim fields', () => {
    component.formPerfil.get('perfil')?.setValue('tercero_logueado');
    expect(component.tipoUsuario).toBe('tercero_logueado');

    expect(component.formVictima.get('nombre')?.hasError('required')).toBeTrue();
    expect(component.formVictima.get('apellidos')?.hasError('required')).toBeTrue();
    expect(component.formVictima.get('genero')?.hasError('required')).toBeTrue();
    expect(component.formVictima.get('cargo')?.hasError('required')).toBeTrue();
  });

  it('should clear required validations when profile is victima_logueada', () => {
    component.formPerfil.get('perfil')?.setValue('tercero_logueado');
    component.formPerfil.get('perfil')?.setValue('victima_logueada');

    expect(component.formVictima.get('nombre')?.hasError('required')).toBeFalse();
  });

  it('should open success dialog when submitting complaint', () => {
    component.enviarQueja();
    expect(dialog.open).toHaveBeenCalled();
  });
});
