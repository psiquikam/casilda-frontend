import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { futureDateTime, ReprogramarCitaModalComponent } from './modal-reprogramar-cita.component';

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

  it('acepta fecha futura en formato ISO y local', () => {
    const tomorrow = new Date(Date.now() + 36 * 60 * 60 * 1000);
    const isoDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const localDate = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;

    expect(futureDateTime(reprogramForm(isoDate))).toBeNull();
    expect(futureDateTime(reprogramForm(localDate))).toBeNull();
    expect(futureDateTime(reprogramForm(tomorrow))).toBeNull();
  });

  it('rechaza fechas y horas inválidas o vencidas', () => {
    expect(futureDateTime(reprogramForm('01/01/2020'))).toEqual(jasmine.objectContaining({
      invalidDateTime: jasmine.any(Object)
    }));
    expect(futureDateTime(reprogramForm('31/02/2020'))).toEqual(jasmine.objectContaining({
      invalidDateTime: jasmine.any(Object)
    }));
    expect(futureDateTime(reprogramForm('2030-01-01', '25:30'))).toEqual(jasmine.objectContaining({
      invalidDateTime: jasmine.any(Object)
    }));
  });
});

function reprogramForm(fechaCita: string | Date, horaCita = '10:30'): FormGroup {
  return new FormGroup({
    fechaCita: new FormControl(fechaCita),
    horaCita: new FormControl(horaCita)
  });
}
