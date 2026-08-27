import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalHechosComponent } from './modal-hechos.component';

describe('ModalHechosComponent', () => {
  let component: ModalHechosComponent;
  let fixture: ComponentFixture<ModalHechosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalHechosComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalHechosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
