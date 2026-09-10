import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should toggle sidenav only when sidebar mode is active', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.navLayout.setLayout('sidebar');
    fixture.detectChanges();

    // In sidebar mode, onToggleSidenav triggers toggle if sidenav exists
    expect(app.navLayout.isSidebar()).toBeTrue();
    app.onToggleSidenav();

    // Switch to horizontal
    app.navLayout.setLayout('horizontal');
    fixture.detectChanges();
    expect(app.navLayout.isHorizontal()).toBeTrue();
    expect(app.navLayout.isSidebar()).toBeFalse();
  });

});
