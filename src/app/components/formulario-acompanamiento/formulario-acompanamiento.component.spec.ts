import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { FormularioAcompanamientoComponent } from './formulario-acompanamiento.component';
import { SolicitudService } from '../../services/solicitud.service';

describe('FormularioAcompanamientoComponent', () => {
  let component: FormularioAcompanamientoComponent;
  let fixture: ComponentFixture<FormularioAcompanamientoComponent>;
  let solicitudService: SolicitudService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioAcompanamientoComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioAcompanamientoComponent);
    component = fixture.componentInstance;
    solicitudService = fixture.debugElement.injector.get(SolicitudService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep optional place and required description controls for facts', () => {
    expect(component.acompanamientoForm.get('tipoLugar')?.value).toBeNull();
    expect(component.acompanamientoForm.get('tipoLugar')?.hasError('required')).toBeFalse();
    expect(component.acompanamientoForm.contains('descripcionHechos')).toBeTrue();
    expect(component.acompanamientoForm.contains('relacionMisional')).toBeFalse();
    expect(component.acompanamientoForm.contains('fechaHechos')).toBeFalse();
    expect(component.acompanamientoForm.contains('tipoVbg')).toBeFalse();
    expect(component.acompanamientoForm.get('agresorRemitirUad')?.value).toBe('no');
  });

  it('should make birth date optional and require at least one email and phone', () => {
    expect(component.acompanamientoForm.get('fechaNacimiento')?.hasError('required')).toBeFalse();
    expect(component.acompanamientoForm.get('correos')?.hasError('required')).toBeTrue();
    expect(component.acompanamientoForm.get('telefonos')?.hasError('required')).toBeTrue();
    expect(component.acompanamientoForm.get('descripcionHechos')?.hasError('required')).toBeTrue();

    component.acompanamientoForm.patchValue({
      correos: [{ tipoId: 1, correo: 'persona@udea.edu.co' }],
      telefonos: [{ tipoId: 1, telefono: '3001234567' }]
    });

    expect(component.acompanamientoForm.get('correos')?.valid).toBeTrue();
    expect(component.acompanamientoForm.get('telefonos')?.valid).toBeTrue();
  });

  it('should show field-level errors after an invalid submission', () => {
    component.acompanamientoForm.patchValue({
      tipoReporte: 'directa',
      medioSolicitud: 'presencial'
    });
    fixture.detectChanges();

    component.enviarSolicitud();
    fixture.detectChanges();

    const contenido = fixture.nativeElement.textContent;
    expect(contenido).toContain('Seleccione el tipo de documento');
    expect(contenido).toContain('Ingrese el número de documento');
    expect(contenido).toContain('Ingrese el primer nombre');
    expect(contenido).toContain('Ingrese el primer apellido');
    expect(contenido).toContain('Seleccione la identidad de género');
    expect(contenido).toContain('Agregue al menos un correo electrónico');
    expect(contenido).toContain('Agregue al menos un teléfono');
    expect(contenido).toContain('Describa los hechos para continuar');
  });

  it('should identify whether alleged aggressor belongs to UdeA community', () => {
    component.vinculosUniversidad = [
      { id: 1, nombre: 'Estudiante' },
      { id: 2, nombre: 'Persona externa' }
    ];
    component.acompanamientoForm.get('agresorVinculoUniversidad')?.setValue(1);
    expect(component.esVictimarioUdea).toBeTrue();

    component.acompanamientoForm.get('agresorVinculoUniversidad')?.setValue(2);
    expect(component.esVictimarioUdea).toBeFalse();
    expect(component.acompanamientoForm.get('agresorRemitirUad')?.value).toBe('no');
  });

  it('should add and remove evidence files', () => {
    const file = new File(['test content'], 'evidencia.pdf', { type: 'application/pdf' });
    const event = {
      target: {
        files: [file],
        value: 'fake-path'
      }
    } as unknown as Event;

    component.onArchivosSeleccionados(event);
    expect(component.archivosEvidencia.length).toBe(1);
    expect(component.archivosEvidencia[0].nombre).toBe('evidencia.pdf');

    component.eliminarArchivo(0);
    expect(component.archivosEvidencia.length).toBe(0);
  });

  it('should navigate to /consulta (Bandeja de reparto) upon successful submission', () => {
    const navigateSpy = spyOn(component['router'], 'navigate').and.returnValue(Promise.resolve(true));
    const mockResponse = {
      id: 99,
      codigo: 'CAS-99',
      tipoSolicitud: 'Directa',
      estado: 'CREADA',
      fechaCreacion: '2026-10-27'
    };

    spyOn(solicitudService, 'crearAcompanamiento').and.returnValue(of(mockResponse as any));
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of(true)
    } as any);

    component.acompanamientoForm.patchValue({
      tipoReporte: 'directa',
      medioSolicitud: 'presencial',
      tipoDocumento: 1,
      numeroDocumento: '12345678',
      fechaNacimiento: null,
      primerNombre: 'Ana',
      primerApellido: 'Pérez',
      identidadGenero: 1,
      vinculoUniversidad: 2,
      correos: [{ tipoId: 1, correo: 'ana@udea.edu.co' }],
      telefonos: [{ tipoId: 1, telefono: '3001234567' }],
      descripcionHechos: 'Descripción requerida para registrar la solicitud.'
    });
    component.correoRegistrados = [{ tipoId: 1, correo: 'ana@udea.edu.co' }];
    component.telefonosRegistrados = [{ tipoId: 1, telefono: '3001234567' }];

    component.enviarSolicitud();

    expect(solicitudService.crearAcompanamiento).toHaveBeenCalled();
    const payload = (solicitudService.crearAcompanamiento as jasmine.Spy).calls.mostRecent().args[0];
    expect(payload.datosSolicitante.fechaNacimiento).toBeNull();
    expect(payload.datosSolicitante.vinculoUniversidadId).toBe(2);
    expect(payload.lugarOcurrencia).toBeNull();
    expect(component['dialog'].open).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/consulta']);
  });
});
