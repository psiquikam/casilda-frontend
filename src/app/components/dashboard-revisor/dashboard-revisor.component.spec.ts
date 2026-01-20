import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRevisorComponent } from './dashboard-revisor.component';

describe('DashboardRevisorComponent', () => {
  let component: DashboardRevisorComponent;
  let fixture: ComponentFixture<DashboardRevisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRevisorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardRevisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
