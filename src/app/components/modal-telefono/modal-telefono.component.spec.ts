import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTelefonoComponent } from './modal-telefono.component';

describe('ModalTelefonoComponent', () => {
  let component: ModalTelefonoComponent;
  let fixture: ComponentFixture<ModalTelefonoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalTelefonoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalTelefonoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
