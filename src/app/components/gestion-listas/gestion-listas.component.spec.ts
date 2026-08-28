import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GestionListasComponent } from './gestion-listas.component';

describe('GestionListasComponent', () => {
  let component: GestionListasComponent;
  let fixture: ComponentFixture<GestionListasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionListasComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
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
