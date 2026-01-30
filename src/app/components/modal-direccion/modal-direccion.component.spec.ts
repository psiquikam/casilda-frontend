import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDireccionComponent } from './modal-direccion.component';

describe('ModalDireccionComponent', () => {
  let component: ModalDireccionComponent;
  let fixture: ComponentFixture<ModalDireccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDireccionComponent]
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
