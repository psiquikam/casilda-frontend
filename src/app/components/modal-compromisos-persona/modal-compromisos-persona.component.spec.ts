import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ModalCompromisosPersonaComponent } from './modal-compromisos-persona.component';

describe('ModalCompromisosPersonaComponent', () => {
  let component: ModalCompromisosPersonaComponent;
  let fixture: ComponentFixture<ModalCompromisosPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCompromisosPersonaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalCompromisosPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
