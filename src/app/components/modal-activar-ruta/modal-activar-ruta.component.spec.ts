import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalActivarRutaComponent } from './modal-activar-ruta.component';

describe('ModalActivarRutaComponent', () => {
  let component: ModalActivarRutaComponent;
  let fixture: ComponentFixture<ModalActivarRutaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalActivarRutaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalActivarRutaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
