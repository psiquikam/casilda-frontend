import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { FormularioAnonimoComponent, RUTA_TRAS_REPORTE, TEXTOS_REPORTE } from './formulario-anonimo.component';
import { NotificacionService } from '../../core/a11y/notificacion.service';

/** Completa los únicos campos obligatorios del flujo para poder enviar. */
function completarObligatorios(component: FormularioAnonimoComponent): void {
  component.formConsentimiento.get('aceptaPolitica')?.setValue(true);
  component.formRelato.get('descripcionHechos')?.setValue('Relato de prueba de los hechos ocurridos.');
  component.formVictimario.get('rutaActivacion')?.setValue(2);
}

const RESPUESTA_201 = {
  id: 481,
  codigo: 'CAS-7Q4M2XABCD',
  fechaRegistro: '2026-11-06T15:20:31Z',
  rutaActivacion: { id: 2, codigo: 'RUTA_X', nombre: 'Asesoría jurídica', estado: 'SOLICITADA' }
};

describe('FormularioAnonimoComponent', () => {
  let component: FormularioAnonimoComponent;
  let fixture: ComponentFixture<FormularioAnonimoComponent>;
  let dialog: MatDialog;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioAnonimoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioAnonimoComponent);
    component = fixture.componentInstance;
    dialog = fixture.debugElement.injector.get(MatDialog);
    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as unknown as MatDialogRef<unknown>);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to anonymous mode when the route declares no modoReporte', () => {
    expect(component.modo).toBe('anonimo');
    expect(component.textos).toBe(TEXTOS_REPORTE.anonimo);
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Reporte anónimo');
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
    expect(component.formVictima.get('primerNombre')?.hasError('required')).toBeTrue();
    expect(component.formVictima.get('primerApellido')?.hasError('required')).toBeTrue();
    expect(component.formVictima.get('cargo')?.hasError('required')).toBeTrue();

    component.formVictima.get('primerNombre')?.setValue('Persona');
    component.formVictima.get('primerApellido')?.setValue('Afectada');
    expect(component.formPerfil.valid).toBeFalse();

    component.formVictima.get('cargo')?.setValue('Estudiante');
    expect(component.formPerfil.valid).toBeTrue();

    component.formPerfil.get('deseaDatosVictima')?.setValue('no');
    expect(component.formVictima.get('primerNombre')?.hasError('required')).toBeFalse();
    expect(component.formVictima.get('primerApellido')?.hasError('required')).toBeFalse();
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
      primerNombre: 'Víctima',
      primerApellido: 'Afectada',
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
      primerNombre: 'Víctima',
      primerApellido: 'Afectada',
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

  it('should apply document maximum length and reject TI for an adult victim', () => {
    component.tiposDocumento = [
      { id: 1, codigo: 'CC', nombre: 'Cédula de ciudadanía' },
      { id: 2, codigo: 'TI', nombre: 'Tarjeta de identidad' }
    ];
    component.formVictima.patchValue({
      tipoDocumento: 2,
      identificacion: '12345678901',
      fechaNacimiento: new Date(2000, 0, 1)
    });

    expect(component.maxLongitudDocumentoVictima).toBe(11);
    expect(component.formVictima.get('tipoDocumento')?.hasError('tiMayorEdad')).toBeTrue();
  });

  it('should require selecting a route before leaving the victimario step', () => {
    expect(component.formVictimario.get('rutaActivacion')?.hasError('required')).toBeTrue();
    component.formVictimario.get('rutaActivacion')?.setValue(3);
    expect(component.formVictimario.get('rutaActivacion')?.valid).toBeTrue();
  });

  it('should keep location optional in formRelato, matching solicitud-acompanamiento', () => {
    expect(component.formRelato.get('tipoLugar')?.value).toBeNull();
    expect(component.formRelato.get('sedeCampus')?.hasError('required')).toBeFalse();
    expect(component.formRelato.get('lugarDetalleExterno')?.hasError('required')).toBeFalse();

    component.formRelato.get('tipoLugar')?.setValue('externo');
    expect(component.formRelato.get('sedeCampus')?.hasError('required')).toBeFalse();
    expect(component.formRelato.get('lugarDetalleExterno')?.hasError('required')).toBeFalse();

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
      tipoVbg: ['Violencia psicológica', 'Violencia digital / informática'],
      descripcion: 'Esta es una descripción detallada que cumple con más de 20 caracteres.',
      descripcionHechos: 'Relato requerido, igual que en la solicitud de acompañamiento.'
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

  it('should POST the report and open the success dialog with the server code', () => {
    completarObligatorios(component);
    component.enviarReporte();

    const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.endsWith('/reportes'));
    expect(req.request.body).toEqual(jasmine.objectContaining({
      descripcionHechos: 'Relato de prueba de los hechos ocurridos.',
      rutaActivacionId: 2,
      tipoDocumentoId: null,
      tipoLugar: null,
      campusId: null
    }));
    req.flush(RESPUESTA_201, { status: 201, statusText: 'Created' });

    expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
      data: jasmine.objectContaining({ codigo: 'CAS-7Q4M2XABCD' })
    }));
  });

  it('should not open the dialog nor send anything when required data is missing', () => {
    component.enviarReporte();
    httpMock.expectNone((r) => r.url.endsWith('/reportes'));
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should send only one request while the first is pending', () => {
    completarObligatorios(component);
    component.enviarReporte();
    component.enviarReporte();
    const reqs = httpMock.match((r) => r.method === 'POST' && r.url.endsWith('/reportes'));
    expect(reqs.length).toBe(1);
    expect(component.enviando).toBeTrue();
  });

  it('should lock the form and clear the draft after a successful submission', () => {
    spyOn(localStorage, 'removeItem');
    completarObligatorios(component);
    component.enviarReporte();
    httpMock.expectOne((r) => r.url.endsWith('/reportes')).flush(RESPUESTA_201, { status: 201, statusText: 'Created' });

    expect(component.reporteEnviado).toBeTrue();
    expect(component.formPerfil.disabled).toBeTrue();
    expect(component.formRelato.disabled).toBeTrue();
    expect(component.formVictimario.disabled).toBeTrue();
    expect(localStorage.removeItem).toHaveBeenCalledWith(TEXTOS_REPORTE.anonimo.claveBorrador);

    component.enviarReporte();
    httpMock.expectNone((r) => r.url.endsWith('/reportes'));
  });

  it('should navigate to the public home when the success dialog closes', () => {
    completarObligatorios(component);
    component.enviarReporte();
    httpMock.expectOne((r) => r.url.endsWith('/reportes')).flush(RESPUESTA_201, { status: 201, statusText: 'Created' });
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_TRAS_REPORTE.anonimo);
    expect(RUTA_TRAS_REPORTE.anonimo).toBe('/home');
  });

  it('should keep the form editable and map server field errors when the API rejects the report', () => {
    const notificacion = TestBed.inject(NotificacionService);
    spyOn(notificacion, 'error');
    completarObligatorios(component);
    component.enviarReporte();
    httpMock.expectOne((r) => r.url.endsWith('/reportes')).flush(
      { status: 400, message: 'Error de validación en los campos', validationErrors: { campusId: 'Seleccione el campus' } },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(dialog.open).not.toHaveBeenCalled();
    expect(component.reporteEnviado).toBeFalse();
    expect(component.enviando).toBeFalse();
    expect(component.formRelato.enabled).toBeTrue();
    expect(component.formRelato.get('sedeCampus')?.hasError('servidor')).toBeTrue();
    expect(notificacion.error).toHaveBeenCalled();
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
    expect(component.formRelato.get('tipoVbg')?.value).toContain('Violencia psicológica');

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
    expect(component.formRelato.get('tipoVbg')?.value).not.toContain('Violencia psicológica');
    expect(component.tieneViolenciaSeleccionada).toBeFalse();
  });

  it('should have all 7 modality lists populated with options matching the requirements', () => {
    expect(component.listaPsicologica.length).toBe(7);
    expect(component.listaPsicologica.map(m => m.nombre)).toContain('Abuso de poder y/o confianza');
    expect(component.listaPsicologica.map(m => m.nombre)).toContain('Lenguaje misógino, sexista o discursos de odio');

    expect(component.listaFisica.length).toBe(5);
    expect(component.listaFisica.map(m => m.nombre)).toContain('Feminicidio (Tentativa o comisión)');

    expect(component.listaSexual.length).toBe(6);
    expect(component.listaSexual.map(m => m.nombre)).toContain('Acceso carnal violento');
    expect(component.listaSexual.map(m => m.nombre)).toContain('Violencia sexual correctiva');

    expect(component.listaInstitucional.length).toBe(3);
    expect(component.listaInstitucional.map(m => m.nombre)).toContain('Omisión al deber de debida diligencia');

    expect(component.listaPatrimonial.length).toBe(4);
    expect(component.listaPatrimonial.map(m => m.nombre)).toContain('Control económico');

    expect(component.listaInformatica.length).toBe(5);
    expect(component.listaInformatica.map(m => m.nombre)).toContain('Grooming');
    expect(component.listaInformatica.map(m => m.nombre)).toContain('Sexting sin consentimiento');

    expect(component.listaPrejuicio.length).toBe(1);
    expect(component.listaPrejuicio[0].nombre).toBe('Discriminación por género u orientación sexual o identidad de género');

    expect(component.listaFormasOcurrencia).toContain('Presencial');
    expect(component.listaDetalleMisional).toContain('Misional docencia');
    expect(component.listaVinculosVictima).toContain('Pareja / expareja');
  });

  it('should contain new controls for forma, misionalidad and victimario vinculos', () => {
    expect(component.formRelato.contains('ambitoOcurrencia')).toBeFalse();
    expect(component.formRelato.contains('otroAmbitoOcurrencia')).toBeFalse();
    expect(component.formRelato.contains('formaOcurrencia')).toBeTrue();
    expect(component.formRelato.contains('relacionMisional')).toBeTrue();
    expect(component.formRelato.contains('detalleMisional')).toBeTrue();

    expect(component.formVictimario.contains('vinculoVictima')).toBeTrue();
    expect(component.formVictimario.contains('otroVinculoUniversidad')).toBeTrue();
    expect(component.formVictimario.contains('otroVinculoVictima')).toBeTrue();
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

  it('should require only the case description to advance', () => {
    const mockStepper = { next: jasmine.createSpy('next') } as unknown as MatStepper;

    component.avanzarPasoRelato(mockStepper);
    expect(mockStepper.next).not.toHaveBeenCalled();
    expect(component.formRelato.get('descripcionHechos')?.hasError('required')).toBeTrue();

    component.formRelato.get('descripcionHechos')?.setValue('Descripción suficiente de los hechos.');

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

/** Modo «Reportar Caso» (Mis Solicitudes, rol USUARIO): mismo flujo, textos sin anonimato. */
describe('FormularioAnonimoComponent en modo autenticado', () => {
  let component: FormularioAnonimoComponent;
  let fixture: ComponentFixture<FormularioAnonimoComponent>;
  let dialog: MatDialog;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioAnonimoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { modoReporte: 'autenticado' } } } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioAnonimoComponent);
    component = fixture.componentInstance;
    dialog = fixture.debugElement.injector.get(MatDialog);
    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as unknown as MatDialogRef<unknown>);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('should read modoReporte from route data and render the authenticated texts', () => {
    expect(component.modo).toBe('autenticado');
    expect(component.textos).toBe(TEXTOS_REPORTE.autenticado);
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Reportar caso');
    expect(h1.textContent).not.toContain('anónimo');
  });

  it('should keep the same five-step flow and validations as the anonymous channel', () => {
    expect(fixture.nativeElement.querySelectorAll('.mat-step-header').length).toBe(5);
    expect(component.formConsentimiento.valid).toBeFalse();
    component.formPerfil.get('deseaContacto')?.setValue('si');
    expect(component.contactoRequeridoInvalido).toBeTrue();
  });

  it('should open the success dialog with the authenticated wording', () => {
    completarObligatorios(component);
    component.enviarReporte();
    httpMock.expectOne((r) => r.url.endsWith('/reportes')).flush(RESPUESTA_201, { status: 201, statusText: 'Created' });
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_TRAS_REPORTE.autenticado);
    expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
      data: jasmine.objectContaining({
        titulo: TEXTOS_REPORTE.autenticado.exitoTitulo,
        labelCodigo: 'ID ÚNICO DE REPORTE'
      })
    }));
  });

  it('should save the draft under a key separate from the anonymous channel', () => {
    spyOn(localStorage, 'setItem');
    component.guardarBorrador();
    expect(localStorage.setItem).toHaveBeenCalledWith('casilda_borrador_reporte', jasmine.any(String));
  });
});
