import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalGestionComponent } from './modal-gestion-contacto.component';
import { AsignacionesService } from '../../services/asignaciones.service';

describe('ModalGestionComponent', () => {
  let component: ModalGestionComponent;
  let fixture: ComponentFixture<ModalGestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGestionComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AsignacionesService, useValue: {} },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalGestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('acepta observaciones cortas y rechaza vacías o solo espacios', () => {
    const observacion = component.contactoForm.get('observacion')!;
    observacion.setValue('Sí');
    expect(observacion.valid).toBeTrue();
    observacion.setValue('   ');
    expect(observacion.invalid).toBeTrue();
    observacion.setValue('');
    expect(observacion.invalid).toBeTrue();
  });

  it('permite concertar una cita hoy desde el minuto actual, pero no antes', () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(2026, 10, 25, 16, 30, 45));
      component.contactoForm.patchValue({
        resultado: 'Contesta y se concerta cita',
        fechaCita: new Date(2026, 10, 25),
        horaCita: '16:29'
      });
      expect(component.contactoForm.hasError('invalidDateTime')).toBeTrue();
      component.contactoForm.patchValue({ horaCita: '16:30' });
      expect(component.contactoForm.hasError('invalidDateTime')).toBeFalse();
      component.contactoForm.patchValue({ horaCita: '17:00' });
      expect(component.contactoForm.hasError('invalidDateTime')).toBeFalse();
      component.contactoForm.patchValue({ fechaCita: new Date(2026, 10, 24), horaCita: '17:00' });
      expect(component.contactoForm.hasError('invalidDateTime')).toBeTrue();
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
