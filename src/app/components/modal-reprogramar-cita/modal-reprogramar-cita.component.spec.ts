import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReprogramarCitaComponent } from './modal-reprogramar-cita.component';

describe('ReprogramarCitaComponent', () => {
  let component: ReprogramarCitaComponent;
  let fixture: ComponentFixture<ReprogramarCitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReprogramarCitaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReprogramarCitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
