import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDetalleSolicitudComponent } from './modal-detalle-solicitud.component';

describe('ModalDetalleSolicitudComponent', () => {
  let component: ModalDetalleSolicitudComponent;
  let fixture: ComponentFixture<ModalDetalleSolicitudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDetalleSolicitudComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalDetalleSolicitudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
