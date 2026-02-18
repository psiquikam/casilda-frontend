import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDiscapacidadComponent } from './modal-discapacidad.component';

describe('ModalDiscapacidadComponent', () => {
  let component: ModalDiscapacidadComponent;
  let fixture: ComponentFixture<ModalDiscapacidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDiscapacidadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalDiscapacidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
