import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepartoModalComponent } from './modal-reparto.component';

describe('RepartoModalComponent', () => {
  let component: RepartoModalComponent;
  let fixture: ComponentFixture<RepartoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepartoModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RepartoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
