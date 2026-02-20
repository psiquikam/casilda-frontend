import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAsignarCitaComponent } from './modal-asignar-cita.component';

describe('ModalAsignarCitaComponent', () => {
  let component: ModalAsignarCitaComponent;
  let fixture: ComponentFixture<ModalAsignarCitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAsignarCitaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalAsignarCitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
