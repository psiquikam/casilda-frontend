import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FormularioAcompanamientoComponent } from './formulario-acompanamiento.component';

describe('FormularioAcompanamientoComponent', () => {
  let component: FormularioAcompanamientoComponent;
  let fixture: ComponentFixture<FormularioAcompanamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioAcompanamientoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
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
