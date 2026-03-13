import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCompromisosProfesionalesComponent } from './modal-compromisos-profesionales.component';

describe('ModalCompromisosProfesionalesComponent', () => {
  let component: ModalCompromisosProfesionalesComponent;
  let fixture: ComponentFixture<ModalCompromisosProfesionalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCompromisosProfesionalesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalCompromisosProfesionalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
