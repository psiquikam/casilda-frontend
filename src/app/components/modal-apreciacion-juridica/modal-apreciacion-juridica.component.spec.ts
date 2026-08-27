import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalApreciacionJuridicaComponent } from './modal-apreciacion-juridica.component';

describe('ModalApreciacionJuridicaComponent', () => {
  let component: ModalApreciacionJuridicaComponent;
  let fixture: ComponentFixture<ModalApreciacionJuridicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalApreciacionJuridicaComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalApreciacionJuridicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
