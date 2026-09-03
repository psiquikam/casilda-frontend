import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';

import { FormularioAnonimoComponent } from './formulario-anonimo.component';

describe('FormularioAnonimoComponent', () => {
  let component: FormularioAnonimoComponent;
  let fixture: ComponentFixture<FormularioAnonimoComponent>;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioAnonimoComponent],
      providers: [
        provideNoopAnimations()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioAnonimoComponent);
    component = fixture.componentInstance;
    dialog = fixture.debugElement.injector.get(MatDialog);
    spyOn(dialog, 'open').and.returnValue({} as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require consent in formConsentimiento (Paso 1: Privacidad)', () => {
    expect(component.formConsentimiento.valid).toBeFalse();
    component.formConsentimiento.get('aceptaPolitica')?.setValue(true);
    expect(component.formConsentimiento.valid).toBeTrue();
  });

  it('should initialize with anonimo profile and without victim data by default (Paso 2: Identificación)', () => {
    expect(component.tipoUsuario).toBe('anonimo');
    expect(component.formPerfil.get('perfil')?.value).toBe('anonimo');
    expect(component.formPerfil.get('deseaDatosVictima')?.value).toBe('no');
    expect(component.formPerfil.valid).toBeTrue();
  });

  it('should conditionally require victim name when deseaDatosVictima is si', () => {
    component.formPerfil.get('deseaDatosVictima')?.setValue('si');
    expect(component.formPerfil.valid).toBeFalse();
    expect(component.formVictima.get('nombre')?.hasError('required')).toBeTrue();

    component.formVictima.get('nombre')?.setValue('Persona Afectada');
    expect(component.formPerfil.valid).toBeTrue();

    component.formPerfil.get('deseaDatosVictima')?.setValue('no');
    expect(component.formVictima.get('nombre')?.hasError('required')).toBeFalse();
    expect(component.formPerfil.valid).toBeTrue();
  });

  it('should toggle location validation between interno and externo in formRelato (Paso 3: El Caso)', () => {
    expect(component.formRelato.get('tipoLugar')?.value).toBe('interno');
    expect(component.formRelato.get('sedeCampus')?.hasError('required')).toBeTrue();
    expect(component.formRelato.get('lugarDetalleExterno')?.hasError('required')).toBeFalse();

    component.formRelato.get('tipoLugar')?.setValue('externo');
    expect(component.formRelato.get('sedeCampus')?.hasError('required')).toBeFalse();
    expect(component.formRelato.get('lugarDetalleExterno')?.hasError('required')).toBeTrue();

    component.formRelato.get('lugarDetalleExterno')?.setValue('Entorno virtual');
    expect(component.formRelato.get('lugarDetalleExterno')?.valid).toBeTrue();
  });

  it('should update fecha and hora using quick helpers', () => {
    component.setFechaRapida('Hoy');
    expect(component.formRelato.get('fecha')?.value).toMatch(/\d{2}\/\d{2}\/\d{4}/);

    component.setFechaRapida('Se desconoce');
    expect(component.formRelato.get('fecha')?.value).toBe('Se desconoce');

    component.setHoraRapida('En la tarde');
    expect(component.formRelato.get('hora')?.value).toBe('En la tarde');
  });

  it('should validate complete case form including separate fecha, hora, tipoVbg and descripcion', () => {
    component.formRelato.patchValue({
      tipoLugar: 'interno',
      sedeCampus: 'Ciudad Universitaria - Medellín',
      facultadBloqueLugar: 'Bloque 12',
      fecha: '15/08/2026',
      hora: '14:30',
      tipoVbg: 'Violencia Psicológica',
      descripcion: 'Esta es una descripción detallada que cumple con más de 20 caracteres.'
    });

    expect(component.formRelato.valid).toBeTrue();
  });

  it('should include vinculoUniversidad in formVictimario', () => {
    expect(component.formVictimario.contains('vinculoUniversidad')).toBeTrue();
    component.formVictimario.get('vinculoUniversidad')?.setValue('Estudiante');
    expect(component.formVictimario.get('vinculoUniversidad')?.value).toBe('Estudiante');
  });

  it('should open success dialog when submitting report', () => {
    component.enviarReporte();
    expect(dialog.open).toHaveBeenCalled();
  });
});
