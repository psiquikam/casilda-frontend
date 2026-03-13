import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSeguimientosComponent } from './modal-seguimiento.component';

describe('ModalRemisionesComponent', () => {
  let component: ModalSeguimientosComponent;
  let fixture: ComponentFixture<ModalSeguimientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSeguimientosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalSeguimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
