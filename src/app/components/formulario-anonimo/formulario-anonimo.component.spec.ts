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

  it('should initialize all 7 violence category radios to NO and selection arrays empty', () => {
    expect(component.formRelato.get('violenciaPsicologica')?.value).toBe('NO');
    expect(component.formRelato.get('violenciaFisica')?.value).toBe('NO');
    expect(component.formRelato.get('violenciaSexual')?.value).toBe('NO');
    expect(component.formRelato.get('violenciaInstitucional')?.value).toBe('NO');
    expect(component.formRelato.get('violenciaEconomica')?.value).toBe('NO');
    expect(component.formRelato.get('violenciaInformatica')?.value).toBe('NO');
    expect(component.formRelato.get('violenciaPrejuicio')?.value).toBe('NO');

    expect(component.psicologicaSel).toEqual([]);
    expect(component.fisicaSel).toEqual([]);
    expect(component.sexualSel).toEqual([]);
    expect(component.institucionalSel).toEqual([]);
    expect(component.economicaSel).toEqual([]);
    expect(component.informaticaSel).toEqual([]);
    expect(component.prejuicioSel).toEqual([]);
    expect(component.tieneViolenciaSeleccionada).toBeFalse();
  });

  it('should toggle violence to SI, synchronize tipoVbg, and select modalities with onCheckboxChange', () => {
    component.formRelato.get('violenciaPsicologica')?.setValue('SI');
    expect(component.tieneViolenciaSeleccionada).toBeTrue();
    expect(component.formRelato.get('tipoVbg')?.value).toContain('Violencia Psicológica');

    // Add modality
    component.onCheckboxChange({ checked: true }, 1, 'psicologicaSel');
    component.onCheckboxChange({ checked: true }, 2, 'psicologicaSel');
    expect(component.psicologicaSel).toEqual([1, 2]);

    // Uncheck modality
    component.onCheckboxChange({ checked: false }, 1, 'psicologicaSel');
    expect(component.psicologicaSel).toEqual([2]);

    // Switch radio back to NO - clears selections and removes from tipoVbg
    component.formRelato.get('violenciaPsicologica')?.setValue('NO');
    expect(component.psicologicaSel).toEqual([]);
    expect(component.formRelato.get('tipoVbg')?.value).not.toContain('Violencia Psicológica');
    expect(component.tieneViolenciaSeleccionada).toBeFalse();
  });

  it('should have all 7 modality lists populated with options matching the requirements', () => {
    expect(component.listaPsicologica.length).toBe(7);
    expect(component.listaPsicologica.map(m => m.nombre)).toContain('Abuso de poder y/o confianza');
    expect(component.listaPsicologica.map(m => m.nombre)).toContain('Lenguaje misógino, sexista o discursos de odio');

    expect(component.listaFisica.length).toBe(5);
    expect(component.listaFisica.map(m => m.nombre)).toContain('Feminicidio (Tentativa o comisión)');

    expect(component.listaSexual.length).toBe(4);
    expect(component.listaSexual.map(m => m.nombre)).toContain('Acceso carnal');
    expect(component.listaSexual.map(m => m.nombre)).toContain('Violencia sexual correctiva');

    expect(component.listaInstitucional.length).toBe(3);
    expect(component.listaInstitucional.map(m => m.nombre)).toContain('Omisión al deber de debida diligencia');

    expect(component.listaPatrimonial.length).toBe(4);
    expect(component.listaPatrimonial.map(m => m.nombre)).toContain('Control económico');

    expect(component.listaInformatica.length).toBe(5);
    expect(component.listaInformatica.map(m => m.nombre)).toContain('Grooming');
    expect(component.listaInformatica.map(m => m.nombre)).toContain('Sexting');

    expect(component.listaPrejuicio.length).toBe(1);
    expect(component.listaPrejuicio[0].nombre).toBe('Discriminación por género u orientación sexual o identidad de género');
  });

  it('should toggle selectable chips with toggleModalidad and update category state', () => {
    expect(component.isModalidadSeleccionada(1, 'psicologicaSel')).toBeFalse();

    // Select chip
    component.toggleModalidad(1, 'psicologicaSel');
    expect(component.isModalidadSeleccionada(1, 'psicologicaSel')).toBeTrue();
    expect(component.psicologicaSel).toContain(1);
    expect(component.formRelato.get('violenciaPsicologica')?.value).toBe('SI');
    expect(component.tieneViolenciaSeleccionada).toBeTrue();

    // Deselect chip
    component.toggleModalidad(1, 'psicologicaSel');
    expect(component.isModalidadSeleccionada(1, 'psicologicaSel')).toBeFalse();
    expect(component.psicologicaSel).not.toContain(1);
    expect(component.formRelato.get('violenciaPsicologica')?.value).toBe('NO');
  });

  it('should save draft in localStorage with guardarBorrador', () => {
    spyOn(localStorage, 'setItem');
    component.toggleModalidad(2, 'fisicaSel');
    component.guardarBorrador();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'casilda_borrador_anonimo',
      jasmine.any(String)
    );
  });

  it('should require at least one violence type to advance and show error when attempting to advance without selection', () => {
    const mockStepper = { next: jasmine.createSpy('next') } as any;

    expect(component.mostrarErrorTipoVbg).toBeFalse();

    // Intentar avanzar sin haber seleccionado ninguna violencia
    component.avanzarPasoRelato(mockStepper);

    expect(component.mostrarErrorTipoVbg).toBeTrue();
    expect(mockStepper.next).not.toHaveBeenCalled();

    // Seleccionar un chip de violencia
    component.toggleModalidad(1, 'psicologicaSel');
    expect(component.mostrarErrorTipoVbg).toBeFalse();

    // Completar el resto de campos obligatorios del relato
    component.formRelato.patchValue({
      tipoLugar: 'interno',
      sedeCampus: 'Campus Apartadó (Seccional Urabá)',
      fecha: '15/08/2026'
    });

    component.avanzarPasoRelato(mockStepper);
    expect(mockStepper.next).toHaveBeenCalled();
  });

  it('should treat descripcion as optional, but require minlength 20 if text is provided', () => {
    const descCtrl = component.formRelato.get('descripcion');

    // Vacío es válido (opcional)
    descCtrl?.setValue('');
    expect(descCtrl?.valid).toBeTrue();

    // Espacios en blanco es válido (se considera vacío)
    descCtrl?.setValue('   ');
    expect(descCtrl?.valid).toBeTrue();

    // Texto con menos de 20 caracteres es inválido
    descCtrl?.setValue('Texto muy corto');
    expect(descCtrl?.hasError('minlength')).toBeTrue();
    expect(descCtrl?.valid).toBeFalse();

    // Texto con 20 o más caracteres es válido
    descCtrl?.setValue('Este es un relato detallado de los hechos que cumple con la longitud mínima.');
    expect(descCtrl?.valid).toBeTrue();
  });
});
