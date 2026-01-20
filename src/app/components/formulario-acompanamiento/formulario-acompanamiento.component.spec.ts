import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioAcompanamientoComponent } from './formulario-acompanamiento.component';

describe('FormularioAcompanamientoComponent', () => {
  let component: FormularioAcompanamientoComponent;
  let fixture: ComponentFixture<FormularioAcompanamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioAcompanamientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormularioAcompanamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
