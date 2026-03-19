import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasildaHomeComponent } from './casilda-home.component';

describe('CasildaHomeComponent', () => {
  let component: CasildaHomeComponent;
  let fixture: ComponentFixture<CasildaHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasildaHomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CasildaHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
