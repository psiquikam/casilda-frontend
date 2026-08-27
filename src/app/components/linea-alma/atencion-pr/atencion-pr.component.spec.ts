import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AtencionPrComponent } from './atencion-pr.component';

describe('AtencionPrComponent', () => {
  let component: AtencionPrComponent;
  let fixture: ComponentFixture<AtencionPrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtencionPrComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtencionPrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
