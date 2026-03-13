import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCompromisosPersonaComponent } from './modal-compromisos-persona.component';

describe('ModalCompromisosPersonaComponent', () => {
  let component: ModalCompromisosPersonaComponent;
  let fixture: ComponentFixture<ModalCompromisosPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCompromisosPersonaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalCompromisosPersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
