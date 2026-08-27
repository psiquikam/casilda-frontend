import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalDireccionComponent } from './modal-direccion.component';

describe('ModalDireccionComponent', () => {
  let component: ModalDireccionComponent;
  let fixture: ComponentFixture<ModalDireccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDireccionComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalDireccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
