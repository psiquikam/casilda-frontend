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

  it('should conditionally require both victim name and cargo (vinculo) when deseaDatosVictima is si', () => {
    component.formPerfil.get('deseaDatosVictima')?.setValue('si');
    expect(component.formPerfil.valid).toBeFalse();
    expect(component.formVictima.get('nombre')?.hasError('required')).toBeTrue();
    expect(component.formVictima.get('cargo')?.hasError('required')).toBeTrue();

    component.formVictima.get('nombre')?.setValue('Persona Afectada');
    expect(component.formPerfil.valid).toBeFalse();

    component.formVictima.get('cargo')?.setValue('Estudiante');
    expect(component.formPerfil.valid).toBeTrue();

    component.formPerfil.get('deseaDatosVictima')?.setValue('no');
    expect(component.formVictima.get('nombre')?.hasError('required')).toBeFalse();
    expect(component.formVictima.get('cargo')?.hasError('required')).toBeFalse();
    expect(component.formPerfil.valid).toBeTrue();
  });

  it('should require at least one contact method when deseaContacto is si', () => {
    expect(component.formPerfil.get('deseaContacto')?.value).toBe('no');
    expect(component.contactoRequeridoInvalido).toBeFalse();

    component.formPerfil.get('deseaContacto')?.setValue('si');
    expect(component.formPerfil.hasError('contactInfoRequired')).toBeTrue();
    expect(component.contactoRequeridoInvalido).toBeTrue();
    expect(component.formPerfil.valid).toBeFalse();

    component.formPerfil.get('correoContacto')?.setValue('persona@udea.edu.co');
    expect(component.formPerfil.hasError('contactInfoRequired')).toBeFalse();
    expect(component.contactoRequeridoInvalido).toBeFalse();
    expect(component.formPerfil.valid).toBeTrue();

    component.formPerfil.get('correoContacto')?.setValue('');
    component.formPerfil.get('whatsappContacto')?.setValue('3001234567');
    expect(component.formPerfil.hasError('contactInfoRequired')).toBeFalse();
    expect(component.formPerfil.valid).toBeTrue();
  });

  it('should not require re-entering email if affected person already provided email in victim data', () => {
    component.formPerfil.get('perfil')?.setValue('anonimo');
    component.formPerfil.get('deseaDatosVictima')?.setValue('si');
    component.formVictima.patchValue({
      nombre: 'Víctima Afectada',
      cargo: 'Estudiante',
      correo: 'victima@udea.edu.co'
    });

    component.formPerfil.get('deseaContacto')?.setValue('si');

    expect(component.tieneCorreoVictimaAfectada).toBeTrue();
    expect(component.formPerfil.hasError('contactInfoRequired')).toBeFalse();
    expect(component.contactoRequeridoInvalido).toBeFalse();
    expect(component.formPerfil.valid).toBeTrue();
  });

  it('should reject invalid email format and not consider it as valid contact info', () => {
    component.formPerfil.get('perfil')?.setValue('anonimo');
    component.formPerfil.get('deseaDatosVictima')?.setValue('si');
    component.formVictima.patchValue({
      nombre: 'Víctima Afectada',
      cargo: 'Estudiante',
      correo: 'sdssdsd'
    });

    component.formPerfil.get('deseaContacto')?.setValue('si');

    expect(component.formVictima.get('correo')?.valid).toBeFalse();
    expect(component.tieneCorreoVictimaAfectada).toBeFalse();
    expect(component.formPerfil.hasError('contactInfoRequired')).toBeTrue();
    expect(component.contactoRequeridoInvalido).toBeTrue();
    expect(component.formPerfil.valid).toBeFalse();
  });

  it('should validate numeric identification and phone numbers', () => {
    component.formVictima.get('identificacion')?.setValue('123abc456');
    expect(component.formVictima.get('identificacion')?.valid).toBeFalse();

    component.formVictima.get('identificacion')?.setValue('1234567890');
    expect(component.formVictima.get('identificacion')?.valid).toBeTrue();

    component.formPerfil.get('whatsappContacto')?.setValue('abcde');
    expect(component.formPerfil.get('whatsappContacto')?.valid).toBeFalse();

    component.formPerfil.get('whatsappContacto')?.setValue('3001234567');
    expect(component.formPerfil.get('whatsappContacto')?.valid).toBeTrue();
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

  it('should validate case form with optional hora and multi-select tipoVbg', () => {
    component.formRelato.patchValue({
      tipoLugar: 'interno',
      sedeCampus: 'Campus Apartadó (Seccional Urabá)',
      facultad: 'Facultad de Medicina',
      bloque: 'Bloque 1',
      espacio: 'Aula 101',
      fecha: '15/08/2026',
      hora: '', // Opcional
      tipoVbg: ['Violencia Psicológica', 'Violencia Digital / Informática'],
      descripcion: 'Esta es una descripción detallada que cumple con más de 20 caracteres.'
    });

    expect(component.formRelato.valid).toBeTrue();
  });

  it('should handle UAD referral option when victimario belongs to UdeA', () => {
    expect(component.formVictimario.contains('vinculoUniversidad')).toBeTrue();
    expect(component.formVictimario.contains('remitirUad')).toBeTrue();

    component.formVictimario.get('vinculoUniversidad')?.setValue('Estudiante');
    expect(component.esVictimarioUdea).toBeTrue();

    component.formVictimario.get('remitirUad')?.setValue('si');
    expect(component.formVictimario.get('remitirUad')?.value).toBe('si');

    component.formVictimario.get('vinculoUniversidad')?.setValue('Persona Externa');
    expect(component.esVictimarioUdea).toBeFalse();
    expect(component.formVictimario.get('remitirUad')?.value).toBe('no');
  });

  it('should open success dialog when submitting report', () => {
    component.enviarReporte();
    expect(dialog.open).toHaveBeenCalled();
  });
});
