import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtencionPrComponent } from './atencion-pr.component';

describe('AtencionPrComponent', () => {
  let component: AtencionPrComponent;
  let fixture: ComponentFixture<AtencionPrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtencionPrComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtencionPrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
