import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ReprogramarCitaModalComponent } from './modal-reprogramar-cita.component';

describe('ReprogramarCitaModalComponent', () => {
  let component: ReprogramarCitaModalComponent;
  let fixture: ComponentFixture<ReprogramarCitaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReprogramarCitaModalComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: { accion: '', caso: { id: '', nombre: '', fecha: '' } } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReprogramarCitaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
