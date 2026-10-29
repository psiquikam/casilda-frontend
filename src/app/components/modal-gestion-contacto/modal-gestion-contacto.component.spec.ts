import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificacionService } from '../../core/a11y/notificacion.service';
import { ContactoMockService } from '../../services/contacto-mock.service';
import { ModalGestionComponent } from './modal-gestion-contacto.component';

describe('ModalGestionComponent', () => {
  let component: ModalGestionComponent;
  let fixture: ComponentFixture<ModalGestionComponent>;
  let contactoMock: { listarContactos: jasmine.Spy; registrarContacto: jasmine.Spy };
  let dialogRef: { close: jasmine.Spy };
  let notificacion: { error: jasmine.Spy };

  beforeEach(async () => {
    contactoMock = {
      listarContactos: jasmine.createSpy('listarContactos').and.returnValue([]),
      registrarContacto: jasmine.createSpy('registrarContacto').and.returnValue({
        fecha: '2025-12-18T10:00:00',
        hora: '10:00',
        jornada: 'Mañana',
        resultado: 'No contesta',
        observacion: ''
      })
    };
    dialogRef = { close: jasmine.createSpy('close') };
    notificacion = { error: jasmine.createSpy('error') };

    await TestBed.configureTestingModule({
      imports: [ModalGestionComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { id: 1029, codigo: 'ACO-1029', soloLectura: false } },
        { provide: ContactoMockService, useValue: contactoMock },
        { provide: NotificacionService, useValue: notificacion },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads mock history for the selected request', () => {
    expect(contactoMock.listarContactos).toHaveBeenCalledWith(1029);
    expect(component.historialContactos).toEqual([]);
  });

  it('makes observation and appointment fields optional when no answer is selected', () => {
    component.contactoForm.patchValue({ resultado: 'No contesta' });

    expect(component.contactoForm.get('observacion')?.valid).toBeTrue();
    expect(component.contactoForm.get('fechaCita')?.valid).toBeTrue();
    expect(component.contactoForm.get('horaCita')?.valid).toBeTrue();
    expect(component.mostrarCamposCita).toBeFalse();
  });

  it('saves a no-answer attempt using the mock service without requiring other fields', () => {
    component.contactoForm.patchValue({ resultado: 'No contesta' });

    expect(component.contactoForm.valid).toBeTrue();
    component.registrarIntento();

    expect(contactoMock.registrarContacto).toHaveBeenCalledWith(1029, jasmine.objectContaining({
      resultado: 'No contesta',
      observacion: ''
    }));
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('shows previous contact attempts from mock history', () => {
    contactoMock.listarContactos.and.returnValue([{
      fecha: '2025-12-11T09:15:00',
      hora: '09:15',
      jornada: 'Mañana',
      resultado: 'No contesta',
      observacion: ''
    }]);

    component.cargarHistorial();

    expect(component.historialContactos.length).toBe(1);
    expect(component.historialContactos[0].resultado).toBe('No contesta');
  });
});
