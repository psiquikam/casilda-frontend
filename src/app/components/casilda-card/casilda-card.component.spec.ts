import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasildaCardComponent } from './casilda-card.component';

describe('CasildaCardComponent', () => {
  let component: CasildaCardComponent;
  let fixture: ComponentFixture<CasildaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasildaCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CasildaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
