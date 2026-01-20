import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepartoAcompanamientoComponent } from './reparto-acompanamiento.component';

describe('RepartoComponent', () => {
  let component: RepartoAcompanamientoComponent;
  let fixture: ComponentFixture<RepartoAcompanamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepartoAcompanamientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RepartoAcompanamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
