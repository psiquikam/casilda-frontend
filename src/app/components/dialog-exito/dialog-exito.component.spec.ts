import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogExitoComponent } from './dialog-exito.component';

describe('DialogExitoComponent', () => {
  let component: DialogExitoComponent;
  let fixture: ComponentFixture<DialogExitoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogExitoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogExitoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
