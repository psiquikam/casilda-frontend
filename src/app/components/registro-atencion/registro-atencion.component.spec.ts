import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroAtencionComponent } from './registro-atencion.component';

describe('RegistroAtencionComponent', () => {
  let component: RegistroAtencionComponent;
  let fixture: ComponentFixture<RegistroAtencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAtencionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistroAtencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
