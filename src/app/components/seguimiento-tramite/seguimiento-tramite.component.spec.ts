import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { SeguimientoTramiteComponent } from './seguimiento-tramite.component';

describe('SeguimientoQuejaComponent', () => {
  let component: SeguimientoTramiteComponent;
  let fixture: ComponentFixture<SeguimientoTramiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeguimientoTramiteComponent],
      providers: [
        provideNoopAnimations()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeguimientoTramiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
