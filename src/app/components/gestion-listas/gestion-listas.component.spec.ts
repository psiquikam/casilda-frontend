import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionListasComponent } from './gestion-listas.component';

describe('GestionListasComponent', () => {
  let component: GestionListasComponent;
  let fixture: ComponentFixture<GestionListasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionListasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionListasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
