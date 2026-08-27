import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalDetalleSolicitudComponent } from './modal-detalle-solicitud.component';

describe('ModalDetalleSolicitudComponent', () => {
  let component: ModalDetalleSolicitudComponent;
  let fixture: ComponentFixture<ModalDetalleSolicitudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDetalleSolicitudComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { modo: '', info: { id: '', tipoSolicitud: '' } } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalDetalleSolicitudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
