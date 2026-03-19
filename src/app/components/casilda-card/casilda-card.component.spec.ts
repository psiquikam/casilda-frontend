import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CASILDACARDComponent } from './casilda-card.component';

describe('CASILDACARDComponent', () => {
  let component: CASILDACARDComponent;
  let fixture: ComponentFixture<CASILDACARDComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CASILDACARDComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CASILDACARDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
