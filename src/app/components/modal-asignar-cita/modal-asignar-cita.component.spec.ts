import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AsignarCitaModalComponent } from './modal-asignar-cita.component';

describe('AsignarCitaModalComponent', () => {
  let component: AsignarCitaModalComponent;
  let fixture: ComponentFixture<AsignarCitaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarCitaModalComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AsignarCitaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
