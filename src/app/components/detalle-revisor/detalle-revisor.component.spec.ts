import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { DetalleRevisorComponent } from './detalle-revisor.component';

describe('DetalleRevisorComponent', () => {
  let component: DetalleRevisorComponent;
  let fixture: ComponentFixture<DetalleRevisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleRevisorComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([])
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetalleRevisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
