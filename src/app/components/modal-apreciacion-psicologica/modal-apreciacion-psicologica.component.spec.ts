import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalApreciacionPsicologicaComponent } from './modal-apreciacion-psicologica.component';

describe('ModalApreciacionPsicologicaComponent', () => {
  let component: ModalApreciacionPsicologicaComponent;
  let fixture: ComponentFixture<ModalApreciacionPsicologicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalApreciacionPsicologicaComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalApreciacionPsicologicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
