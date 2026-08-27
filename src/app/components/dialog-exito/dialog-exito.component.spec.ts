import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogoExitoComponent } from './dialog-exito.component';

describe('DialogoExitoComponent', () => {
  let component: DialogoExitoComponent;
  let fixture: ComponentFixture<DialogoExitoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoExitoComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogoExitoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
