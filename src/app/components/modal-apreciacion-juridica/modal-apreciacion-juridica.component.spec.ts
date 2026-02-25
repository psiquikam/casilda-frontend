import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalApreciacionJuridicaComponent } from './modal-apreciacion-juridica.component';

describe('ModalApreciacionJuridicaComponent', () => {
  let component: ModalApreciacionJuridicaComponent;
  let fixture: ComponentFixture<ModalApreciacionJuridicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalApreciacionJuridicaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalApreciacionJuridicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
