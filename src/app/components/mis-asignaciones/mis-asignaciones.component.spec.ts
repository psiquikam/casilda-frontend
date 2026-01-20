import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisAsignacionesComponent } from './mis-asignaciones.component';

describe('MisAsignacionesComponent', () => {
  let component: MisAsignacionesComponent;
  let fixture: ComponentFixture<MisAsignacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisAsignacionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MisAsignacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
