import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      // RouterLink necesita un Router configurado (resuelve ActivatedRoute
      // internamente); sin esto fallaba con NG0201.
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('allows the second surname to be empty', () => {
    expect(component.step1Form.get('segundoApellido')?.valid).toBeTrue();
  });

  it('requires at least two characters when the second surname is provided', () => {
    const segundoApellido = component.step1Form.get('segundoApellido');
    segundoApellido?.setValue('A');
    expect(segundoApellido?.hasError('minlength')).toBeTrue();

    segundoApellido?.setValue('Lo');
    expect(segundoApellido?.valid).toBeTrue();

    segundoApellido?.setValue('A'.repeat(51));
    expect(segundoApellido?.hasError('maxlength')).toBeTrue();
  });
});
