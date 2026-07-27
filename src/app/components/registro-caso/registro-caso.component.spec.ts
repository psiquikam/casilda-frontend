import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroCasoComponent } from './registro-caso.component';

describe('RegistroCasoComponent', () => {
  let component: RegistroCasoComponent;
  let fixture: ComponentFixture<RegistroCasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroCasoComponent]
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
