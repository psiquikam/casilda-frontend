import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleAconpanamientoComponent } from './gestion-contacto.component';

describe('DetalleAconpanamientoComponent', () => {
  let component: DetalleAconpanamientoComponent;
  let fixture: ComponentFixture<DetalleAconpanamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleAconpanamientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetalleAconpanamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
