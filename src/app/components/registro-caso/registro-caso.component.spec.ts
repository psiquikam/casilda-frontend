import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RegistroCasoComponent } from './registro-caso.component';

describe('RegistroCasoComponent', () => {
  let component: RegistroCasoComponent;
  let fixture: ComponentFixture<RegistroCasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroCasoComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RegistroCasoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
