import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalApreciacionPsicologicaComponent } from './modal-apreciacion-psicologica.component';

describe('ModalApreciacionPsicologicaComponent', () => {
  let component: ModalApreciacionPsicologicaComponent;
  let fixture: ComponentFixture<ModalApreciacionPsicologicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalApreciacionPsicologicaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalApreciacionPsicologicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
