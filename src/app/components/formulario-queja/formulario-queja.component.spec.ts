import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioQuejaComponent } from './formulario-queja.component';

describe('FormularioQuejaComponent', () => {
  let component: FormularioQuejaComponent;
  let fixture: ComponentFixture<FormularioQuejaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioQuejaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormularioQuejaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
