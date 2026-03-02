import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaOtrosCasosComponent } from './tabla-otros-casos.component';

describe('TablaOtrosCasosComponent', () => {
  let component: TablaOtrosCasosComponent;
  let fixture: ComponentFixture<TablaOtrosCasosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaOtrosCasosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaOtrosCasosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
