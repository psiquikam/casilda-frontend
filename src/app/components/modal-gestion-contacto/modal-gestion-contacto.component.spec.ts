import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGestionContactoComponent } from './modal-gestion-contacto.component';

describe('ModalGestionContactoComponent', () => {
  let component: ModalGestionContactoComponent;
  let fixture: ComponentFixture<ModalGestionContactoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGestionContactoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalGestionContactoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
