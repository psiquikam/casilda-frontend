import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaCasosComponent } from './tabla-casos.component';

describe('TablaCasosComponent', () => {
  let component: TablaCasosComponent;
  let fixture: ComponentFixture<TablaCasosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaCasosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaCasosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
