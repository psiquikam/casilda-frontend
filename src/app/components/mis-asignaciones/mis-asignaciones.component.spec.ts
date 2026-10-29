import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { NotificacionService } from '../../core/a11y/notificacion.service';
import { ContactoMockService } from '../../services/contacto-mock.service';
import { ModalGestionComponent } from '../modal-gestion-contacto/modal-gestion-contacto.component';
import { MisAsignacionesComponent } from './mis-asignaciones.component';

describe('MisAsignacionesComponent', () => {
  let component: MisAsignacionesComponent;
  let fixture: ComponentFixture<MisAsignacionesComponent>;
  let contactoMock: { listarSolicitudes: jasmine.Spy; desistir: jasmine.Spy };
  let dialog: { open: jasmine.Spy };
  let notificacion: { exito: jasmine.Spy };

  beforeEach(async () => {
    contactoMock = {
      listarSolicitudes: jasmine.createSpy('listarSolicitudes').and.returnValue([{
        id: 1029,
        codigo: 'ACO-1029',
        fechaAsignacion: '2025-12-18',
        profesional: 'Dr. Ricardo Luna',
        solicitante: 'Laura V.',
        fechaCita: null,
        estado: 'En espera de cita'
      }]),
      desistir: jasmine.createSpy('desistir')
    };
    dialog = {
      open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(false) })
    };
    notificacion = {
      exito: jasmine.createSpy('exito')
    };

    await TestBed.configureTestingModule({
      imports: [MisAsignacionesComponent],
      providers: [
        { provide: ContactoMockService, useValue: contactoMock },
        { provide: MatDialog, useValue: dialog },
        { provide: NotificacionService, useValue: notificacion }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisAsignacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the seeded mock assignments', () => {
    expect(contactoMock.listarSolicitudes).toHaveBeenCalled();
    expect(component.misCasos[0].codigo).toBe('ACO-1029');
    expect(component.cantidadEnEspera).toBe(1);
  });

  it('opens the contact modal with the selected numeric request ID', () => {
    component.gestionar(component.misCasos[0]);

    expect(dialog.open).toHaveBeenCalledWith(ModalGestionComponent, jasmine.objectContaining({
      data: jasmine.objectContaining({ id: 1029, codigo: 'ACO-1029', soloLectura: false })
    }));
  });

  it('marks an assignment as withdrawn and refreshes the mock list', () => {
    component.desistir(component.misCasos[0]);

    expect(contactoMock.desistir).toHaveBeenCalledWith(1029);
    expect(contactoMock.listarSolicitudes).toHaveBeenCalledTimes(2);
    expect(notificacion.exito).toHaveBeenCalled();
  });
});
