import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HorizontalNavComponent } from './horizontal-nav.component';
import { AuthService } from '../../../services/auth.service';

describe('HorizontalNavComponent', () => {
  let component: HorizontalNavComponent;
  let fixture: ComponentFixture<HorizontalNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorizontalNavComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HorizontalNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
